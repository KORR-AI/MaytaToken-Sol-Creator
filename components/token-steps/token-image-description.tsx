"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { TokenFormData } from "@/lib/types"

interface TokenImageDescriptionProps {
  formData: TokenFormData
  setFormData: (data: TokenFormData) => void
}

export default function TokenImageDescription({ formData, setFormData }: TokenImageDescriptionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Resize image to 500x500 if needed
    try {
      setIsResizing(true)
      const resizedFile = await resizeImage(file, 500, 500)
      setFormData({
        ...formData,
        image: resizedFile,
      })
      setIsResizing(false)
    } catch (error) {
      console.error("Error resizing image:", error)
      setFormData({
        ...formData,
        image: file,
      })
      setIsResizing(false)
    }
  }

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Set canvas dimensions
        canvas.width = maxWidth
        canvas.height = maxHeight

        // Draw image centered on canvas with white background
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Fill with white background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Calculate position to center the image
        const x = (maxWidth - width) / 2
        const y = (maxHeight - height) / 2

        // Draw the image
        ctx.drawImage(img, x, y, width, height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob from canvas"))
              return
            }

            // Create new file from blob
            const resizedFile = new File([blob], file.name, {
              type: "image/png",
              lastModified: Date.now(),
            })

            resolve(resizedFile)
          },
          "image/png",
          0.9,
        ) // 0.9 quality
      }
      img.onerror = () => {
        reject(new Error("Error loading image"))
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const removeImage = () => {
    setPreviewUrl(null)
    setFormData({
      ...formData,
      image: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      description: e.target.value,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Image & Description</h2>
        <p className="text-slate-300 mb-6">
          Add a visual identity and description for your token. This helps users recognize and understand your token.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label htmlFor="image" className="text-lg">
            Token Image
          </Label>
          {!previewUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-64 flex flex-col items-center justify-center ${
                isDragging ? "border-primary bg-primary/10" : "border-slate-600 hover:border-slate-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-12 w-12 text-slate-400" />
                <div>
                  <p className="text-lg font-medium">Drag and drop your image here</p>
                  <p className="text-sm text-slate-400">or click to browse files</p>
                </div>
                <p className="text-xs text-slate-500">Supported formats: PNG, JPG, JPEG, GIF (max 5MB)</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="relative">
              <Card className="overflow-hidden p-0 border-2 border-slate-700">
                <div className="relative aspect-square bg-slate-800 flex items-center justify-center">
                  {isResizing ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-slate-300">Resizing image...</p>
                    </div>
                  ) : (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Token preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
              <p className="text-sm text-slate-400 mt-2">
                Your image will be resized to 500x500 pixels and uploaded to IPFS
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!previewUrl}
            >
              <FileImage className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="description" className="text-lg">
            Token Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your token and its purpose..."
            value={formData.description}
            onChange={handleDescriptionChange}
            className="min-h-[200px] text-base"
            rows={8}
          />
          <p className="text-sm text-slate-400">
            Provide a clear description of what your token represents and its utility. This will be stored in the
            token's metadata.
          </p>

          <Card className="bg-slate-800 border-slate-700 p-4 mt-4">
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Pro Tip:</span> A good description explains the token's purpose, utility,
              and any special features. This helps users understand the value of your token.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
