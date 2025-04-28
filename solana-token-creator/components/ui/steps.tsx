import { cn } from "@/lib/utils"

interface Step {
  title: string
  description?: string
}

interface StepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn("flex w-full", className)}>
      {steps.map((step, index) => (
        <div key={index} className={cn("flex-1 flex flex-col items-center", index !== steps.length - 1 && "relative")}>
          {/* Connector line */}
          {index !== steps.length - 1 && (
            <div
              className={cn(
                "absolute top-4 w-full h-0.5 left-1/2",
                index < currentStep ? "bg-primary" : "bg-slate-700",
              )}
            />
          )}

          {/* Step circle */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center z-10 border-2",
              index < currentStep
                ? "bg-primary border-primary text-primary-foreground"
                : index === currentStep
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-slate-800 border-slate-700 text-slate-500",
            )}
          >
            {index < currentStep ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span>{index + 1}</span>
            )}
          </div>

          {/* Step title and description */}
          <div className="mt-2 text-center">
            <p className={cn("font-medium", index <= currentStep ? "text-white" : "text-slate-500")}>{step.title}</p>
            {step.description && (
              <p className={cn("text-xs mt-0.5", index <= currentStep ? "text-slate-300" : "text-slate-600")}>
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
