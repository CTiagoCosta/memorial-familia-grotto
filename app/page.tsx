import { HeroSection } from "@/components/hero-section"
import { ChildrenTestimonialsSection } from "@/components/children-testimonials-section"
import { MusicSection } from "@/components/music-section"
import { FamilyGallerySection } from "@/components/family-gallery-section"
import { PersonMemoriesSection } from "@/components/person-memories-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { listGalleryImages } from "@/actions/gallery"
import { listTestimonials } from "@/actions/testimonials"
import { getFamilySession } from "@/lib/auth/get-family-session"

export default async function MemorialPage() {
  const [isFamily, familyImages, israelImages, soniaImages, israelTestimonials, soniaTestimonials] =
    await Promise.all([
      getFamilySession(),
      listGalleryImages("family"),
      listGalleryImages("israel"),
      listGalleryImages("sonia"),
      listTestimonials("israel"),
      listTestimonials("sonia"),
    ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation isFamily={isFamily} />
      <HeroSection />
      <ChildrenTestimonialsSection />
      <MusicSection />
      <FamilyGallerySection initialImages={familyImages} initialIsFamily={isFamily} />
      <PersonMemoriesSection
        initialPerson="israel"
        initialGalleries={{ israel: israelImages, sonia: soniaImages }}
        initialTestimonials={{ israel: israelTestimonials, sonia: soniaTestimonials }}
        initialIsFamily={isFamily}
      />
      <Footer />
    </div>
  )
}
