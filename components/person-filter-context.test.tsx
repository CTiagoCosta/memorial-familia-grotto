import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PersonFilterProvider, usePersonFilter } from "./person-filter-context"

function Probe() {
  const { selectedPerson, togglePerson, clearPerson } = usePersonFilter()
  return (
    <div>
      <p>selected: {selectedPerson ?? "none"}</p>
      <button onClick={() => togglePerson("israel")}>toggle israel</button>
      <button onClick={() => togglePerson("sonia")}>toggle sonia</button>
      <button onClick={clearPerson}>clear</button>
    </div>
  )
}

describe("PersonFilterProvider", () => {
  it("starts with no person selected", () => {
    render(
      <PersonFilterProvider>
        <Probe />
      </PersonFilterProvider>,
    )
    expect(screen.getByText("selected: none")).toBeInTheDocument()
  })

  it("selects a person when toggled on, and clears when toggled again", async () => {
    const user = userEvent.setup()
    render(
      <PersonFilterProvider>
        <Probe />
      </PersonFilterProvider>,
    )

    await user.click(screen.getByText("toggle israel"))
    expect(screen.getByText("selected: israel")).toBeInTheDocument()

    await user.click(screen.getByText("toggle israel"))
    expect(screen.getByText("selected: none")).toBeInTheDocument()
  })

  it("switches directly from one person to the other", async () => {
    const user = userEvent.setup()
    render(
      <PersonFilterProvider>
        <Probe />
      </PersonFilterProvider>,
    )

    await user.click(screen.getByText("toggle israel"))
    await user.click(screen.getByText("toggle sonia"))
    expect(screen.getByText("selected: sonia")).toBeInTheDocument()
  })

  it("clears the selection via clearPerson", async () => {
    const user = userEvent.setup()
    render(
      <PersonFilterProvider>
        <Probe />
      </PersonFilterProvider>,
    )

    await user.click(screen.getByText("toggle israel"))
    await user.click(screen.getByText("clear"))
    expect(screen.getByText("selected: none")).toBeInTheDocument()
  })
})
