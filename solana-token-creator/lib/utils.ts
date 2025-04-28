import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { type Connection, Transaction } from "@solana/web3.js"

/**
 * Creates a sync native instruction for wrapped SOL
 */
export function createSyncNativeInstruction(account: any) {
  // Use the TOKEN_PROGRAM_ID from @solana/spl-token
  const TOKEN_PROGRAM_ID = new (require("@solana/web3.js").PublicKey)("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

  return {
    programId: TOKEN_PROGRAM_ID,
    keys: [
      {
        pubkey: account,
        isSigner: false,
        isWritable: true,
      },
    ],
    data: Buffer.from([17]),
  }
}

/**
 * Signs and sends a transaction with fallback methods for different wallet providers
 */
export async function signAndSendTransaction(
  wallet: any,
  connection: Connection,
  transaction: Transaction,
  description = "Transaction",
  onStatus?: (status: string) => void,
): Promise<string> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected")
  }

  try {
    // Try different wallet signing methods

    // Method 1: Using signAndSendTransaction if available (most wallets)
    if (typeof wallet.signAndSendTransaction === "function") {
      onStatus?.("Using signAndSendTransaction method...")
      const { signature } = await wallet.signAndSendTransaction({
        transaction,
        description,
      })
      return signature
    }

    // Method 2: Using signTransaction and then sendRawTransaction (Phantom)
    if (typeof wallet.signTransaction === "function") {
      onStatus?.("Using signTransaction method...")
      const signedTransaction = await wallet.signTransaction(transaction)

      // Log what we got back for debugging
      console.log("Signed transaction type:", typeof signedTransaction)
      console.log("Signed transaction properties:", Object.keys(signedTransaction))

      // Handle different return types
      if (signedTransaction instanceof Transaction) {
        const rawTransaction = signedTransaction.serialize()
        return await connection.sendRawTransaction(rawTransaction)
      } else if (typeof signedTransaction.serialize === "function") {
        const rawTransaction = signedTransaction.serialize()
        return await connection.sendRawTransaction(rawTransaction)
      } else if (signedTransaction.signatures || signedTransaction.signature) {
        // Some wallets return the signature directly
        return (
          signedTransaction.signatures?.[0]?.signature?.toString() ||
          signedTransaction.signature?.toString() ||
          "signature-not-found"
        )
      }
    }

    // Method 3: Using sendTransaction directly (some wallets)
    if (typeof wallet.sendTransaction === "function") {
      onStatus?.("Using sendTransaction method...")
      return await wallet.sendTransaction(transaction, connection)
    }

    // If we get here, no method worked
    throw new Error("Wallet does not support any known transaction signing methods")
  } catch (error) {
    console.error("Transaction signing failed:", error)

    // For demo purposes, return a simulated transaction ID
    if (process.env.NODE_ENV === "development") {
      onStatus?.("Wallet signing failed. Simulating transaction for demo purposes...")
      return `simulated-tx-${Date.now()}`
    }

    throw error
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
