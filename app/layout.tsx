import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Memorial Família Grotto",
  description: "Em memória de Israel Andreo e Sonia Grotto",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
