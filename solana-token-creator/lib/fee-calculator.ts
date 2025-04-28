import type { TokenFormData } from "./types"
import { config } from "./config"

export function calculateFees(options: TokenFormData["options"]): number {
  let totalFees = 0

  // Creator information (0.1 SOL if enabled)
  if (options.addCreatorInfo) {
    totalFees += config.optionFee
  }

  // Social links (0.1 SOL if enabled)
  if (options.addSocialLinks) {
    totalFees += config.optionFee
  }

  // Revoke authorities - charge 0.1 SOL for each authority that is NOT revoked
  if (!options.revokeFreeze) {
    totalFees += config.optionFee
  }

  if (!options.revokeMint) {
    totalFees += config.optionFee
  }

  if (!options.revokeUpdate) {
    totalFees += config.optionFee
  }

  return totalFees
}
