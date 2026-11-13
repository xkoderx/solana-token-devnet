# SHNBM — Token de prueba en Solana devnet

Token de prueba creado con fines educativos, sin valor real.

- **Nombre:** Claudia Sheinbaum
- **Símbolo:** SHNBM
- **Suministro:** 1,000,000
- **Decimales:** 6
- **Red:** Solana Devnet
- **Mint:** `3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A`
- **Wallet (pública):** `CcRdUfbRZPqxyXAn72m6MfvxXUbiDw61c6EvNyU4NXW3`
- **Cuenta de metadata:** `HQUYixzfp9NYwHgDL8HCC27P5hL1mfvtd6MdKDM4TFEA`

Ver el token:
- [Solana Explorer (devnet)](https://explorer.solana.com/address/3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A?cluster=devnet)
- [Solscan (devnet)](https://solscan.io/token/3RiJPyN6FpsSP1vEmqPeHypR9pRukqKwXt96iGtoLQ2A?cluster=devnet)

## Qué hay en este repo

- `1-setup.mjs` — crea la wallet de prueba y pide SOL de devnet (el airdrop por RPC está cerrado, hay que reclamarlo en un faucet web).
- `2-create-token.mjs` — crea el mint SPL y mintea el suministro según `token-config.json`.
- `3-mint-to-existing.mjs` — recupera un mint ya creado y mintea con confirmación por HTTP (sin websocket).
- `4-add-metadata.mjs` — crea la cuenta de metadata de Metaplex con nombre, símbolo e imagen.
- `token-config.json` — nombre, símbolo, suministro y decimales.
- `token-creado.json` — resultado verificado: mint, wallet, cuenta de token y enlaces.
- `metadata.json` — metadata JSON del token.
- `logo-shnbm.png` — logo simple con las letras SHNBM (sin foto de una persona real).

## Cómo levantar el proyecto

```bash
npm install
node 1-setup.mjs
# Reclama SOL de prueba en un faucet de devnet para la dirección que te muestra
node 2-create-token.mjs
node 4-add-metadata.mjs
```

## Seguridad: lee esto antes de continuar

**NUNCA subas `wallet.json` a GitHub.** Ese archivo tiene la clave privada de la wallet de prueba. Quien la tenga puede gastar el SOL y mintear más tokens con esa autoridad. Por eso está en `.gitignore`.

Si clonas este repo en otra computadora, crea tu propia wallet con `node 1-setup.mjs`. La wallet y el mint de este repo son solo para devnet, no tienen valor real.

## Nota sobre la imagen

La imagen y el JSON de metadata están hosteados en un enlace temporal de Muse que vence el **15 de noviembre de 2026**. Después de esa fecha el explorador puede dejar de mostrar la imagen, aunque el nombre y símbolo quedan en cadena. Para hacerlo permanente, sube `logo-shnbm.png` y `metadata.json` a Arweave, IPFS o GitHub y actualiza la metadata con la nueva URI.
