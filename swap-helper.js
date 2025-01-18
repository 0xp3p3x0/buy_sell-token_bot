import {
  VersionedTransaction,
  PublicKey,
  Connection,
  Keypair,
  sendAndConfirmRawTransaction
} from "@solana/web3.js";
import { getDecimals, validSelling } from "./utils.js";
import { connection, wallet } from "./config.js";

export async function getQuote(
  tokenToSell,
  tokenToBuy,
  convertedAmountOfTokenOut,
  slippage
) {
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${tokenToSell}&outputMint=${tokenToBuy}&amount=${convertedAmountOfTokenOut}&slippageBps=${slippage}`;
  const response = await fetch(url);
  console.log("get quote url : ", url);
  const quote = await response.json();
  return quote;
}

export async function getSwapTransaction(quoteResponse, wallet_pubKey) {
  try {
    let body = null;
    body = {
      quoteResponse,
      userPublicKey: wallet_pubKey,
      wrapAndUnwrapSol: true,
      dynamicComputerUnitLimit: true,
      prioritizationFeeLamports: 10000,
    };
    const resp = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const swapResponse = await resp.json();
    console.log("swap response : ", swapResponse);
    return swapResponse.swapTransaction;
  } catch (error) {
    throw new Error(error);
  }
}

export async function convertToInteger(amount, decimals) {
  return Math.floor(amount * 10 ** decimals);
}

export async function finalizeTransaction(swapTransaction) {
  try {
    let confirmed = null,
      signature = null;

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    const latestBlockhash = await connection.getLatestBlockhash("processed");
    transaction.sign([wallet]);

    const { value: simulatedTransactionResponse } =
      await connection.simulateTransaction(transaction, {
        replaceRecentBlockhash: true,
        commitment: "processed",
      });
    const { err, logs } = simulatedTransactionResponse;
    if (err) {
      // Simulation error, we can check the logs for more details
      // If you are getting an invalid account error, make sure that you have the input mint account to actually swap from.
      console.error("Simulation Error:");
      console.error({ err, logs });
      throw new Error(err);
    }

    const res = await simple_executeAndConfirm(
      transaction,
      wallet,
      latestBlockhash
    );
    signature = res;

    return signature;
  } catch (err) {
    throw new Error(err);
  }
  return null;
}

export async function swap(tokenToSell, tokenToBuy, amountTokenOut, slippage) {
  try {
    const decimals = await getDecimals(new PublicKey(tokenToSell));
    const convertedAmountOfTokenOut = await convertToInteger(
      amountTokenOut,
      decimals
    );
    const quoteResponse = await getQuote(
      tokenToSell,
      tokenToBuy,
      convertedAmountOfTokenOut,
      slippage
    );
    const wallet_PubKey = wallet.publicKey.toBase58();
    const swapTransaction = await getSwapTransaction(
      quoteResponse,
      wallet_PubKey
    );
    const signature = await finalizeTransaction(swapTransaction);
    if (confirmed) {
      console.log("http://solscan.io/tx/" + signature);
    } else {
      console.log("Transaction failed");
      console.log("retrying transaction...");
      await swap(tokenToSell, tokenToBuy, amountTokenOut, slippage);
    }
  } catch (error) {
    console.error(error);
  }
}

export async function simple_executeAndConfirm(
  transaction,
  payer,
  lastestBlockhash
) {
  console.log("Executing transaction...");
  const signature = await simple_execute(transaction);
  console.log("Transaction executed. Confirming transaction...", signature);
  return signature;
}

async function simple_execute(transaction) {
  return connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
    maxRetries: 0,
  });
}

export async function simple_executeAndConfirm_2(
  transaction,
  payer,
  lastestBlockhash
) {
  console.log("Executing na Confirming transaction...");
  const signature = await sendAndConfirmRawTransaction(connection, transaction.serialize(), "confirmed");
  return signature;

}
