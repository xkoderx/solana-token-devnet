import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createMintToInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./token-config.json", "utf-8"));
const mint = new PublicKey("3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8"))));

async function sendAndPoll(tx, label) {
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  console.log(label, "enviada, firma:", sig);
  // Poll por HTTP, sin websocket (el ws falla en este entorno)
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const st = await connection.getSignatureStatus(sig);
    const s = st?.value;
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) {
      if (s.err) throw new Error(label + " falló en cadena: " + JSON.stringify(s.err));
      console.log(label, "confirmada:", s.confirmationStatus);
      return sig;
    }
  }
  throw new Error(label + " no se confirmó en 60s, firma: " + sig);
}

const ata = await getAssociatedTokenAddress(mint, payer.publicKey);
console.log("Mint:", mint.toBase58());
console.log("Cuenta de token (ATA):", ata.toBase58());

// 1) Crear ATA si no existe
try {
  const ataInfo = await connection.getAccountInfo(ata);
  if (!ataInfo) {
    const tx1 = new Transaction().add(
      createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint)
    );
    await sendAndPoll(tx1, "Crear ATA");
  } else {
    console.log("ATA ya existe, no se crea de nuevo");
  }
} catch (e) {
  console.log("Crear ATA:", e.message);
  throw e;
}

// 2) Mintear suministro
const amount = BigInt(config.supply) * BigInt(10 ** config.decimals);
const tx2 = new Transaction().add(
  createMintToInstruction(mint, ata, payer.publicKey, amount)
);
const mintSig = await sendAndPoll(tx2, "Mintear");

const bal = await connection.getTokenAccountBalance(ata);
console.log("Balance del token en ATA:", bal.value.uiAmount, config.symbol);

const result = {
  name: config.name,
  symbol: config.symbol,
  decimals: config.decimals,
  supply: config.supply,
  mint: mint.toBase58(),
  wallet: payer.publicKey.toBase58(),
  tokenAccount: ata.toBase58(),
  createMintTx: "39EhoYfCiDarSas9uQwYbM6ZM9TuZ7CdXDKmJkKJXxGez8wgKfNstnyAfSByZTJ6JH1UfPne461w8pNcdofPhcKk",
  mintTx: mintSig,
  explorer: `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`,
  solscan: `https://solscan.io/token/${mint.toBase58()}?cluster=devnet`,
};
fs.writeFileSync("./token-creado.json", JSON.stringify(result, null, 2));
console.log("\n--- RESULTADO ---");
console.log(JSON.stringify(result, null, 2));
