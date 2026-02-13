import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-[#0E0B10] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F0EBE0] placeholder:text-[#5A5347] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(232,180,184,0.5)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={{
          backgroundColor: "#1C1822",
          color: "#F0EBE0",
          borderColor: "rgba(232,180,184,0.08)",
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
