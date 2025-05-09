"use client"

import type { TokenFormData } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

interface TokenReviewProps {
  formData: TokenFormData
  fees: number
}

export default function TokenReview({ formData, fees }: TokenReviewProps) {
  const { name, symbol, description, decimals, image, options, supply } = formData

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Review Your Token</h2>
        <p className="text-slate-300 mb-6">
          Please review your token details before creation. You will be charged {fees.toFixed(2)} SOL.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
            <Separator className="mb-4" />

            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400">Token Name</p>
                <p className="font-medium">{name || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Token Symbol</p>
                <p className="font-medium">{symbol || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Description</p>
                <p className="font-medium">{description || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Decimals</p>
                <p className="font-medium">{decimals}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Total Supply</p>
                <p className="font-medium text-primary">
                  {supply.toLocaleString()} {symbol || "tokens"}
                </p>
              </div>
            </div>
          </div>

          {options.addCreatorInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Creator Information</h3>
              <Separator className="mb-4" />

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Creator Name</p>
                  <p className="font-medium">{options.creatorName || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Creator Website</p>
                  <p className="font-medium">{options.creatorWebsite || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}

          {options.addSocialLinks && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Social Links</h3>
              <Separator className="mb-4" />

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Twitter</p>
                  <p className="font-medium">{options.twitterLink || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Discord</p>
                  <p className="font-medium">{options.discordLink || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Telegram</p>
                  <p className="font-medium">{options.telegramLink || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Authority Settings</h3>
            <Separator className="mb-4" />

            <div className="space-y-2">
              <div className="flex items-center">
                {options.revokeFreeze ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-amber-500 mr-2" />
                )}
                <span className={options.revokeFreeze ? "text-white" : "text-amber-400"}>
                  {options.revokeFreeze ? "Freeze Authority Revoked" : "Freeze Authority Retained (+0.1 SOL)"}
                </span>
              </div>

              <div className="flex items-center">
                {options.revokeMint ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-amber-500 mr-2" />
                )}
                <span className={options.revokeMint ? "text-white" : "text-amber-400"}>
                  {options.revokeMint ? "Mint Authority Revoked" : "Mint Authority Retained (+0.1 SOL)"}
                </span>
              </div>

              <div className="flex items-center">
                {options.revokeUpdate ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-amber-500 mr-2" />
                )}
                <span className={options.revokeUpdate ? "text-white" : "text-amber-400"}>
                  {options.updateAuthorityNA
                    ? "Update Authority N/A"
                    : options.revokeUpdate
                      ? "Update Authority Revoked"
                      : "Update Authority Retained (+0.1 SOL)"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Fees</h3>
            <Separator className="mb-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Fee</span>
                <span>0.01 SOL</span>
              </div>

              {options.addCreatorInfo ? (
                <div className="flex justify-between">
                  <span>Creator Information</span>
                  <span>0.1 SOL</span>
                </div>
              ) : null}

              {options.addSocialLinks ? (
                <div className="flex justify-between">
                  <span>Social Links</span>
                  <span>0.1 SOL</span>
                </div>
              ) : null}

              {!options.revokeFreeze ? (
                <div className="flex justify-between">
                  <span>Retain Freeze Authority</span>
                  <span>0.1 SOL</span>
                </div>
              ) : null}

              {!options.revokeMint ? (
                <div className="flex justify-between">
                  <span>Retain Mint Authority</span>
                  <span>0.1 SOL</span>
                </div>
              ) : null}

              {!options.revokeUpdate ? (
                <div className="flex justify-between">
                  <span>Retain Update Authority</span>
                  <span>0.1 SOL</span>
                </div>
              ) : null}

              <Separator className="my-2" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{fees.toFixed(2)} SOL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-start">
          <div className="bg-slate-800 rounded-lg p-6 w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">Token Preview</h3>

            <div className="flex flex-col items-center space-y-4">
              {image ? (
                <img
                  src={URL.createObjectURL(image) || "/placeholder.svg"}
                  alt="Token preview"
                  className="w-48 h-48 object-contain bg-white rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400">No image</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-xl font-bold">{name || "Token Name"}</p>
                <Badge variant="outline" className="mt-1">
                  {symbol || "SYM"}
                </Badge>
                <p className="mt-2 text-sm text-slate-300">
                  Total Supply: <span className="font-semibold text-primary">{supply.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
