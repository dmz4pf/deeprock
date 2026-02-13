import * as React from "react"

import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════════════════
   CARD COMPONENT WITH PREMIUM GLASS EFFECTS
   Base card with enhanced glassmorphism and glow effects
   ═══════════════════════════════════════════════════════════════════════════ */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[rgba(232,180,184,0.08)] bg-[var(--forge-surface)] text-[#F0EBE0]",
      "shadow-[0_0_20px_rgba(232,180,184,0.04)]",
      "transition-all duration-300",
      "hover:border-[rgba(201,160,220,0.2)] hover:shadow-[0_0_30px_rgba(232,180,184,0.08)]",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/* Enhanced Glass Card variant */
const CardGlass = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass glass-frost rounded-xl text-[#F0EBE0]",
      "transition-all duration-300",
      "hover:border-[rgba(232,180,184,0.12)]",
      "hover:shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_30px_rgba(232,180,184,0.08)]",
      className
    )}
    {...props}
  />
))
CardGlass.displayName = "CardGlass"

/* Elevated Glass Card - appears to float above the surface */
const CardElevated = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass-elevated glass-frost rounded-xl text-[#F0EBE0]",
      "transition-all duration-300",
      "hover:translate-y-[-2px]",
      "hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_40px_rgba(232,180,184,0.1)]",
      className
    )}
    {...props}
  />
))
CardElevated.displayName = "CardElevated"

/* Interactive Glass Card - stronger hover effects for clickable cards */
const CardInteractive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass glass-interactive glass-frost rounded-xl text-[#F0EBE0] cursor-pointer",
      className
    )}
    {...props}
  />
))
CardInteractive.displayName = "CardInteractive"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-[#F0EBE0]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[#B8A99A]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardGlass,
  CardElevated,
  CardInteractive,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
}
