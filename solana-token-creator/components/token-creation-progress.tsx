"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TokenCreationProgressProps {
  isCreating: boolean
  progress: number
  stage: string
  onComplete?: () => void
}

export default function TokenCreationProgress({ isCreating, progress, stage, onComplete }: TokenCreationProgressProps) {
  const [glowIntensity, setGlowIntensity] = useState(0)
  const [showCompleteButton, setShowCompleteButton] = useState(false)

  // Increase glow intensity as progress increases
  useEffect(() => {
    if (isCreating) {
      setGlowIntensity(progress / 100)
    } else {
      setGlowIntensity(0)
    }
  }, [isCreating, progress])

  // Show complete button when progress is high
  useEffect(() => {
    let completeTimer: NodeJS.Timeout | null = null

    if (progress >= 90 && isCreating && onComplete && !showCompleteButton) {
      // Show complete button after 15 seconds if at high progress
      completeTimer = setTimeout(() => {
        setShowCompleteButton(true)
      }, 15000)
    }

    return () => {
      if (completeTimer) {
        clearTimeout(completeTimer)
      }
    }
  }, [progress, isCreating, onComplete, showCompleteButton])

  // Force completion after a reasonable time at high progress
  useEffect(() => {
    let forceCompleteTimer: NodeJS.Timeout | null = null

    // If we're at high progress (>95%) for a while, force completion
    if (progress >= 95 && isCreating && onComplete) {
      forceCompleteTimer = setTimeout(() => {
        console.log("Force completing after high progress timeout")
        onComplete()
      }, 10000) // Force completion after 10 seconds at high progress
    }

    return () => {
      if (forceCompleteTimer) {
        clearTimeout(forceCompleteTimer)
      }
    }
  }, [progress, isCreating, onComplete])

  if (!isCreating) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-xl opacity-50"
          style={{ opacity: glowIntensity * 0.5 }}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6">
            {progress < 100 ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
          </div>

          <h3 className="text-xl font-bold text-center mb-2">Creating Your Token</h3>
          <p className="text-slate-400 text-center mb-6">{stage}</p>

          {/* Progress bar container */}
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative mb-2">
            {/* Progress bar */}
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>

            {/* Animated glow effect */}
            <div
              className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-30 blur-sm"
              style={{ width: `${progress}%` }}
            ></div>

            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-white animate-pulse"
                  style={{
                    left: `${(progress - 5) * Math.random()}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.7 + 0.3,
                    animationDelay: `${i * 0.2}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Percentage text */}
          <p className="text-center font-mono text-lg font-bold">
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400"
              style={{ opacity: 0.5 + glowIntensity * 0.5 }}
            >
              {Math.round(progress)}%
            </span>
          </p>

          {/* Show complete button if needed */}
          {showCompleteButton && progress >= 90 && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={onComplete}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
              >
                Continue to Next Step
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
