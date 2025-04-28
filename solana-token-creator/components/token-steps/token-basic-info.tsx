"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins } from "lucide-react"
import type { TokenFormData } from "@/lib/types"

interface TokenBasicInfoProps {
  formData: TokenFormData
  setFormData: (data: TokenFormData) => void
}

export default function TokenBasicInfo({ formData, setFormData }: TokenBasicInfoProps) {
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

  const handleChange = (field: keyof Omit<TokenFormData, "image" | "options">, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Basic Information</h2>
        <p className="text-slate-300 mb-6">
          Enter the basic details for your token. Choose a memorable name and a short symbol.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            placeholder="e.g. My Awesome Token"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
          <p className="text-xs text-slate-400">The full name of your token (e.g. "Solana")</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">Token Symbol</Label>
          <Input
            id="symbol"
            placeholder="e.g. MAT"
            value={formData.symbol}
            onChange={(e) => handleChange("symbol", e.target.value.toUpperCase())}
            maxLength={10}
            required
          />
          <p className="text-xs text-slate-400">A short ticker symbol for your token (e.g. "SOL")</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supply" className="flex items-center gap-2">
            <Coins className="h-4 w-4" /> Total Supply
          </Label>
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
          <p className="text-xs text-slate-400">
            The total number of tokens that will be created. Default is 1,000,000,000 (1 billion).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your token and its purpose"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
          />
          <p className="text-xs text-slate-400">A brief description of your token and its purpose</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decimals">Decimals</Label>
          <Select
            value={formData.decimals.toString()}
            onValueChange={(value) => handleChange("decimals", Number.parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select decimals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9 (recommended)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">
            The number of decimal places for your token. 9 is standard for most tokens.
          </p>
        </div>
      </div>
    </div>
  )
}
