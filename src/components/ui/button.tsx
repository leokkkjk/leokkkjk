import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * button.tsx — padrão shadcn/ui, escrito à mão (sem CLI).
 * Todas as cores vêm dos tokens de globals.css.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-500 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-acento-600 text-white shadow-sm hover:bg-acento-700 active:scale-[0.985]",
        secondary:
          "bg-ink-100 text-ink-900 hover:bg-ink-200 active:scale-[0.985]",
        outline:
          "border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 active:scale-[0.985]",
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
        danger: "bg-critico-600 text-white shadow-sm hover:bg-critico-700",
        invertido:
          "border border-white/15 bg-white/5 text-ink-100 hover:border-white/30 hover:bg-white/10",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        default: "h-10 px-4 [&_svg]:size-4",
        lg: "h-11 px-5 text-sm [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
