import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Navigation } from "./navigation"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe("Navigation", () => {
  it("shows a 'Família' badge and a Sair button when authenticated", () => {
    render(<Navigation isFamily={true} />)
    expect(screen.getByText("Família")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument()
  })

  it("hides the Família badge when not authenticated", () => {
    render(<Navigation isFamily={false} />)
    expect(screen.queryByText("Família")).not.toBeInTheDocument()
  })

  it("links to every page section by anchor", () => {
    render(<Navigation isFamily={false} />)
    expect(screen.getByRole("link", { name: /início/i })).toHaveAttribute("href", "#home")
    expect(screen.getByRole("link", { name: /depoimentos/i })).toHaveAttribute("href", "#depoimentos-filhos")
    expect(screen.getByRole("link", { name: /música/i })).toHaveAttribute("href", "#musica")
    expect(screen.getByRole("link", { name: /galeria da família/i })).toHaveAttribute("href", "#galeria-familia")
    expect(screen.getByRole("link", { name: /memórias/i })).toHaveAttribute("href", "#memorias-por-pessoa")
  })
})
