// Configuration for the application
export const config = {
  // Solana RPC endpoints
  rpc: {
    // Use Alchemy as the primary RPC endpoint, with fallbacks
    mainnet: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://solana-mainnet.g.alchemy.com/v2/demo",
    // Multiple backup RPC endpoints in case the primary fails
    mainnetBackups: [
      "https://patient-maximum-morning.solana-mainnet.quiknode.pro/eae6e88ab89efa0fa9b863886ac8712a0c400141/",
      "https://api.mainnet-beta.solana.com",
      "https://rpc.ankr.com/solana",
    ],
  },

  // Connection configuration
  connection: {
    commitment: "confirmed" as const,
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 120000, // 120 seconds
    useHttpOnly: true, // Explicitly set to use HTTP only
  },

  // Fee receiver wallet address
  feeReceiver: "2aVRieq358DxwEoZk1CK9CgdexM89CYnAJCfdm1k6baK",

  // Base fee in SOL (reduced for testing)
  baseFee: 0.01,

  // Fee per option in SOL
  optionFee: 0.1,

  // Transaction confirmation settings
  confirmOptions: {
    maxRetries: 10,
    skipPreflight: false,
  },

  // IPFS gateway for resolving ipfs:// URIs
  ipfsGateway: "https://gateway.pinata.cloud/ipfs/",
}

export async function loadConfigFromServer() {
  // This function is intentionally left empty as the config is directly available.
  // It exists to satisfy the import in other modules.
}
