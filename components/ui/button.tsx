import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#3fb950] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12161c]",
  {
    variants: {
      variant: {
        default: "bg-white text-[#12161c] hover:bg-white/90",
        accent: "bg-[#3fb950] text-white hover:bg-[#2ea043]",
        yes: "bg-[rgba(63,185,80,0.15)] text-[#3fb950] border border-[rgba(63,185,80,0.4)] hover:bg-[rgba(63,185,80,0.25)] hover:border-[rgba(63,185,80,0.6)]",
        no: "bg-[rgba(248,81,73,0.15)] text-[#f85149] border border-[rgba(248,81,73,0.4)] hover:bg-[rgba(248,81,73,0.25)] hover:border-[rgba(248,81,73,0.6)]",
        destructive: "bg-[#f85149] text-white hover:bg-[#da3633]",
        outline: "border border-[#2d3139] bg-[#1c2026] hover:bg-[#252932] hover:border-[#3d4149]",
        secondary: "bg-[#252932] text-white hover:bg-[#2d3139]",
        ghost: "text-[#858687] hover:text-white hover:bg-[#252932]",
        link: "text-[#58a6ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
