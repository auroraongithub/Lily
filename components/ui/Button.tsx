import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    const variants: Record<Required<ButtonProps>["variant"], string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    }
    const sizes: Record<Required<ButtonProps>["size"], string> = {
      sm: "h-8 px-3",
      md: "h-9 px-4",
      lg: "h-10 px-6",
      icon: "h-9 w-9",
    }

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    )
  }
)
Button.displayName = "Button"
