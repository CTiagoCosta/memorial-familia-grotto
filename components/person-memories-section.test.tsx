import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PersonMemoriesSection } from "./person-memories-section"
import { PersonFilterProvider, usePersonFilter } from "./person-filter-context"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))
vi.mock("@/actions/testimonials", () => ({
  listTestimonials: vi.fn(),
  addTestimonial: vi.fn(),
  likeTestimonial: vi.fn(),
  deleteTestimonial: vi.fn(),
}))

const israelImage = {
  id: "img-1",
  scope: "israel" as const,
  title: "No sítio",
  description: null,
  storagePath: "israel/1.jpg",
  url: "https://cdn.test/israel/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}
const soniaImage = {
  id: "img-2",
  scope: "sonia" as const,
  title: "Aniversário",
  description: null,
  storagePath: "sonia/1.jpg",
  url: "https://cdn.test/sonia/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}
const israelTestimonial = {
  id: "t-1",
  person: "israel" as const,
  name: "Amigo",
  message: "Vai fazer muita falta",
  likes: 0,
  likedBy: [],
  createdAt: "2026-01-01T00:00:00Z",
}

const props = {
  initialGalleries: { israel: [israelImage], sonia: [soniaImage] },
  initialTestimonials: { israel: [israelTestimonial], sonia: [] },
  initialIsFamily: false,
}

function renderSection() {
  return render(
    <PersonFilterProvider>
      <PersonMemoriesSection {...props} />
    </PersonFilterProvider>,
  )
}

function TestPersonPicker({ person }: { person: "israel" | "sonia" }) {
  const { togglePerson } = usePersonFilter()
  return <button onClick={() => togglePerson(person)}>selecionar {person} (test)</button>
}

describe("PersonMemoriesSection", () => {
  it("shows Israel's and Sonia's content side by side by default", () => {
    renderSection()
    expect(screen.getByText("No sítio")).toBeInTheDocument()
    expect(screen.getByText("Vai fazer muita falta")).toBeInTheDocument()
    expect(screen.getByText("Aniversário")).toBeInTheDocument()
  })

  it("shows only Sonia's column, plus a reset control, when Sonia is selected", async () => {
    const user = userEvent.setup()
    render(
      <PersonFilterProvider>
        <TestPersonPicker person="sonia" />
        <PersonMemoriesSection {...props} />
      </PersonFilterProvider>,
    )

    await user.click(screen.getByText("selecionar sonia (test)"))

    expect(screen.getByText("Aniversário")).toBeInTheDocument()
    expect(screen.queryByText("No sítio")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /mostrar os dois/i }))

    expect(screen.getByText("No sítio")).toBeInTheDocument()
    expect(screen.getByText("Aniversário")).toBeInTheDocument()
  })
})
