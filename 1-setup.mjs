import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const walletPath = "./wallet.json";

let payer;
if (fs.existsSync(walletPath)) {
  const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  payer = Keypair.fromSecretKey(Uint8Array.from(secret));
  console.log("Wallet existente cargada:", payer.publicKey.toBase58());
} else {
  payer = Keypair.generate();
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(payer.secretKey)));
  console.log("Wallet nueva creada:", payer.publicKey.toBase58());
  console.log("Guardada en wallet.json (SOLO devnet, no usar en mainnet)");
}

let balance = await connection.getBalance(payer.publicKey);
console.log("Balance actual:", balance / LAMPORTS_PER_SOL, "SOL");

if (balance < 1 * LAMPORTS_PER_SOL) {
  console.log("Pidiendo airdrop de 2 SOL en devnet...");
  try {
    const sig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("Airdrop OK, tx:", sig);
  } catch (e) {
    console.log("Airdrop falló (a veces devnet limita):", e.message);
    console.log("Se puede reintentar en unos minutos o pedir en https://faucet.solana.com");
  }
  balance = await connection.getBalance(payer.publicKey);
  console.log("Balance ahora:", balance / LAMPORTS_PER_SOL, "SOL");
}

console.log("Conexión devnet OK. Wallet lista para crear el token.");
console.log("Public key:", payer.publicKey.toBase58());
