import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(232,180,184,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0B10] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: [
          "bg-[#E8B4B8] text-white",
          "hover:bg-[#F0C8CC]",
          "shadow-[0_0_20px_rgba(232,180,184,0.3)]",
          "hover:shadow-[0_0_30px_rgba(232,180,184,0.5)]",
        ],
        glow: [
          "text-white",
          "bg-gradient-to-r from-[#C4956A] via-[#E8B4B8] to-[#C4A265]",
          "shadow-[0_0_24px_rgba(196,162,101,0.3)]",
          "hover:shadow-[0_0_35px_rgba(196,162,101,0.5)]",
          "hover:scale-[1.02]",
        ],
        destructive: [
          "bg-[rgba(235,87,87,0.1)] text-[#EB5757] border border-[rgba(235,87,87,0.2)]",
          "hover:bg-[rgba(235,87,87,0.2)]",
          "shadow-[0_0_15px_rgba(235,87,87,0.2)]",
          "hover:shadow-[0_0_25px_rgba(235,87,87,0.3)]",
        ],
        outline: [
          "border border-[rgba(232,180,184,0.3)] bg-transparent text-[#B8A99A]",
          "hover:bg-[rgba(232,180,184,0.1)] hover:text-[#F0EBE0] hover:border-[rgba(232,180,184,0.5)]",
          "hover:shadow-[0_0_20px_rgba(232,180,184,0.15)]",
        ],
        secondary: [
          "bg-[#15121A] text-[#B8A99A] border border-[rgba(232,180,184,0.1)]",
          "hover:bg-[#15121A]/80 hover:text-[#F0EBE0] hover:border-[rgba(232,180,184,0.2)]",
        ],
        ghost: [
          "text-[#5A5347]",
          "hover:bg-[rgba(232,180,184,0.1)] hover:text-[#E8B4B8]",
        ],
        glass: [
          "glass-button text-[#F0EBE0]",
          "hover:shadow-[0_0_25px_rgba(232,180,184,0.2)]",
          "focus-visible:ring-[rgba(232,180,184,0.3)]",
        ],
        glassGlow: [
          "glass-button text-[#F0EBE0]",
          "border-[rgba(232,180,184,0.2)]",
          "shadow-[0_0_15px_rgba(232,180,184,0.15)]",
          "hover:border-[rgba(232,180,184,0.3)]",
          "hover:shadow-[0_0_30px_rgba(232,180,184,0.25)]",
        ],
        link: [
          "text-[#E8B4B8] underline-offset-4",
          "hover:underline hover:text-[#F0C8CC]",
        ],
        success: [
          "bg-[rgba(111,207,151,0.1)] text-[#6FCF97] border border-[rgba(111,207,151,0.2)]",
          "hover:bg-[rgba(111,207,151,0.2)]",
          "shadow-[0_0_15px_rgba(111,207,151,0.2)]",
          "hover:shadow-[0_0_25px_rgba(111,207,151,0.3)]",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
