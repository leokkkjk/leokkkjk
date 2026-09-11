import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes do Tailwind resolvendo conflitos (padrão shadcn/ui). */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}

/** Iniciais para o avatar: "Gisele Gerente (Equipe A)" -> "GG". */
export function iniciais(nome: string): string {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (!limpo) return "?";

  const partes = limpo.split(" ").filter((parte) => parte.length > 0 && !/^[()[\]{}]/.test(parte));
  if (partes.length === 0) return limpo.slice(0, 2).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

/** Primeiro nome, para cabeçalhos apertados: "Gisele Gerente (Equipe A)" -> "Gisele". */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}
