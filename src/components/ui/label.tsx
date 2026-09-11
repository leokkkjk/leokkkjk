"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * label.tsx — padrão shadcn/ui, escrito à mão.
 * Precisa ser client: usa onMouseDown para evitar perder o foco do campo.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex select-none items-center gap-2 text-sm font-medium leading-none text-ink-800",
        "peer-disabled:cursor-not-allowed peer-disabled:text-ink-400",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
