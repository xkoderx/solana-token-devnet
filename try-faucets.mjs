import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";
const pub = new PublicKey(JSON.parse(fs.readFileSync("./wallet.json","utf-8")) ? (await import("@solana/web3.js")).Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json","utf-8")))).publicKey.toBase58() : "");
const endpoints = [
  "https://rpc.ankr.com/solana_devnet",
  "https://api.devnet.solana.com",
  "https://solana-devnet.g.alchemy.com/v2/demo",
  "https://devnet.helius-rpc.com/?api-key=demo",
];
for (const url of endpoints) {
  try {
    const c = new Connection(url, "confirmed");
    const bal = await c.getBalance(new PublicKey(pub));
    console.log(url, "balance:", bal/LAMPORTS_PER_SOL);
    if (bal===0) {
      try {
        const sig = await c.requestAirdrop(new PublicKey(pub), 1*LAMPORTS_PER_SOL);
        console.log(url, "airdrop sig:", sig);
      } catch(e){ console.log(url, "airdrop fail:", e.message.slice(0,200)); }
    }
  } catch(e){ console.log(url, "error:", e.message.slice(0,200)); }
}
