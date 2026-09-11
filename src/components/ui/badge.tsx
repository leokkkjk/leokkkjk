import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * badge.tsx — padrão shadcn/ui, escrito à mão.
 *
 * As variantes são SEMÂNTICAS (neutro / acento / positivo / atencao / critico),
 * mapeadas para tokens do design system. O acoplamento com domínio
 * (perfil de usuário) fica em src/components/perfil-badge.tsx.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutro: "border-ink-200 bg-ink-100 text-ink-700",
        acento: "border-acento-200 bg-acento-50 text-acento-700",
        positivo: "border-positivo-300 bg-positivo-50 text-positivo-700",
        atencao: "border-atencao-300 bg-atencao-50 text-atencao-900",
        critico: "border-critico-300 bg-critico-50 text-critico-700",
        escuro: "border-white/15 bg-white/10 text-ink-100",
        vazio: "border-transparent bg-transparent text-ink-500",
      },
      size: {
        sm: "px-2 py-0 text-[11px]",
        default: "",
      },
    },
    defaultVariants: {
      variant: "neutro",
      size: "default",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
