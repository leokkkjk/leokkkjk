import * as React from "react";

import { cn } from "@/lib/utils";

/** input.tsx — padrão shadcn/ui, escrito à mão. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-xs transition-colors duration-150",
        "placeholder:text-ink-400",
        "hover:border-ink-300",
        "focus:border-acento-500 focus:ring-4 focus:ring-acento-500/15 focus:outline-none",
        "aria-invalid:border-critico-600 aria-invalid:focus:ring-critico-600/15",
        "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
