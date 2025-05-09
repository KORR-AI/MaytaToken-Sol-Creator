"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, Connection } from "@solana/web3.js"
import TokenNameSymbol from "@/components/token-steps/token-name-symbol"
import TokenImageDescription from "@/components/token-steps/token-image-description"
import TokenOptions from "@/components/token-steps/token-options"
import TokenReview from "@/components/token-steps/token-review"
import TokenSuccess from "@/components/token-steps/token-success"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { TokenFormData, TokenCreationResult } from "@/lib/types"
import { createToken } from "@/lib/token-service"
import { uploadToIPFS } from "@/lib/ipfs-service"
import { calculateFees } from "@/lib/fee-calculator"
import { config, loadConfigFromServer } from "@/lib/config"
import { Wallet, ArrowLeft, ArrowRight } from "lucide-react"

export default function TokenCreator() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenResult, setTokenResult] = useState<TokenCreationResult | null>(null)
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  // Token creation progress state
  const [creationProgress, setCreationProgress] = useState(0)
  const [creationStage, setCreationStage] = useState("")
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [creationCompleted, setCreationCompleted] = useState(false)
  const [transactionSent, setTransactionSent] = useState(false)
  const [waitingForFinalConfirmation, setWaitingForFinalConfirmation] = useState(false)

  // Refs to track intervals and timeouts
  const intervalsRef = useRef<NodeJS.Timeout[]>([])
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Update the initial formData state to include the supply field and set default authorities
  const [formData, setFormData] = useState<TokenFormData>({
    name: "",
    symbol: "",
    description: "",
    image: null,
    decimals: 9,
    supply: 1000000000, // Default to 1 billion
    options: {
      // Creator information - all unselected by default
      addCreatorInfo: false,
      creatorName: "",
      creatorWebsite: "",
      addSocialLinks: false,

      // Social links - empty by default
      twitterLink: "",
      discordLink: "",
      telegramLink: "",

      // Revoke authorities - all selected by default for maximum trust
      revokeFreeze: true,
      revokeMint: true,
      revokeUpdate: true,
      // Set update authority to N/A by default
      updateAuthorityNA: true,
    },
  })

  // Load config from server when component mounts
  useEffect(() => {
    async function initConfig() {
      await loadConfigFromServer()
      setIsConfigLoaded(true)
    }

    initConfig()
  }, [])

  // Cleanup function to clear all intervals and timeouts
  const cleanupTimers = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []

    // Clear all timeouts
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  // Effect to watch for 100% progress and trigger completion
  useEffect(() => {
    if (creationProgress >= 100 && isCreatingToken && !creationCompleted && tokenResult) {
      console.log("Progress reached 100%, triggering completion")
      // Small delay to ensure animations complete
      const completeTimeout = setTimeout(() => {
        handleCreationComplete()
      }, 500)

      timeoutsRef.current.push(completeTimeout)
    }
  }, [creationProgress, isCreatingToken, creationCompleted, tokenResult])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers()
    }
  }, [cleanupTimers])

  // Fetch balance when wallet connects - with improved fallback mechanism
  const fetchBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance(null)
      setConnectionError(null)
      return
    }

    setIsBalanceUpdating(true)
    setConnectionError(null)

    // Try all RPC endpoints in sequence until one works
    const endpoints = [config.rpc.mainnet, ...config.rpc.mainnetBackups]
    let succeeded = false

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to fetch balance using RPC endpoint: ${endpoint}`)
        // Create a new connection for each attempt to avoid any cached issues
        const conn = new Connection(endpoint, {
          commitment: config.connection.commitment,
          confirmTransactionInitialTimeout: config.connection.confirmTransactionInitialTimeout,
        })

        const balance = await conn.getBalance(wallet.publicKey)
        setBalance(balance / LAMPORTS_PER_SOL)
        succeeded = true
        console.log(`Successfully fetched balance using RPC: ${endpoint}`)
        break // Exit the loop if successful
      } catch (error) {
        console.error(`Error with RPC ${endpoint}:`, error)
        // Continue to the next endpoint
      }
    }

    if (!succeeded) {
      console.error("All RPC endpoints failed to fetch balance")
      setConnectionError("All RPC endpoints failed. Please try again later.")
    }

    setTimeout(() => setIsBalanceUpdating(false), 1000)
  }, [wallet.publicKey, config.connection.commitment, config.connection.confirmTransactionInitialTimeout, config.rpc])

  // Update balance when wallet changes
  useEffect(() => {
    if (wallet.publicKey) {
      fetchBalance()

      // Set up interval to refresh balance - with a longer interval to avoid rate limiting
      const intervalId = setInterval(fetchBalance, 30000) // Refresh every 30 seconds

      // Clean up interval on unmount
      return () => clearInterval(intervalId)
    }
  }, [wallet.publicKey, fetchBalance])

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4))
    // Scroll to top when changing steps
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    // Scroll to top when changing steps
    window.scrollTo(0, 0)
  }

  // Simulate progress for a realistic effect with more accurate timing
  const simulateProgress = (stage: string, startPercent: number, endPercent: number, durationMs: number) => {
    setCreationStage(stage)
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime

      // Normal progress calculation
      const progressPercent = startPercent + (elapsed / durationMs) * (endPercent - startPercent)
      if (progressPercent >= endPercent) {
        setCreationProgress(endPercent)
        clearInterval(interval)
      } else {
        setCreationProgress(progressPercent)
      }
    }, 50) // Update every 50ms for smooth animation

    // Store the interval for cleanup
    intervalsRef.current.push(interval)
    return interval
  }

  const handleSubmit = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token",
        variant: "destructive",
      })
      return
    }

    // Ensure supply is not 0
    if (formData.supply === 0) {
      toast({
        title: "Invalid supply",
        description: "Please enter a valid token supply amount",
        variant: "destructive",
      })
      return
    }

    // Add this additional validation to ensure supply is properly formatted
    // Validate supply is a reasonable number
    if (formData.supply <= 0 || formData.supply > Number.MAX_SAFE_INTEGER) {
      toast({
        title: "Invalid supply",
        description: "Please enter a valid token supply between 1 and " + Number.MAX_SAFE_INTEGER,
        variant: "destructive",
      })
      return
    }

    // Log the supply value for debugging
    console.log("Creating token with supply:", formData.supply, "and decimals:", formData.decimals)

    // Validate that we have a valid RPC URL
    if (
      !config.rpc.mainnet ||
      (!config.rpc.mainnet.startsWith("http://") && !config.rpc.mainnet.startsWith("https://"))
    ) {
      toast({
        title: "Invalid RPC configuration",
        description: "The Solana RPC URL is invalid. Please check your configuration.",
        variant: "destructive",
      })
      return
    }

    // Clean up any existing timers
    cleanupTimers()

    setIsLoading(true)
    setIsCreatingToken(true)
    setCreationProgress(0)
    setCreationCompleted(false)
    setTransactionSent(false)
    setWaitingForFinalConfirmation(false)
    setTokenResult(null)

    try {
      // Start progress simulation
      simulateProgress("Preparing token creation...", 0, 10, 1500)

      // 1. Upload image to IPFS if provided
      let metadataUri = ""
      let metadataGatewayUrl = ""
      let imageGatewayUrl = ""

      if (formData.image) {
        try {
          // Update progress for IPFS upload
          cleanupTimers()
          simulateProgress("Uploading image to IPFS...", 10, 40, 5000)

          // Pass the wallet address to the IPFS upload function
          const ipfsResult = await uploadToIPFS(
            formData.image,
            {
              name: formData.name,
              symbol: formData.symbol,
              description: formData.description,
            },
            wallet.publicKey.toString(), // Pass wallet address for creators field
          )

          metadataUri = ipfsResult.metadataUri
          metadataGatewayUrl = ipfsResult.metadataGatewayUrl
          imageGatewayUrl = ipfsResult.imageGatewayUrl

          console.log("IPFS upload successful:")
          console.log("Metadata URI:", metadataUri)
          console.log("Metadata Gateway URL:", metadataGatewayUrl)
          console.log("Image Gateway URL:", imageGatewayUrl)

          toast({
            title: "IPFS Upload Successful",
            description: "Your image and metadata have been uploaded to IPFS.",
            variant: "default",
          })
        } catch (error) {
          console.error("Error uploading to IPFS:", error)
          toast({
            title: "IPFS Upload Failed",
            description: "Failed to upload to IPFS. Please check your API keys and try again.",
            variant: "destructive",
          })

          // Stop the token creation process
          setIsCreatingToken(false)
          setIsLoading(false)
          cleanupTimers()
          return
        }
      }

      // 2. Create token - only go to 60% before first wallet confirmation
      cleanupTimers()
      simulateProgress("Waiting for wallet confirmation...", 40, 60, 5000)

      // Create token - this will trigger the first wallet confirmation and handle the second one
      const result = await createToken({
        connection,
        wallet,
        tokenData: {
          ...formData,
          metadataUri: metadataGatewayUrl || undefined, // Use gateway URL directly as the metadata URI
          metadataGatewayUrl: metadataGatewayUrl || undefined,
          imageGatewayUrl: imageGatewayUrl || undefined, // Pass the image gateway URL
        },
        feeReceiverAddress: config.feeReceiver,
      })

      // Mark that transaction was sent successfully
      setTransactionSent(true)

      // Set result with gateway URLs
      const finalResult = {
        ...result,
        metadataGatewayUrl: metadataGatewayUrl || result.metadataGatewayUrl,
        imageGatewayUrl: imageGatewayUrl || result.imageGatewayUrl,
      }

      setTokenResult(finalResult)
      console.log("Token result set:", finalResult)

      // After second wallet confirmation completes, move to 100%
      cleanupTimers()
      setWaitingForFinalConfirmation(false)
      simulateProgress("Token created successfully!", 80, 100, 2000)

      // Refresh balance after token creation
      fetchBalance()
    } catch (error) {
      console.error("Error creating token:", error)
      setIsCreatingToken(false)
      setIsLoading(false)
      setWaitingForFinalConfirmation(false)
      cleanupTimers()

      // Provide more specific error messages based on the error
      let errorMessage = "Unknown error occurred"

      if (error instanceof Error) {
        if (error.message.includes("InsufficientFundsForRent")) {
          errorMessage = "Insufficient funds to pay for account rent. Please add more SOL to your wallet and try again."
          // Refresh balance to show current amount
          fetchBalance()
        } else if (error.message.includes("insufficient funds") || error.message.includes("Insufficient funds")) {
          errorMessage = "Insufficient funds to complete the transaction. Please add more SOL to your wallet."
          // Refresh balance to show current amount
          fetchBalance()
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Transaction confirmation timed out. The token may still be created. Please check your wallet and try again later."
        } else if (error.message.includes("failed")) {
          errorMessage = "Transaction failed. Please try again or use a different wallet."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Error creating token",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Handle completion of token creation progress
  const handleCreationComplete = useCallback(() => {
    console.log("handleCreationComplete called", {
      hasTokenResult: !!tokenResult,
      isCreating: isCreatingToken,
      transactionSent,
      waitingForFinalConfirmation,
    })

    // Clean up all timers first
    cleanupTimers()

    // Only proceed if we have a token result or transaction was sent
    if ((!tokenResult && !transactionSent) || !isCreatingToken) return

    // If we don't have a token result but transaction was sent, create a placeholder result
    const finalResult = tokenResult || {
      name: formData.name,
      symbol: formData.symbol,
      mintAddress: "Transaction sent, but confirmation timed out. Check your wallet for the token.",
      signature: "Transaction confirmation pending",
    }

    // Set the token result if we don't have one
    if (!tokenResult) {
      setTokenResult(finalResult)
    }

    // Move to success step
    setCurrentStep(4)

    // Hide the progress overlay and reset loading state
    setIsCreatingToken(false)
    setIsLoading(false)
    setCreationCompleted(true)
    setWaitingForFinalConfirmation(false)

    // Show success toast (only once)
    toast({
      title: "Token creation process completed",
      description: `Your token ${formData.name} (${formData.symbol}) has been processed`,
    })

    // Scroll to top
    window.scrollTo(0, 0)
  }, [
    toast,
    formData.name,
    formData.symbol,
    tokenResult,
    isCreatingToken,
    transactionSent,
    waitingForFinalConfirmation,
    cleanupTimers,
  ])

  // Update the fee calculation
  const fees = calculateFees(formData.options)
  const totalFees = config.baseFee + fees // Base fee + option fees
  const insufficientBalance = balance !== null && balance < totalFees

  // Step titles for the header
  const stepTitles = ["Token Name & Symbol", "Image & Description", "Token Options", "Review & Create", "Token Created"]

  // Show loading state if config is not loaded yet
  if (!isConfigLoaded) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <WalletMultiButton />
        </div>
        {wallet.connected && (
          <div className="relative">
            <Card
              className={`bg-slate-800 border-none shadow-lg overflow-hidden ${
                isBalanceUpdating ? "animate-pulse" : ""
              }`}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="bg-green-900/50 p-2 rounded-full">
                  <Wallet className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Balance</p>
                  <p className={`font-bold text-lg ${insufficientBalance ? "text-red-400" : "text-green-400"}`}>
                    {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
                  </p>
                  {connectionError && <p className="text-xs text-amber-400">{connectionError}</p>}
                </div>
                {/* Glowing effect */}
                <div
                  className={`absolute inset-0 bg-green-500/20 rounded-lg blur-sm ${
                    isBalanceUpdating ? "opacity-100" : ""
                  } transition-opacity duration-1000`}
                ></div>
              </CardContent>
            </Card>
            {/* Pulsing ring effect */}
            <div
              className={`absolute inset-0 rounded-lg ring-2 ring-green-500/50 ${
                isBalanceUpdating ? "animate-ping opacity-75" : ""
              } transition-opacity duration-1000`}
            ></div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{stepTitles[currentStep]}</h1>
          <p className="text-sm text-slate-400">
            Step {currentStep + 1} of {stepTitles.length}
          </p>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / stepTitles.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main content area */}
      <Card className="mb-6 border-slate-700 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          {currentStep === 0 && <TokenNameSymbol formData={formData} setFormData={setFormData} />}
          {currentStep === 1 && <TokenImageDescription formData={formData} setFormData={setFormData} />}
          {currentStep === 2 && <TokenOptions formData={formData} setFormData={setFormData} fees={fees} />}
          {currentStep === 3 && <TokenReview formData={formData} fees={totalFees} />}
          {currentStep === 4 && tokenResult && <TokenSuccess result={tokenResult} />}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        {currentStep > 0 && currentStep < 4 && (
          <Button variant="outline" onClick={handleBack} disabled={isLoading} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {currentStep === 0 && <div></div>}

        {currentStep < 3 && (
          <Button onClick={handleNext} className="ml-auto flex items-center">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            onClick={handleSubmit}
            disabled={!wallet.connected || insufficientBalance || isLoading}
            className="ml-auto"
          >
            {isLoading ? (
              <>
                <span className="mr-2">Creating Token...</span>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              </>
            ) : (
              "Create Token"
            )}
          </Button>
        )}
      </div>

      {insufficientBalance && currentStep === 3 && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-md">
          <p className="text-red-400 text-sm">
            <strong>Insufficient balance:</strong> You need at least {totalFees.toFixed(2)} SOL to create this token.
            Your current balance is {balance?.toFixed(4) || 0} SOL.
          </p>
        </div>
      )}

      {/* Token Creation Progress Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        style={{ display: isCreatingToken ? "flex" : "none" }}
      >
        <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-8 shadow-2xl relative overflow-hidden">
          {/* Background glow effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-xl opacity-50"
            style={{ opacity: (creationProgress / 100) * 0.5 }}
          ></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <div className="h-12 w-12 text-primary animate-spin border-4 border-current border-t-transparent rounded-full"></div>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">Creating Your Token</h3>
            <p className="text-slate-400 text-center mb-6">{creationStage}</p>

            {/* Progress bar container */}
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative mb-2">
              {/* Progress bar */}
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${creationProgress}%` }}
              ></div>

              {/* Animated glow effect */}
              <div
                className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-30 blur-sm"
                style={{ width: `${creationProgress}%` }}
              ></div>
            </div>

            {/* Percentage text */}
            <p className="text-center font-mono text-lg font-bold">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400"
                style={{ opacity: 0.5 + (creationProgress / 100) * 0.5 }}
              >
                {Math.round(creationProgress)}%
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
