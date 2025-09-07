import * as React from "react"
import { cn } from "@/lib/utils"

export function Toolbar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-1 rounded-md border bg-card px-2 py-1", className)} {...props} />
}
