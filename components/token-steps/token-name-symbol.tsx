"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
