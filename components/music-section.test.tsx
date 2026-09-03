import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MusicSection } from "./music-section"

describe("MusicSection", () => {
  it("shows the song title and attributes it to Israel", () => {
    render(<MusicSection />)
    expect(screen.getByText("Vida Melhor")).toBeInTheDocument()
    expect(screen.getByText(/israel andreo/i)).toBeInTheDocument()
  })

  it("renders the first lyric line", () => {
    render(<MusicSection />)
    expect(screen.getByText(/eu fiz de tudo pra tratar vida melhor/i)).toBeInTheDocument()
  })
})
