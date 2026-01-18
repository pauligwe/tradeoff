import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#3fb950]",
  {
    variants: {
      variant: {
        default: "bg-white text-[#0d1117] hover:brightness-110",
        accent: "bg-[#3fb950] text-white hover:brightness-110 border border-[#3fb950]",
        yes: "bg-transparent text-[#3fb950] border border-[#3fb950] hover:bg-[#3fb950] hover:text-white",
        no: "bg-transparent text-[#f85149] border border-[#f85149] hover:bg-[#f85149] hover:text-white",
        destructive: "bg-[#f85149] text-white hover:brightness-110",
        outline: "border border-[#2d3139] bg-transparent hover:border-[#3fb950]",
        secondary: "bg-[#2d3139] text-white hover:brightness-110",
        ghost: "text-[#858687] hover:text-white hover:bg-[#2d3139]",
        link: "text-[#58a6ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
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
