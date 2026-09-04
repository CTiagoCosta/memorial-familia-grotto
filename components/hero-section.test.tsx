import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeroSection } from "./hero-section"
import { PersonFilterProvider } from "./person-filter-context"

function renderHero() {
  return render(
    <PersonFilterProvider>
      <HeroSection />
    </PersonFilterProvider>,
  )
}

describe("HeroSection", () => {
  it("shows both names and their years side by side", () => {
    renderHero()
    expect(screen.getByText("Israel Andreo")).toBeInTheDocument()
    expect(screen.getByText("1951 – 2023")).toBeInTheDocument()
    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
    expect(screen.getByText("1956 – 2026")).toBeInTheDocument()
  })

  it("links to the family gallery section", () => {
    renderHero()
    expect(screen.getByRole("link", { name: /galeria da família/i })).toHaveAttribute(
      "href",
      "#galeria-familia",
    )
  })

  it("marks a photo as selected when clicked, and clears it on a second click", async () => {
    const user = userEvent.setup()
    renderHero()

    const israelPhoto = screen.getByRole("button", { name: /israel andreo/i })
    expect(israelPhoto).toHaveAttribute("aria-pressed", "false")

    await user.click(israelPhoto)
    expect(israelPhoto).toHaveAttribute("aria-pressed", "true")

    await user.click(israelPhoto)
    expect(israelPhoto).toHaveAttribute("aria-pressed", "false")
  })

  it("switches selection when the other photo is clicked", async () => {
    const user = userEvent.setup()
    renderHero()

    await user.click(screen.getByRole("button", { name: /israel andreo/i }))
    await user.click(screen.getByRole("button", { name: /sonia grotto/i }))

    expect(screen.getByRole("button", { name: /israel andreo/i })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: /sonia grotto/i })).toHaveAttribute("aria-pressed", "true")
  })
})
