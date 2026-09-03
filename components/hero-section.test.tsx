import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HeroSection } from "./hero-section"

describe("HeroSection", () => {
  it("shows both names and their years side by side", () => {
    render(<HeroSection />)
    expect(screen.getByText("Israel Andreo")).toBeInTheDocument()
    expect(screen.getByText("1951 – 2023")).toBeInTheDocument()
    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
    expect(screen.getByText("1956 – 2026")).toBeInTheDocument()
  })

  it("links to the family gallery section", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: /galeria da família/i })).toHaveAttribute(
      "href",
      "#galeria-familia",
    )
  })
})
