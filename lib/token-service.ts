import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
  type Commitment,
} from "@solana/web3.js"

import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  type TokenMetadata,
} from "@solana/spl-token-metadata"

import type { CreateTokenParams, TokenCreationResult } from "./types"
import { calculateFees } from "./fee-calculator"
import { config } from "./config"
import { ipfsUriToGatewayUrl } from "./ipfs-service"
import { signAndSendTransaction } from "./utils"

// Helper function to create an HTTP-only connection
function createHttpOnlyConnection(endpoint: string, commitment = "confirmed") {
  return new Connection(endpoint, {
    commitment: commitment as Commitment,
    wsEndpoint: null, // Explicitly disable WebSockets
  })
}

export async function createToken({
  connection,
  wallet,
  tokenData,
  feeReceiverAddress,
}: CreateTokenParams): Promise<TokenCreationResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected")
  }

  // Create a new HTTP-only connection to avoid WebSocket issues
  const httpConnection = createHttpOnlyConnection(config.rpc.mainnet, config.connection.commitment)

  try {
    // Calculate fees
    const optionFees = calculateFees(tokenData.options)
    const totalFees = config.baseFee + optionFees // Base fee + option fees

    // Generate new keypair for Mint Account
    const mintKeypair = Keypair.generate()
    const mint = mintKeypair.publicKey

    // Prepare metadata - use the gateway URL directly
    const metadataUri = tokenData.metadataUri || ""
    console.log("Using metadata URI:", metadataUri)

    // Ensure we're using a gateway URL, not an IPFS URI
    const metadataUriToUse = metadataUri.startsWith("ipfs://") ? ipfsUriToGatewayUrl(metadataUri) : metadataUri
    console.log("Final metadata URI to use:", metadataUriToUse)

    // Get the image gateway URL if provided
    const imageGatewayUrl = tokenData.imageGatewayUrl || ""
    console.log("Image Gateway URL:", imageGatewayUrl)

    const metaData: TokenMetadata = {
      updateAuthority: wallet.publicKey,
      mint: mint,
      name: tokenData.name,
      symbol: tokenData.symbol,
      uri: metadataUriToUse, // Use the gateway URL directly
      additionalMetadata: [
        ["description", tokenData.description],
        // Add image URL directly to the metadata
        ["image", imageGatewayUrl],
      ],
    }

    // Add creator information if enabled
    if (tokenData.options.addCreatorInfo) {
      if (tokenData.options.creatorName) {
        metaData.additionalMetadata.push(["creator_name", tokenData.options.creatorName])
      }
      if (tokenData.options.creatorWebsite) {
        metaData.additionalMetadata.push(["creator_website", tokenData.options.creatorWebsite])
      }
    }

    // Add social links if selected
    if (tokenData.options.addSocialLinks) {
      // Use the provided social links or default to empty strings
      metaData.additionalMetadata.push(["twitter", tokenData.options.twitterLink || ""])
      metaData.additionalMetadata.push(["discord", tokenData.options.discordLink || ""])
      metaData.additionalMetadata.push(["telegram", tokenData.options.telegramLink || ""])
    }

    // Size calculations
    const metadataExtension = 4 // 2 bytes for type, 2 bytes for length
    const metadataLen = pack(metaData).length

    // Size of Mint Account with extension
    const mintLen = getMintLen([ExtensionType.MetadataPointer])

    // Calculate the total size needed for the mint account
    const totalMintSize = mintLen + metadataExtension + metadataLen

    console.log("Mint account size calculation:", {
      mintLen,
      metadataExtension,
      metadataLen,
      totalMintSize,
    })

    // Minimum lamports required for Mint Account
    let lamports = await httpConnection.getMinimumBalanceForRentExemption(totalMintSize)

    // Add a safety buffer to ensure enough rent (20% extra)
    lamports = Math.ceil(lamports * 1.2)

    console.log(`Calculated rent for mint account: ${lamports / LAMPORTS_PER_SOL} SOL`)

    // Check if user has enough balance for the transaction
    const userBalance = await httpConnection.getBalance(wallet.publicKey)

    // Calculate total cost (fees + rent)
    const totalCost = totalFees * LAMPORTS_PER_SOL + lamports

    console.log(`User balance: ${userBalance / LAMPORTS_PER_SOL} SOL`)
    console.log(
      `Total cost: ${totalCost / LAMPORTS_PER_SOL} SOL (fees: ${totalFees} SOL, rent: ${lamports / LAMPORTS_PER_SOL} SOL)`,
    )

    if (userBalance < totalCost) {
      throw new Error(
        `Insufficient funds: You need at least ${totalCost / LAMPORTS_PER_SOL} SOL for this transaction, but you only have ${userBalance / LAMPORTS_PER_SOL} SOL`,
      )
    }

    // Create transaction
    const transaction = new Transaction()

    // Get recent blockhash
    const { blockhash } = await httpConnection.getLatestBlockhash({
      commitment: config.connection.commitment,
    })

    // Set recent blockhash and fee payer
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey

    // Add fee transfer instruction
    const feeReceiver = new PublicKey(config.feeReceiver)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: feeReceiver,
        lamports: totalFees * LAMPORTS_PER_SOL,
      }),
    )

    // Instruction to create new account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    )

    // Instruction to initialize the MetadataPointer Extension
    transaction.add(createInitializeMetadataPointerInstruction(mint, wallet.publicKey, mint, TOKEN_2022_PROGRAM_ID))

    // Instruction to initialize Mint Account data
    transaction.add(
      createInitializeMintInstruction(
        mint,
        tokenData.decimals,
        wallet.publicKey,
        null, // Set freeze authority to null
        TOKEN_2022_PROGRAM_ID,
      ),
    )

    // Instruction to initialize Metadata Account data
    transaction.add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: wallet.publicKey,
        mint: mint,
        mintAuthority: wallet.publicKey,
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
      }),
    )

    // Add instructions for additional metadata fields
    // Add the description field
    transaction.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: wallet.publicKey,
        field: "description",
        value: tokenData.description,
      }),
    )

    // Add the image field explicitly
    if (imageGatewayUrl) {
      transaction.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: wallet.publicKey,
          field: "image",
          value: imageGatewayUrl,
        }),
      )
    }

    // Calculate the token account address
    const tokenAccountAddress = getAssociatedTokenAddressSync(
      mint,
      wallet.publicKey,
      false, // allowOwnerOffCurve
      TOKEN_2022_PROGRAM_ID,
    )

    // Get rent for token account
    const tokenAccountRent = await httpConnection.getMinimumBalanceForRentExemption(165) // Standard size for token account

    console.log(`Token account rent: ${tokenAccountRent / LAMPORTS_PER_SOL} SOL`)

    // Create a separate transaction for token account creation and minting
    // This helps avoid the InsufficientFundsForRent error by splitting the operations
    const tokenAccountTx = new Transaction()
    tokenAccountTx.recentBlockhash = blockhash
    tokenAccountTx.feePayer = wallet.publicKey

    // Add instruction to create the associated token account
    tokenAccountTx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenAccountAddress,
        wallet.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )

    // Calculate the mint amount based on decimals
    // For 1 billion tokens with decimals, we need to multiply by 10^decimals
    const mintAmount = BigInt(1_000_000_000) * BigInt(10 ** tokenData.decimals)
    console.log(`Minting ${mintAmount} tokens (${1_000_000_000} with ${tokenData.decimals} decimals)`)

    // Add instruction to mint tokens to the user's account
    tokenAccountTx.add(
      createMintToInstruction(
        mint,
        tokenAccountAddress,
        wallet.publicKey,
        mintAmount, // Mint 1 billion tokens adjusted for decimals
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    )

    // Sign with the mint keypair first
    transaction.partialSign(mintKeypair)

    // Use the improved signAndSendTransaction function
    console.log("Sending token creation transaction...")
    const signature = await signAndSendTransaction(wallet, httpConnection, transaction, "Create Token", (status) =>
      console.log(`Transaction status: ${status}`),
    )

    console.log(`Transaction sent with signature: ${signature}`)
    console.log("Waiting for transaction confirmation...")

    // Create the result object
    const result = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      mintAddress: mint.toString(),
      signature,
      metadataUri: metadataUriToUse, // Use the gateway URL
      metadataGatewayUrl: tokenData.metadataGatewayUrl || metadataUriToUse,
      imageGatewayUrl: imageGatewayUrl,
    }

    // Wait for the first transaction to confirm before proceeding with the second wallet confirmation
    console.log("Waiting for first transaction confirmation before opening second wallet confirmation...")

    try {
      // Wait for confirmation with a timeout
      let confirmed = false
      let retries = 0
      const maxRetries = 10

      while (!confirmed && retries < maxRetries) {
        try {
          const status = await httpConnection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
          })

          if (status && status.value) {
            if (status.value.err) {
              console.error("Transaction failed:", status.value.err)
              break
            }

            if (status.value.confirmationStatus === "confirmed" || status.value.confirmationStatus === "finalized") {
              console.log("First transaction confirmed successfully!")
              confirmed = true
              break
            }
          }

          console.log(`Waiting for first confirmation... (attempt ${retries + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          retries++
        } catch (error) {
          console.error("Error checking transaction status:", error)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          retries++
        }
      }

      // Now create the token account - this will trigger the second wallet confirmation
      console.log("Creating token account and minting tokens (second wallet confirmation)...")
      try {
        const tokenAccountSignature = await signAndSendTransaction(
          wallet,
          httpConnection,
          tokenAccountTx,
          "Create Token Account",
          (status) => console.log(`Token account transaction status: ${status}`),
        )
        console.log("Token account created with signature:", tokenAccountSignature)

        // Wait briefly for the transaction to be processed
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Return the result after the second wallet confirmation
        return result
      } catch (error) {
        console.error("Error in second wallet confirmation:", error)
        // Still return the result even if there was an error in the second confirmation
        return result
      }
    } catch (error) {
      console.error("Error in confirmation process:", error)
      // Still return the result even if there was an error in the confirmation process
      return result
    }
  } catch (error) {
    console.error("Error creating token:", error)

    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      const errorMessage = error.message

      if (errorMessage.includes("InsufficientFundsForRent")) {
        throw new Error("Insufficient funds to pay for account rent. Please add more SOL to your wallet.")
      }

      if (errorMessage.includes("insufficient funds")) {
        throw new Error("Insufficient funds to complete the transaction. Please add more SOL to your wallet.")
      }
    }

    throw error
  }
}
