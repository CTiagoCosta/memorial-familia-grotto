import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-auto bg-sage-900 py-12 text-sage-100">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-rose-300" />
          <span className="font-serif text-2xl font-bold">Israel Andreo &amp; Sonia Grotto</span>
        </div>
        <p className="mx-auto mb-4 max-w-xl text-sage-200 italic">
          "A morte não é o oposto da vida, mas parte dela. O amor permanece para sempre."
        </p>
        <div className="text-xs text-sage-400">Memorial criado com amor pela família</div>
      </div>
    </footer>
  )
}
