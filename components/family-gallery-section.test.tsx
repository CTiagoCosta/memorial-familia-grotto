import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FamilyGallerySection } from "./family-gallery-section"

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

const sampleImage = {
  id: "1",
  scope: "family" as const,
  title: "Piquenique em família",
  description: null,
  storagePath: "family/1.jpg",
  url: "https://cdn.test/family/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}

describe("FamilyGallerySection", () => {
  it("renders the initial images passed from the server", () => {
    render(<FamilyGallerySection initialImages={[sampleImage]} initialIsFamily={false} />)
    expect(screen.getByText("Piquenique em família")).toBeInTheDocument()
  })

  it("shows an empty state when there are no photos yet", () => {
    render(<FamilyGallerySection initialImages={[]} initialIsFamily={false} />)
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })

  it("prompts login instead of the upload form when not authenticated as family", async () => {
    const user = userEvent.setup()
    render(<FamilyGallerySection initialImages={[]} initialIsFamily={false} />)

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByText(/acesso da família/i)).toBeInTheDocument()
  })
})
