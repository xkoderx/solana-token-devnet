import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";

// Lee config de token-config.json, o usa valores por defecto
let config = { name: "Patron Token", symbol: "PTRN", decimals: 6, supply: 1000000 };
if (fs.existsSync("./token-config.json")) {
  config = JSON.parse(fs.readFileSync("./token-config.json", "utf-8"));
}
console.log("Creando token:", config);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf-8"))));
console.log("Wallet:", payer.publicKey.toBase58());

const mint = await createMint(connection, payer, payer.publicKey, null, config.decimals);
console.log("Mint creado:", mint.toBase58());

const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
console.log("Cuenta de token:", tokenAccount.address.toBase58());

const amount = BigInt(config.supply) * BigInt(10 ** config.decimals);
await mintTo(connection, payer, mint, tokenAccount.address, payer, amount);
console.log(`Minteados ${config.supply} ${config.symbol} (${config.decimals} decimales)`);

const result = {
  name: config.name,
  symbol: config.symbol,
  decimals: config.decimals,
  supply: config.supply,
  mint: mint.toBase58(),
  wallet: payer.publicKey.toBase58(),
  tokenAccount: tokenAccount.address.toBase58(),
  explorer: `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`,
  solscan: `https://solscan.io/token/${mint.toBase58()}?cluster=devnet`,
};
fs.writeFileSync("./token-creado.json", JSON.stringify(result, null, 2));
console.log("\n--- RESULTADO ---");
console.log(JSON.stringify(result, null, 2));
console.log("\nNota: nombre y símbolo se guardan en token-config.json. La metadata con imagen (Metaplex) es el siguiente paso, el mint SPL básico no la lleva en cadena.");
