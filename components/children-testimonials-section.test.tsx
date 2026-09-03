import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChildrenTestimonialsSection } from "./children-testimonials-section"

describe("ChildrenTestimonialsSection", () => {
  it("renders a card for every child testimonial", () => {
    render(<ChildrenTestimonialsSection />)
    expect(screen.getByText("Silvana Grotto")).toBeInTheDocument()
    expect(screen.getByText("Silvio Grotto")).toBeInTheDocument()
    expect(screen.getByText("Sandro Grotto")).toBeInTheDocument()
    expect(screen.getByText("Samira Grotto")).toBeInTheDocument()
  })

  it("opens the full testimonial in a dialog when a card is clicked", async () => {
    const user = userEvent.setup()
    render(<ChildrenTestimonialsSection />)

    await user.click(screen.getByText("Silvana Grotto"))

    expect(await screen.findByText(/honrarei sua memória/i)).toBeInTheDocument()
  })
})
