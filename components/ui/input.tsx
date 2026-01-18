import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 border border-[#2d3139] bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#858687] transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-[#3fb950]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
        className
      )}
      {...props}
    />
  )
}

export { Input }
