import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import fs from "fs";

const mint = new PublicKey("3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A");
const metadataUri = "https://muse.ai/files/1475798355622645/1013746574344621/50iwts46qnunoy5wfsy8vcgs/metadata.json";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8"))));

const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
  TOKEN_METADATA_PROGRAM_ID
);
console.log("Mint:", mint.toBase58());
console.log("Metadata PDA:", metadataPDA.toBase58());
console.log("URI:", metadataUri);

const existing = await connection.getAccountInfo(metadataPDA);
if (existing) {
  console.log("La cuenta de metadata YA existe, no se crea de nuevo.");
  console.log("Tamaño:", existing.data.length, "bytes");
} else {
  const ix = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: "Claudia Sheinbaum",
          symbol: "SHNBM",
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  );
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  console.log("Metadata enviada, firma:", sig);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const st = await connection.getSignatureStatus(sig);
    const s = st?.value;
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) {
      if (s.err) throw new Error("Metadata falló en cadena: " + JSON.stringify(s.err));
      console.log("Metadata confirmada:", s.confirmationStatus);
      break;
    }
    if (i === 59) throw new Error("No se confirmó en 60s, firma: " + sig);
  }
  const info = await connection.getAccountInfo(metadataPDA);
  console.log("Cuenta metadata creada, tamaño:", info?.data.length, "bytes");
  const result = JSON.parse(fs.readFileSync("./token-creado.json", "utf-8"));
  result.metadataUri = metadataUri;
  result.metadataAccount = metadataPDA.toBase58();
  result.metadataTx = sig;
  result.image = "https://muse.ai/files/1475798355622645/2118129228772962/dunazl5sezjbo6ogizljng9u/logo-shnbm.png";
  result.metadataExpires = "2026-11-15T00:55:37Z";
  fs.writeFileSync("./token-creado.json", JSON.stringify(result, null, 2));
  console.log("\n--- RESULTADO ---");
  console.log(JSON.stringify(result, null, 2));
}
