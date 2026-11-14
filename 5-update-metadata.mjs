// 5-update-metadata.mjs — Actualiza la URI de metadata en cadena para que
// apunte al metadata.json alojado en GitHub (permanente), en vez del hosting
// temporal de Muse que vence el 2026-11-15.
// La metadata es mutable (isMutable: true) y la update authority es la wallet
// de devnet, así que este script la puede actualizar sin crear nada nuevo.
// Uso: node 5-update-metadata.mjs
// Requiere: wallet.json con SOL de devnet (la comisión es mínima, ~0.00001 SOL)
// y que metadata.json YA esté subido a main en xkoderx/solana-token-devnet.
import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { createUpdateMetadataAccountV2Instruction, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import fs from "fs";

const mint = new PublicKey("3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A");
const newUri = "https://raw.githubusercontent.com/xkoderx/solana-token-devnet/main/metadata.json";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8"))));

const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
  TOKEN_METADATA_PROGRAM_ID
);
console.log("Mint:", mint.toBase58());
console.log("Metadata PDA:", metadataPDA.toBase58());
console.log("Nueva URI:", newUri);

// Pre-vuelo 1: el metadata.json de GitHub debe existir y apuntar al logo de GitHub.
const res = await fetch(newUri);
if (!res.ok) throw new Error("No se pudo leer el metadata.json de GitHub (HTTP " + res.status + "). Súbelo primero a main.");
const hosted = await res.json();
if (hosted.image !== "https://raw.githubusercontent.com/xkoderx/solana-token-devnet/main/logo-shnbm.png") {
  throw new Error("El metadata.json de GitHub todavía no apunta al logo de GitHub. Revisa el archivo antes de actualizar en cadena.");
}
console.log("OK: metadata.json en GitHub apunta al logo de GitHub.");

// Pre-vuelo 2: saldo suficiente para la comisión.
const balance = await connection.getBalance(payer.publicKey);
console.log("Saldo wallet:", balance / 1e9, "SOL");
if (balance < 1_000_000) throw new Error("Saldo insuficiente para la comisión. Reclama SOL de devnet primero.");

// Pre-vuelo 3: si la URI en cadena ya es la de GitHub, no hay nada que hacer.
const existing = await connection.getAccountInfo(metadataPDA);
if (!existing) throw new Error("No existe la cuenta de metadata en cadena.");
if (existing.data.toString("utf8").includes(newUri)) {
  console.log("La metadata en cadena YA apunta a GitHub. Nada que actualizar.");
  process.exit(0);
}
console.log("La metadata en cadena todavía apunta al hosting temporal. Actualizando...");

const ix = createUpdateMetadataAccountV2Instruction(
  { metadata: metadataPDA, updateAuthority: payer.publicKey },
  {
    updateMetadataAccountArgsV2: {
      data: {
        name: "Claudia Sheinbaum",
        symbol: "SHNBM",
        uri: newUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      updateAuthority: null,
      primarySaleHappened: null,
      isMutable: true,
    },
  }
);
const tx = new Transaction().add(ix);
tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
tx.feePayer = payer.publicKey;
tx.sign(payer);
const sig = await connection.sendRawTransaction(tx.serialize());
console.log("Actualización enviada, firma:", sig);
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const st = await connection.getSignatureStatus(sig);
  const s = st?.value;
  if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) {
    if (s.err) throw new Error("La actualización falló en cadena: " + JSON.stringify(s.err));
    console.log("Metadata actualizada:", s.confirmationStatus);
    console.log("Ver en Explorer: https://explorer.solana.com/address/3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A?cluster=devnet");
    break;
  }
}
