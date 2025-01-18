import { buy } from "./buy-helper.js";
import { sell } from "./sell-helper.js";
import { getPrice, getBalance, getTokenBalance } from "./utils.js";
import axios from "axios";
import fs from "fs";

// Configuration
const SLIPPAGE = 1; // 1% slippage
const CHECK_INTERVAL = 15000; // 15 seconds in milliseconds
const BUY_INTERVAL = 600000; // 10 minutes in milliseconds
const POSITIONS_FILE = "positions.json";

// State to track token positions
let positions = {};

/**
 * Load positions from file.
 */
function loadPositions() {
  if (fs.existsSync(POSITIONS_FILE)) {
    const data = fs.readFileSync(POSITIONS_FILE, "utf8");
    if(!data) return;
    positions = JSON.parse(data);
  }
}

/**
 * Save positions to file.
 */
function savePositions() {
  fs.writeFileSync(POSITIONS_FILE, JSON.stringify(positions, null, 2));
}

/**
 * Function to handle buying a token.
 * @param {string} tokenAddress - The token's address.
 * @param {number} solAmount - Amount of SOL to use for the purchase.
 */
async function buyToken(tokenAddress, solAmount) {
  const purchasePrice = await getPrice(tokenAddress);
  await buy(tokenAddress, solAmount, SLIPPAGE);

  // Initialize position
  positions[tokenAddress] = {
    purchasePrice,
    size: solAmount / purchasePrice, // Assuming solAmount is in SOL and price is SOL/token
    remainingPercentage: 100,
  };

  console.log(
    `Bought ${positions[tokenAddress].size} of ${tokenAddress} at ${purchasePrice} SOL.`
  );

  // Save positions to file
  savePositions();
}

/**
 * Function to handle selling a token.
 * @param {string} tokenAddress - The token's address.
 * @param {number} percentage - Percentage of the position to sell.
 */
async function sellToken(tokenAddress, percentage) {
  const position = positions[tokenAddress];
  if (!position) {
    console.error(`No position found for ${tokenAddress}`);
    return;
  }

  const amountToSell = Math.floor((position.size * percentage) / 100);
  const currentPrice = await getPrice(tokenAddress);

  await sell(tokenAddress, amountToSell, SLIPPAGE);
  position.size -= amountToSell;
  position.remainingPercentage -= percentage;

  console.log(
    `Sold ${amountToSell} of ${tokenAddress} at ${currentPrice} SOL.`
  );

  // Save positions to file
  savePositions();
}

/**
 * Function to monitor and handle trading logic.
 */
async function monitorPositions() {
  for (const tokenAddress in positions) {
    const position = positions[tokenAddress];
    const currentPrice = await getPrice(tokenAddress);
    const gain = (currentPrice - position.purchasePrice) / position.purchasePrice;

    console.log("gain : ", gain);

    // Check gain/loss conditions
    if (gain >= 2 && position.remainingPercentage >= 50) {
      await sellToken(tokenAddress, 50);
    } else if (gain >= 1.5 && position.remainingPercentage >= 20) {
      await sellToken(tokenAddress, 20);
    } else if (gain >= 3 && position.remainingPercentage >= 20) {
      await sellToken(tokenAddress, 20);
    } else if (gain < -0.5) {
      await sellToken(tokenAddress, position.remainingPercentage); // Stop-loss
      delete positions[tokenAddress];
      console.log(`Stop-loss triggered for ${tokenAddress}. Exited position.`);
    }
  }
}

/**
 * Function to buy new tokens periodically.
 */
async function buyNewTokens() {
  var tokensToBuy;
  var amountOfSol;

  try {
    const response = await axios.get("http://localhost:3000/api/tokens");
    tokensToBuy = response.data.address;
    amountOfSol = response.data.AmountOfBuy;

    if (!tokensToBuy) {
      throw new Error("There is no token to buy");
    }
    await buyToken(tokensToBuy, amountOfSol);

    console.log("Completed periodic token purchases.");
  } catch (error) {
    console.error("Error fetching tokens:", error);
  }
}

// Main loop to monitor positions and buy new tokens periodically
async function main() {
  // Load positions from file
  loadPositions();

  let lastBuyTime = 0;

  while (true) {
    try {
      // Monitor positions
      await monitorPositions();

      // Check if it's time to buy new tokens
      const currentTime = Date.now();
      if (currentTime - lastBuyTime >= BUY_INTERVAL) {
        await buyNewTokens();
        lastBuyTime = currentTime;
      }
    } catch (error) {
      console.error("Error in main loop:", error);
    }

    // Wait before the next check
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL)); // Check every 15 seconds
  }
}

// Start the bot
main();