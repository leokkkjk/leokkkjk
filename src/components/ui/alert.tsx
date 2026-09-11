import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * alert.tsx — padrão shadcn/ui, escrito à mão.
 * Usado para o diagnóstico de schema do login e para o aviso de permissão.
 */
const alertVariants = cva(
  "relative flex w-full gap-3 rounded-(--radius-card) border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:size-4",
  {
    variants: {
      variant: {
        atencao: "border-atencao-300 bg-atencao-50 text-atencao-900",
        critico: "border-critico-300 bg-critico-50 text-critico-700",
        acento: "border-acento-200 bg-acento-50 text-acento-900",
        neutro: "border-ink-200 bg-ink-50 text-ink-800",
      },
    },
    defaultVariants: {
      variant: "neutro",
    },
  },
);

export type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("font-semibold tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm leading-relaxed opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
