import { connection } from "./config.js";
import { PublicKey } from "@solana/web3.js";
import { u32, u8, struct } from "@solana/buffer-layout";
import { publicKey, u64, bool } from "@solana/buffer-layout-utils";
import chalk from "chalk";

const MintLayout = struct([
  u32("mintAuthorityOption"),
  publicKey("mintAuthority"),
  u64("supply"),
  u8("decimals"),
  bool("isInitialized"),
  u32("freezeAuthorityOption"),
  publicKey("freezeAuthority"),
]);

export async function getDecimals(inputMint) {
  const inputMintData = await connection.getAccountInfo(
    new PublicKey(inputMint),
    "confirmed"
  );
  const deserialize = MintLayout.decode(inputMintData.data);
  console.log(deserialize);
  return deserialize.decimals;
}

export async function getPrice(inputMint) {
  try {
    const response = await fetch(
      "https://mainnet.helius-rpc.com/?api-key=65cdc4e8-7731-4358-940c-1905b6491224",
      {
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({"jsonrpc":"2.0","id":"test","method":"getAsset","params":{"id":inputMint}}),
      }
    );
    const data = await response.json();
    const price = data.result.token_info.price_info.price_per_token;
    console.log(chalk.yellowBright.bgBlack.bold("  🐵 🐵  Get token data:                                                                                               "));
    console.log("token name : ",data.result.content.metadata.name," mint address:", inputMint," price:", price,"SOL");
    return price;
  } catch (err) {
    console.log(err);
  }
}


