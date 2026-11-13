import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const wallet = new PublicKey("CcRdUfbRZPqxyXAn72m6MfvxXUbiDw61c6EvNyU4NXW3");
const bal = await connection.getBalance(wallet);
console.log("balance SOL:", bal/1e9);
const sigs = await connection.getSignaturesForAddress(wallet, {limit: 10});
console.log("recent txs:", JSON.stringify(sigs, null, 2));
const sig = "39EhoYfCiDarSas9uQwYbM6ZM9TuZ7CdXDKmJkKJXxGez8wgKfNstnyAfSByZTJ6JH1UfPne461w8pNcdofPhcKk";
try {
  const st = await connection.getSignatureStatus(sig);
  console.log("status of failed mint tx:", JSON.stringify(st, null, 2));
} catch(e){ console.log("status check err", e.message); }
