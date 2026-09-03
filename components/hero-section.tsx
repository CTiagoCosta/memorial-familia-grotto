import Image from "next/image"
import { israelContent } from "@/content/israel"
import { soniaContent } from "@/content/sonia"

export function HeroSection() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-[url('/assets/img/sitio.jpg')] bg-cover bg-center opacity-20" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="mb-6 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">
          Em memória de vocês
        </h1>
        <div className="mb-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          {[
            { content: israelContent },
            { content: soniaContent },
          ].map(({ content }) => (
            <div key={content.name} className="flex flex-col items-center">
              <div className="mb-4 h-36 w-36 overflow-hidden rounded-full border-4 border-sage-300 shadow-xl">
                <Image
                  src={content.heroPhoto}
                  alt={content.name}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold text-sage-800 dark:text-sage-100">{content.name}</h2>
              <p className="text-sage-600 dark:text-sage-300">{content.years}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-sage-700 dark:text-sage-200">
          Uma vida de amor, união e família. Para sempre em nossos corações.
        </p>
        <a
          href="#galeria-familia"
          className="inline-flex items-center rounded-full bg-sage-500 px-8 py-3 text-white shadow-lg transition-colors hover:bg-sage-600"
        >
          Ver galeria da família
        </a>
      </div>
    </section>
  )
}
