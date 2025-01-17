import { getQuote, getSwapTransaction, convertToInteger, finalizeTransaction} from "./swap-helper.js";
import { PublicKey } from "@solana/web3.js";
import { wallet } from "./config.js";
import { getDecimals } from "./utils.js";
const wsol = "So11111111111111111111111111111111111111112";


export async function buy(tokenToBuy, amountTokenOut, slippage) {
    try {
      const convertedAmountOfTokenOut = await convertToInteger(amountTokenOut,9);
      const quoteResponse = await getQuote(wsol,tokenToBuy,convertedAmountOfTokenOut,slippage);
      console.log(quoteResponse);
      const wallet_PubKey = wallet.publicKey.toBase58();
      const swapTransaction = await getSwapTransaction(quoteResponse,wallet_PubKey);
      const { signature } = await finalizeTransaction(swapTransaction);
      if (signature) {
        console.log("http://solscan.io/tx/" + signature);
      } else {
        console.log("Transaction failed");
        console.log("retrying transaction...");
        await buy(tokenToBuy, amountTokenOut, slippage);
      }
    } catch (error) {
      console.error(error);
    }
  }
  
  async function main() {
    const tokenAddress = "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh";
    const amountOfSOLToUse = 0.015
    const slippage = 1;
    await buy(tokenAddress, amountOfSOLToUse, slippage);
  }
  