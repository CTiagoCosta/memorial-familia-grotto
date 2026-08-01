export type Person = "israel" | "sonia"
export type GalleryScope = "family" | Person

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
  storagePath: string
  url: string
  createdAt: string
}
