"use client"

import { Button } from "@/components/ui/button"
import type { TokenCreationResult } from "@/lib/types"
import { CheckCircle, Copy, ExternalLink, FileJson, ImageIcon, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { ipfsUriToGatewayUrl } from "@/lib/ipfs-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TokenSuccessProps {
  result: TokenCreationResult
}

export default function TokenSuccess({ result }: TokenSuccessProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Convert IPFS URI to gateway URL if needed
  const metadataGatewayUrl =
    result.metadataGatewayUrl || (result.metadataUri ? ipfsUriToGatewayUrl(result.metadataUri) : "")

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  // Fetch the metadata when the component mounts
  useEffect(() => {
    if (metadataGatewayUrl) {
      const fetchMetadata = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const response = await fetch(metadataGatewayUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
          }
          const data = await response.json()
          setMetadata(data)

          // Extract image URL from metadata
          let imgUrl = null
          if (data.image) {
            // If image is an IPFS URI, convert to gateway URL
            if (data.image.startsWith("ipfs://")) {
              imgUrl = ipfsUriToGatewayUrl(data.image)
            } else {
              imgUrl = data.image
            }
          } else if (data.properties?.files?.[0]?.uri) {
            // Try to get from properties.files
            imgUrl = data.properties.files[0].uri
          }

          setImageUrl(imgUrl)
        } catch (err) {
          console.error("Error fetching metadata:", err)
          setError(err instanceof Error ? err.message : "Failed to fetch metadata")
        } finally {
          setIsLoading(false)
        }
      }

      fetchMetadata()
    }
  }, [metadataGatewayUrl])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Token Created Successfully!</h2>
        <p className="text-slate-300">Your token has been created on the Solana blockchain</p>
      </div>

      <Alert className="bg-blue-900/20 border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertTitle>Viewing Your Token</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            It may take some time for your token to appear in wallets and explorers. Here's what to expect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Solscan/Explorers:</strong> Will show basic token info but may not display metadata or images
              immediately
            </li>
            <li>
              <strong>Phantom Wallet:</strong> Add your token using the mint address. Metadata may take time to appear
            </li>
            <li>
              <strong>Token-2022 Support:</strong> Some wallets may have limited support for Token-2022 tokens
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Token Details</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Token Name</p>
              <p className="font-medium">{result.name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Token Symbol</p>
              <p className="font-medium">{result.symbol}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Token Mint Address</p>
              <div className="flex items-center space-x-2">
                <code className="bg-slate-900 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                  {result.mintAddress}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.mintAddress, "mint")}>
                  {copied === "mint" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Transaction Signature</p>
              <div className="flex items-center space-x-2">
                <code className="bg-slate-900 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                  {result.signature}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.signature, "signature")}>
                  {copied === "signature" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {result.metadataUri && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Metadata URI</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-900 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                    {result.metadataUri}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(result.metadataUri!, "metadata")}
                  >
                    {copied === "metadata" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {metadataGatewayUrl && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Metadata Gateway URL</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-900 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                    {metadataGatewayUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(metadataGatewayUrl, "gateway")}>
                    {copied === "gateway" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(metadataGatewayUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {imageUrl && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Image Gateway URL</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-900 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">{imageUrl}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(imageUrl, "image-url")}>
                    {copied === "image-url" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(imageUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata and Image Preview */}
        {metadataGatewayUrl && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Token Metadata Preview</h3>

            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="metadata" className="flex items-center">
                  <FileJson className="h-4 w-4 mr-2" />
                  Metadata JSON
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Token Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-md p-4 text-center">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : metadata ? (
                  <Card className="bg-slate-900 p-4 overflow-auto max-h-80">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-slate-400">No metadata available</div>
                )}
              </TabsContent>

              <TabsContent value="image" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/20 border border-red-700 rounded-md p-4 text-center">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : imageUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white rounded-lg p-2 mb-4 max-w-xs">
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={metadata?.name || "Token image"}
                        className="max-w-full h-auto rounded"
                      />
                    </div>
                    <div className="w-full">
                      <p className="text-sm text-slate-400 mb-1">Image URL</p>
                      <div className="flex items-center space-x-2">
                        <code className="bg-slate-900 px-2 py-1 rounded text-xs flex-1 overflow-x-auto">
                          {imageUrl}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(imageUrl, "image-url-copy")}
                        >
                          {copied === "image-url-copy" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => window.open(imageUrl, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">No image available</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1"
            onClick={() => window.open(`https://solscan.io/token/${result.mintAddress}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Solscan
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              window.open(`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${result.mintAddress}`, "_blank")
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Create Liquidity Pool
          </Button>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to Add Your Token to Wallets</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-primary mb-2">Phantom Wallet</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Open your Phantom wallet</li>
                <li>Click on "Tokens" tab</li>
                <li>Scroll down and click "Import Token"</li>
                <li>
                  Paste your token mint address:{" "}
                  <code className="bg-slate-900 px-1 py-0.5 rounded text-xs">{result.mintAddress}</code>
                </li>
                <li>Click "Import"</li>
                <li>If the token doesn't appear, try restarting your wallet app</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
