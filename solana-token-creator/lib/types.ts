export interface TokenFormData {
  name: string
  symbol: string
  description: string
  decimals: number
  supply: number
  image: File | null
  options: {
    // Creator information
    addCreatorInfo: boolean
    creatorName: string
    creatorWebsite: string
    addSocialLinks: boolean

    // Social links
    twitterLink: string
    discordLink: string
    telegramLink: string

    // Revoke authorities (all selected by default for maximum trust)
    revokeFreeze: boolean
    revokeMint: boolean
    revokeUpdate: boolean
  }
}

export interface TokenCreationResult {
  name: string
  symbol: string
  mintAddress: string
  signature: string
  metadataUri?: string
  metadataGatewayUrl?: string
  imageGatewayUrl?: string
}

export interface CreateTokenParams {
  connection: any
  wallet: any
  tokenData: TokenFormData & {
    metadataUri?: string
    metadataGatewayUrl?: string
    imageGatewayUrl?: string
  }
  feeReceiverAddress: string
}

export interface IPFSUploadResult {
  imageUri: string
  imageGatewayUrl: string
  metadataUri: string
  metadataGatewayUrl: string
}
