"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins } from "lucide-react"
import type { TokenFormData } from "@/lib/types"

interface TokenNameSymbolProps {
  formData: TokenFormData
  setFormData: (data: TokenFormData) => void
}

export default function TokenNameSymbol({ formData, setFormData }: TokenNameSymbolProps) {
  const handleChange = (field: keyof Pick<TokenFormData, "name" | "symbol" | "decimals">, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
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

    // Check if it's a valid number and within reasonable limits
    if (!isNaN(numValue) && numValue >= 0 && numValue <= Number.MAX_SAFE_INTEGER) {
      setFormData({
        ...formData,
        supply: numValue,
      })
      // Log the updated supply for debugging
      console.log("Supply updated to:", numValue)
    } else {
      console.warn("Invalid supply value:", numValue)
    }
  }

  // Format the supply with commas for display
  const formatSupply = (value: number): string => {
    // If value is 0, return empty string to show placeholder
    if (value === 0) return ""
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Identity</h2>
        <p className="text-slate-300 mb-6">
          Start by giving your token a name and symbol. Choose something memorable and unique.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-lg">
            Token Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. My Awesome Token"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="h-12 text-lg"
            required
          />
          <p className="text-sm text-slate-400">The full name of your token (e.g. "Solana")</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="symbol" className="text-lg">
            Token Symbol
          </Label>
          <Input
            id="symbol"
            placeholder="e.g. MAT"
            value={formData.symbol}
            onChange={(e) => handleChange("symbol", e.target.value.toUpperCase())}
            maxLength={10}
            className="h-12 text-lg uppercase"
            required
          />
          <p className="text-sm text-slate-400">A short ticker symbol for your token (e.g. "SOL")</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="supply" className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5" /> Total Supply
          </Label>
          <div className="relative">
            <Input
              id="supply"
              placeholder="1,000,000,000"
              value={formatSupply(formData.supply)}
              onChange={(e) => handleSupplyChange(e.target.value)}
              className="h-12 text-lg pr-20"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-base text-slate-400">{formData.symbol || "Tokens"}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            The total number of tokens that will be created. Default is 1,000,000,000 (1 billion).
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="decimals" className="text-lg">
            Decimals
          </Label>
          <Select
            value={formData.decimals.toString()}
            onValueChange={(value) => handleChange("decimals", Number.parseInt(value))}
          >
            <SelectTrigger className="h-12 text-lg">
              <SelectValue placeholder="Select decimals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9 (recommended)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-400">
            The number of decimal places for your token. 9 is standard for most tokens.
          </p>
        </div>
      </div>
    </div>
  )
}
