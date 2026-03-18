import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rounded"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-shimmer bg-size-[200%_100%]",
        variant === "circular" && "rounded-full",
        variant === "rounded" && "rounded-lg",
        variant === "default" && "rounded-md",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
