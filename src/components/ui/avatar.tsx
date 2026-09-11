import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * avatar.tsx — padrão shadcn/ui, escrito à mão.
 *
 * Sem `AvatarImage` de propósito: o brief proíbe imagem externa, então todo
 * avatar é o fallback com iniciais sobre a cor do token.
 */
function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-ink-200 bg-ink-100 align-middle",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center text-xs font-semibold tracking-wide text-ink-700 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
