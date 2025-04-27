import type { IPFSUploadResult } from "./types"
import { config } from "./config"

// Helper function to convert IPFS URI to gateway URL
export function ipfsUriToGatewayUrl(ipfsUri: string): string {
  if (!ipfsUri) return ""

  // Check if it's already a gateway URL
  if (ipfsUri.startsWith("http")) {
    return ipfsUri
  }

  // Convert ipfs:// URI to gateway URL
  if (ipfsUri.startsWith("ipfs://")) {
    const hash = ipfsUri.replace("ipfs://", "")
    return `${config.ipfsGateway}${hash}`
  }

  return ipfsUri
}

export async function uploadToIPFS(
  imageFile: File,
  metadata: { name: string; symbol: string; description: string },
  walletAddress: string,
): Promise<IPFSUploadResult> {
  try {
    console.log("Starting IPFS upload with Pinata...")
    console.log("API Key:", process.env.NEXT_PUBLIC_PINATA_API_KEY ? "Available" : "Missing")
    console.log("Secret Key:", process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY ? "Available" : "Missing")

    // Create form data for the image upload
    const imageFormData = new FormData()
    imageFormData.append("file", imageFile)

    // Add pinata metadata
    const pinataMetadata = JSON.stringify({
      name: `${metadata.name}-image`,
    })
    imageFormData.append("pinataMetadata", pinataMetadata)

    // Upload image to Pinata
    const imageResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || "",
      },
      body: imageFormData,
    })

    console.log("Image upload response status:", imageResponse.status)

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text()
      console.error("Pinata image upload error:", errorText)
      throw new Error(`Failed to upload image to IPFS: ${imageResponse.status} ${errorText}`)
    }

    const imageResult = await imageResponse.json()
    console.log("Image upload result:", imageResult)

    const imageIpfsHash = imageResult.IpfsHash
    const imageGatewayUrl = `${config.ipfsGateway}${imageIpfsHash}`
    console.log("Image gateway URL:", imageGatewayUrl)

    // Create metadata JSON following Metaplex NFT Standard
    const metadataJson = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: imageGatewayUrl, // Use direct gateway URL for better compatibility
      properties: {
        files: [
          {
            uri: imageGatewayUrl,
            type: "image/png",
          },
        ],
        category: "image",
        creators: [
          {
            address: walletAddress,
            share: 100,
          },
        ],
      },
      attributes: [],
    }

    console.log("Uploading metadata JSON:", JSON.stringify(metadataJson, null, 2))

    // Upload metadata directly as JSON
    const metadataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || "",
      },
      body: JSON.stringify(metadataJson),
    })

    console.log("Metadata upload response status:", metadataResponse.status)

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      console.error("Pinata metadata upload error:", errorText)
      throw new Error(`Failed to upload metadata to IPFS: ${metadataResponse.status} ${errorText}`)
    }

    const metadataResult = await metadataResponse.json()
    console.log("Metadata upload result:", metadataResult)

    // Important: Use the gateway URL directly as the metadata URI
    const metadataGatewayUrl = `${config.ipfsGateway}${metadataResult.IpfsHash}`
    console.log("Final metadata gateway URL:", metadataGatewayUrl)

    // Still keep the IPFS URI for reference
    const metadataUri = `ipfs://${metadataResult.IpfsHash}`

    return {
      imageUri: `ipfs://${imageIpfsHash}`,
      imageGatewayUrl,
      metadataUri,
      metadataGatewayUrl,
    }
  } catch (error) {
    console.error("Error uploading to IPFS:", error)

    // Return the fallback IPFS hash if upload fails
    const fallbackHash = "QmP8aQ7VQydU1MYMDeizih6RSEei1tfNHUaZUMMQfJTu89"
    const fallbackUri = `ipfs://${fallbackHash}`
    const fallbackGatewayUrl = `${config.ipfsGateway}${fallbackHash}`

    return {
      imageUri: fallbackUri,
      imageGatewayUrl: fallbackGatewayUrl,
      metadataUri: fallbackUri,
      metadataGatewayUrl: fallbackGatewayUrl,
    }
  }
}
