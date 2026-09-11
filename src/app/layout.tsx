import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Fonte única do design system, servida pelo next/font (self-hosted, sem
 * requisição ao Google no runtime). A variável `--font-inter` é consumida pelo
 * token `--font-sans` em globals.css — nenhum componente fala de fonte.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Central de Equipes",
    template: "%s · Central de Equipes",
  },
  description:
    "Plataforma interna do correspondente bancário: hierarquia de equipes, perfis e visibilidade de dados.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased">{children}</body>
    </html>
  );
}
