import * as React from "react"
import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("inline-flex items-center rounded-md", className)} {...props} />
  )
)
ButtonGroup.displayName = "ButtonGroup"

const ButtonGroupText = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("inline-flex items-center", className)} {...props} />
  )
)
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupText }
