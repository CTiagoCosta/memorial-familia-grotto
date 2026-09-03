"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { childrenTestimonials } from "@/content/children-testimonials"

export function ChildrenTestimonialsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="depoimentos-filhos" className="bg-sage-50 py-20 dark:bg-sage-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">
            Depoimentos dos Filhos
          </h2>
          <p className="text-xl text-sage-600 dark:text-sage-300">
            Clique nos cards para ler o depoimento completo de cada filho.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {childrenTestimonials.map((item, index) => (
            <Card
              key={item.name}
              onClick={() => setOpenIndex(index)}
              className="cursor-pointer border-0 bg-white/80 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border dark:border-sage-700/60 dark:bg-sage-800/80"
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-sage-300">
                  <Image src={item.photo} alt={item.name} width={96} height={96} className="h-full w-full object-cover" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-sage-800 dark:text-sage-100">{item.name}</h3>
                <p className="text-sm text-sage-600 dark:text-sage-300">{item.description}</p>
                <p className="mt-3 text-xs text-sage-500 underline">Ler mais</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{openIndex !== null ? childrenTestimonials[openIndex].name : ""}</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line text-base">
            {openIndex !== null ? childrenTestimonials[openIndex].fullText : ""}
          </p>
        </DialogContent>
      </Dialog>
    </section>
  )
}
