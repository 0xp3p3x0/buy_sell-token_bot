import bs58 from "bs58";
import { Keypair, Connection } from "@solana/web3.js";


//const RPC ="https://mainnet.helius-rpc.com/?api-key=ed46375e-1cca-4fc4-95d6-9a43e0195ace";
const RPC ="https://solana-mainnet.core.chainstack.com/c3f9927969c70c494be5e2832e26bacc"
//const RPC ="https://icy-muddy-rain.solana-mainnet.quiknode.pro/233a6a0f7e565d11eb259ef4585ebc27a3bc713f"
//const RPC ="https://solana-mainnet.g.alchemy.com/v2/1WCDmZ5vLNxlG-ZBOyBbO8_rMerEzOYZ";
export const connection = new Connection(RPC, "confirmed");

export const wallet = Keypair.fromSecretKey(bs58.decode("2vST5frHSjNGN3bUuY9RCThVuj9gWnnw6ceSzJw3BGGPxYPjQBqNjrdFK94HptCe6bmUpdoJnsT8q2XSjQNasKJJ"));



