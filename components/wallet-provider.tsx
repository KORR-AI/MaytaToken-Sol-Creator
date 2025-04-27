"use client"

import type React from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets"
import { useMemo } from "react"
import { Connection } from "@solana/web3.js"

// Import the config
import { config } from "@/lib/config"

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css"

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.MainnetBeta

  // Create a custom connection with specific configuration
  const endpoint = useMemo(() => {
    // Use the QuickNode endpoint from config
    return config.rpc.mainnet
  }, [])

  // Create a connection configuration that completely disables WebSocket subscriptions
  const connectionConfig = useMemo(
    () => ({
      commitment: config.connection.commitment,
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000,
      httpHeaders: { "Content-Type": "application/json" },
    }),
    [],
  )

  // Only include the wallets you want to support
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  // Create a custom connection factory that ensures WebSockets are disabled
  const connectionFactory = useMemo(() => {
    return (endpoint: string, config: any) => {
      // Force disable WebSockets by setting wsEndpoint to null
      const conn = new Connection(endpoint, {
        ...config,
        wsEndpoint: null,
      })

      // Monkey patch the _rpcWebSocket.connect method to prevent WebSocket connections
      if (conn._rpcWebSocket) {
        const originalConnect = conn._rpcWebSocket.connect.bind(conn._rpcWebSocket)
        conn._rpcWebSocket.connect = () => {
          console.log("WebSocket connection prevented")
          return Promise.resolve()
        }
      }

      return conn
    }
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig} connectionFactory={connectionFactory}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
