import { buy } from "./buy-helper.js";
import { sell } from "./sell-helpers.js"
import { getPrice } from "./utils.js";

// Configuration
const SLIPPAGE = 0.01; // 1% slippage
const CHECK_INTERVAL = 15000; // 15 seconds in milliseconds
const BUY_INTERVAL = 600000; // 10 minutes in milliseconds

// State to track token positions
const positions = {};

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

    console.log(`Bought ${positions[tokenAddress].size} of ${tokenAddress} at ${purchasePrice} SOL.`);
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

    const amountToSell = (position.size * percentage) / 100;
    const currentPrice = await getPrice(tokenAddress);

    await sell(tokenAddress, amountToSell, SLIPPAGE);
    position.size -= amountToSell;
    position.remainingPercentage -= percentage;

    console.log(`Sold ${amountToSell} of ${tokenAddress} at ${currentPrice} SOL.`);
}

/**
 * Function to monitor and handle trading logic.
 */
async function monitorPositions() {
    for (const tokenAddress in positions) {
        const position = positions[tokenAddress];
        const currentPrice = await getPrice(tokenAddress);
        const gain = (currentPrice - position.purchasePrice) / position.purchasePrice;

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
    const tokensToBuy = [
        { address: 'TOKEN_ADDRESS_1', amount: 0.05 }, // Replace with actual token address and amount of SOL
        { address: 'TOKEN_ADDRESS_2', amount: 0.05 },
    ];

    for (const { address, amount } of tokensToBuy) {
        await buyToken(address, amount);
    }

    console.log('Completed periodic token purchases.');
}

// Main loop to monitor positions and buy new tokens periodically
async function main() {
    

    getPrice("2t4GsDfZPW6aqeuDMkvZHRtxW9fLyvw9XVdrMBG3pump");

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
            console.error('Error in main loop:', error);
        }

        // Wait before the next check
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL)); // Check every 15 seconds
    }
}

// Start the bot
main();