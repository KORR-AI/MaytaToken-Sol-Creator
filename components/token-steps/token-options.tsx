"use client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { TokenFormData } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Info, Check, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"

interface TokenOptionsProps {
  formData: TokenFormData
  setFormData: (data: TokenFormData) => void
  fees: number
}

export default function TokenOptions({ formData, setFormData, fees }: TokenOptionsProps) {
  const handleOptionChange = (option: keyof TokenFormData["options"], value: boolean | string) => {
    // Special handling for addCreatorInfo toggle
    if (option === "addCreatorInfo" && value === false) {
      // If turning off creator info, also clear the fields
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value,
          creatorName: "",
          creatorWebsite: "",
        },
      })
    }
    // Special handling for addSocialLinks toggle
    else if (option === "addSocialLinks" && value === false) {
      // If turning off social links, also clear the fields
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value,
          twitterLink: "",
          discordLink: "",
          telegramLink: "",
        },
      })
    }
    // Special handling for revokeUpdate toggle
    else if (option === "revokeUpdate") {
      // When revokeUpdate changes, update both revokeUpdate and updateAuthorityNA
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value,
          // If revokeUpdate is true, updateAuthorityNA should also be true
          updateAuthorityNA: value === true ? true : formData.options.updateAuthorityNA,
        },
      })
    }
    // Special handling for updateAuthorityNA toggle
    else if (option === "updateAuthorityNA") {
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value,
          // If updateAuthorityNA is true, revokeUpdate should also be true
          revokeUpdate: value === true ? true : formData.options.revokeUpdate,
        },
      })
    } else {
      // Normal handling for other options
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value,
        },
      })
    }
  }

  // Handle supply change
  const handleSupplyChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "")

    // If empty, set to 0 temporarily (will show placeholder)
    if (digitsOnly === "") {
      setFormData({
        ...formData,
        supply: 0,
      })
      return
    }

    // Parse the input value as a number
    const numValue = Number.parseInt(digitsOnly, 10)

    // Check if it's a valid number
    if (!isNaN(numValue)) {
      setFormData({
        ...formData,
        supply: numValue,
      })
    }
  }

  // Format the supply with commas for display
  const formatSupply = (value: number): string => {
    // If value is 0, return empty string to show placeholder
    if (value === 0) return ""
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const { options } = formData

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Options</h2>
        <p className="text-slate-300 mb-2">
          Configure additional options for your token. Each option costs an additional 0.1 SOL.
        </p>
        <p className="text-primary font-medium mb-6">Current additional fees: {fees.toFixed(1)} SOL</p>
      </div>

      <div className="space-y-8">
        {/* Token Supply Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Token Supply</h3>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-slate-800 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                  <path d="M7 6h1v4" />
                  <path d="m16.71 13.88.7.71-2.82 2.82" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Total Supply</p>
                <p className="text-sm text-slate-400 mb-2">
                  Set the total number of tokens that will be minted. Default is 1,000,000,000 (1 billion).
                </p>
                <div className="relative">
                  <Input
                    id="supply"
                    placeholder="1,000,000,000"
                    value={formatSupply(formData.supply)}
                    onChange={(e) => handleSupplyChange(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-slate-400">{formData.symbol || "Tokens"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Information Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Creator Information</h3>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="addCreatorInfo" className="cursor-pointer">
                  Add Creator Information
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">Add creator details to your token metadata</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-primary">+0.1 SOL</div>
                <Switch
                  id="addCreatorInfo"
                  checked={formData.options.addCreatorInfo}
                  onCheckedChange={(checked) => handleOptionChange("addCreatorInfo", checked)}
                />
              </div>
            </div>

            {formData.options.addCreatorInfo && (
              <div className="pl-4 border-l-2 border-slate-700 space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="creatorName">Creator Name</Label>
                  <Input
                    id="creatorName"
                    placeholder="e.g. MaytaToken"
                    value={formData.options.creatorName}
                    onChange={(e) => handleOptionChange("creatorName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creatorWebsite">Creator Website</Label>
                  <Input
                    id="creatorWebsite"
                    placeholder="e.g. https://maytatoken.com"
                    value={formData.options.creatorWebsite}
                    onChange={(e) => handleOptionChange("creatorWebsite", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="addSocialLinks" className="cursor-pointer">
                  Add Social Links
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">Show social media links for your token</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-primary">+0.1 SOL</div>
                <Switch
                  id="addSocialLinks"
                  checked={formData.options.addSocialLinks}
                  onCheckedChange={(checked) => handleOptionChange("addSocialLinks", checked)}
                />
              </div>
            </div>

            {formData.options.addSocialLinks && (
              <div className="pl-4 border-l-2 border-slate-700 space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="twitterLink">Twitter</Label>
                  <Input
                    id="twitterLink"
                    placeholder="e.g. https://twitter.com/maytatoken"
                    value={formData.options.twitterLink}
                    onChange={(e) => handleOptionChange("twitterLink", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discordLink">Discord</Label>
                  <Input
                    id="discordLink"
                    placeholder="e.g. https://discord.gg/maytatoken"
                    value={formData.options.discordLink}
                    onChange={(e) => handleOptionChange("discordLink", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegramLink">Telegram</Label>
                  <Input
                    id="telegramLink"
                    placeholder="e.g. https://t.me/maytatoken"
                    value={formData.options.telegramLink}
                    onChange={(e) => handleOptionChange("telegramLink", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revoke Authorities Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Token Authorities</h3>
            <p className="text-sm text-slate-400 mb-4">
              Solana Token has 3 authorities: Freeze Authority, Mint Authority, and Update Authority. Revoking them
              increases trust with traders and investors. All authorities are revoked by default for maximum trust.
            </p>
          </div>
          <Separator className="mb-4" />

          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="revokeFreeze" className="cursor-pointer font-medium">
                    Revoke Freeze Authority
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">Freeze Authority allows you to freeze token accounts of holders.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-4">
                  {!formData.options.revokeFreeze && <div className="text-sm text-amber-400">+0.1 SOL</div>}
                  <Switch
                    id="revokeFreeze"
                    checked={formData.options.revokeFreeze}
                    onCheckedChange={(checked) => handleOptionChange("revokeFreeze", checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="revokeMint" className="cursor-pointer font-medium">
                    Revoke Mint Authority
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">Mint Authority allows you to mint more supply of your token.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-4">
                  {!formData.options.revokeMint && <div className="text-sm text-amber-400">+0.1 SOL</div>}
                  <Switch
                    id="revokeMint"
                    checked={formData.options.revokeMint}
                    onCheckedChange={(checked) => handleOptionChange("revokeMint", checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="revokeUpdate" className="cursor-pointer font-medium">
                    Revoke Update Authority
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-80">
                          Update Authority allows you to update the token metadata about your token.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-4">
                  {!formData.options.revokeUpdate && <div className="text-sm text-amber-400">+0.1 SOL</div>}
                  <Switch
                    id="revokeUpdate"
                    checked={formData.options.revokeUpdate}
                    onCheckedChange={(checked) => handleOptionChange("revokeUpdate", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-300">
                <span className="font-semibold">Recommended:</span> Keep all authority revocation enabled for maximum
                trust. This shows investors that you cannot change the token after creation.
              </p>
            </div>
          </div>

          {(!formData.options.revokeFreeze || !formData.options.revokeMint || !formData.options.revokeUpdate) && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-300">
                  <span className="font-semibold">Warning:</span> Disabling authority revocation may reduce trader trust
                  in your token. Each disabled revocation adds a 0.1 SOL fee.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
