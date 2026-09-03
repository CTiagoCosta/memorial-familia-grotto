"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, LogOut, Moon, Shield, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { logoutFamily } from "@/actions/family-auth"

const LINKS = [
  { href: "#home", label: "Início" },
  { href: "#depoimentos-filhos", label: "Depoimentos" },
  { href: "#musica", label: "Música" },
  { href: "#galeria-familia", label: "Galeria da Família" },
  { href: "#memorias-por-pessoa", label: "Memórias" },
]

interface NavigationProps {
  isFamily: boolean
}

export function Navigation({ isFamily: initialIsFamily }: NavigationProps) {
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logoutFamily()
    setIsFamily(false)
    router.refresh()
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-sage-200/50 bg-white/80 backdrop-blur-md dark:bg-sage-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-sage-500" />
          <span className="font-serif text-lg font-bold text-sage-800 dark:text-sage-100">Família Grotto</span>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-sage-600 hover:text-sage-800 dark:text-sage-300">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isFamily && (
            <>
              <Badge variant="secondary" className="border-sage-300 bg-sage-100 text-sage-800">
                <Shield className="mr-1 h-3 w-3" /> Família
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-3 w-3" /> Sair
              </Button>
            </>
          )}
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-sage-500" />
            <Switch
              checked={mounted && theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
            <Moon className="h-4 w-4 text-sage-500" />
          </div>
        </div>
      </div>
    </nav>
  )
}
