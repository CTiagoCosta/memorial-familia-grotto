import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChildrenTestimonialsSection } from "./children-testimonials-section"
import { PersonFilterProvider, usePersonFilter } from "./person-filter-context"

function renderSection() {
  return render(
    <PersonFilterProvider>
      <ChildrenTestimonialsSection />
    </PersonFilterProvider>,
  )
}

function TestPersonPicker({ person }: { person: "israel" | "sonia" }) {
  const { togglePerson } = usePersonFilter()
  return <button onClick={() => togglePerson(person)}>selecionar {person} (test)</button>
}

describe("ChildrenTestimonialsSection", () => {
  it("shows testimonials for both Israel and Sonia by default", () => {
    renderSection()
    expect(screen.getByText("Israel Andreo")).toBeInTheDocument()
    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
    expect(screen.getAllByText("Silvana Grotto")).toHaveLength(2)
    expect(screen.getAllByText("Silvio Grotto")).toHaveLength(2)
    expect(screen.getAllByText("Sandro Grotto")).toHaveLength(2)
    expect(screen.getAllByText("Samira Grotto")).toHaveLength(2)
  })

  it("opens the full testimonial in a dialog when a card is clicked", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(screen.getAllByText("Silvana Grotto")[0])

    expect(await screen.findByText(/honrarei sua memória/i)).toBeInTheDocument()
  })

  it("shows only Sonia's testimonials, plus a reset control, when Sonia is selected", async () => {
    const user = userEvent.setup()
    render(
      <PersonFilterProvider>
        <TestPersonPicker person="sonia" />
        <ChildrenTestimonialsSection />
      </PersonFilterProvider>,
    )

    await user.click(screen.getByText("selecionar sonia (test)"))

    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
    expect(screen.queryByText("Israel Andreo")).not.toBeInTheDocument()
    expect(screen.getAllByText("Silvana Grotto")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: /mostrar os dois/i }))

    expect(screen.getByText("Israel Andreo")).toBeInTheDocument()
    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
  })
})
