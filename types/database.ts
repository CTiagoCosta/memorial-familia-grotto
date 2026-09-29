export type Person = "israel" | "sonia"
export type GalleryScope = "family" | Person

const GALLERY_SCOPES: GalleryScope[] = ["family", "israel", "sonia"]

export function isGalleryScope(value: string): value is GalleryScope {
  return (GALLERY_SCOPES as string[]).includes(value)
}

export interface Testimonial {
  id: string
  person: Person
  name: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface GalleryImage {
  id: string
  scope: GalleryScope
  title: string
  description: string | null
  publicId: string
  url: string
  createdAt: string
}
