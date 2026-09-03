import { Globe, Heart, Mail, MessageCircle } from "lucide-react"

const DEVELOPER_CONTACT = {
  whatsapp: { href: "https://wa.me/5567992825522", label: "(67) 99282-5522" },
  email: { href: "mailto:ctsctiago@gmail.com", label: "ctsctiago@gmail.com" },
  site: { href: "https://www.tiagocostadev.com.br/", label: "tiagocostadev.com.br" },
}

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
        <div className="mb-6 text-xs text-sage-400">Memorial criado com amor pela família</div>

        <div className="mx-auto max-w-md border-t border-sage-700/60 pt-6">
          <p className="mb-3 text-xs text-sage-400">Quer um memorial digital como este para sua família?</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-sage-200">
            <a
              href={DEVELOPER_CONTACT.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              {DEVELOPER_CONTACT.whatsapp.label}
            </a>
            <a
              href={DEVELOPER_CONTACT.email.href}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
              {DEVELOPER_CONTACT.email.label}
            </a>
            <a
              href={DEVELOPER_CONTACT.site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {DEVELOPER_CONTACT.site.label}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
