import { connection } from "./config.js";
import { PublicKey } from "@solana/web3.js";
import { u32, u8, struct } from "@solana/buffer-layout";
import { publicKey, u64, bool } from "@solana/buffer-layout-utils";
import chalk from "chalk";
import axios from "axios";
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
    console.log("token name : ",data.result.content.metadata.name,"      mint address:", inputMint," price:", price,"SOL");
    return price;
  } catch (err) {
    console.log(err);
  }
}

export async function getBalance(inputWallet) {
  try {
    const response = await fetch(
      "https://mainnet.helius-rpc.com/?api-key=65cdc4e8-7731-4358-940c-1905b6491224",
      {
        method: "POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({"jsonrpc":"2.0","id":"test","method":"getBalance","params":[inputWallet]}),
      }
    );
    const data = await response.json();
    const price = data.result.value;
    console.log(chalk.yellowBright.bgBlack.bold("  🐵 🐵  Get wallet Ballance:                                                                             "));
    console.log("wallet ballance: ", price);
    return price;
  } catch (err) {
    console.log(err);
  }
}


export async function getTokenBalance(inputWallet, mintAddress) {
  try {
    const response = await axios.post(
      'https://mainnet.helius-rpc.com/?api-key=65cdc4e8-7731-4358-940c-1905b6491224',
      {
        jsonrpc: '2.0',
        id: '1',
        method: 'getTokenAccountsByOwner',
        params: [
          inputWallet,
          { mint: mintAddress },
          { encoding: 'jsonParsed' }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data.result.value[0].account.data.parsed.info.tokenAmount.amount;
    console.log(chalk.yellowBright.bgBlack.bold("  🐵 🐵  Get wallet Ballance:                                                                          "));
    console.log(`token ${mintAddress} ballance in wallet ${inputWallet} is : `, data);
    return data;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
  }
}

export async function validBuying(amountOfSol, inputWallet) {
  const Balance = getBalance(inputWallet);
  if (Balance < amountOfSol * Math.pow(10, 9)) {
    return false;
  } else {
    return true;
  }
}
export async function validSelling(amountOfTokenToSell, mintAddress, walletAddress,  decimals) {
  const Balance = await getTokenBalance(walletAddress, mintAddress);
  if (Balance < amountOfTokenToSell * Math.pow(10, decimals)) {
    return false;
  } else {
    return true;
  }
  
}
