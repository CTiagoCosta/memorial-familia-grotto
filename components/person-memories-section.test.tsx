import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PersonMemoriesSection } from "./person-memories-section"

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
  initialPerson: "israel" as const,
  initialGalleries: { israel: [israelImage], sonia: [soniaImage] },
  initialTestimonials: { israel: [israelTestimonial], sonia: [] },
  initialIsFamily: false,
}

describe("PersonMemoriesSection", () => {
  it("shows Israel's content by default", () => {
    render(<PersonMemoriesSection {...props} />)
    expect(screen.getByText("No sítio")).toBeInTheDocument()
    expect(screen.getByText("Vai fazer muita falta")).toBeInTheDocument()
    expect(screen.queryByText("Aniversário")).not.toBeInTheDocument()
  })

  it("switches to Sonia's content when her tab is selected", async () => {
    const user = userEvent.setup()
    render(<PersonMemoriesSection {...props} />)

    await user.click(screen.getByRole("tab", { name: /sonia/i }))

    expect(screen.getByText("Aniversário")).toBeInTheDocument()
    expect(screen.queryByText("No sítio")).not.toBeInTheDocument()
  })
})
