import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const sig = "39EhoYfCiDarSas9uQwYbM6ZM9TuZ7CdXDKmJkKJXxGez8wgKfNstnyAfSByZTJ6JH1UfPne461w8pNcdofPhcKk";
const tx = await connection.getParsedTransaction(sig, {maxSupportedTransactionVersion: 0});
console.log(JSON.stringify(tx, null, 2));
