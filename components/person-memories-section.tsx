"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, Heart, ImageIcon, Loader2, Lock, Plus, Send, Trash2, Upload } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FamilyLoginDialog } from "@/components/family-login-dialog"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "@/actions/gallery"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "@/actions/testimonials"
import { formatRelativeDate } from "@/lib/format"
import { israelContent } from "@/content/israel"
import { soniaContent } from "@/content/sonia"
import type { GalleryImage, Person, Testimonial } from "@/types/database"

interface PersonMemoriesSectionProps {
  initialPerson: Person
  initialGalleries: Record<Person, GalleryImage[]>
  initialTestimonials: Record<Person, Testimonial[]>
  initialIsFamily: boolean
}

const PEOPLE: { id: Person; name: string }[] = [
  { id: "israel", name: israelContent.name },
  { id: "sonia", name: soniaContent.name },
]

function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  let id = window.localStorage.getItem("grotto-session-id")
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem("grotto-session-id", id)
  }
  return id
}

export function PersonMemoriesSection({
  initialPerson,
  initialGalleries,
  initialTestimonials,
  initialIsFamily,
}: PersonMemoriesSectionProps) {
  const [person, setPerson] = useState<Person>(initialPerson)
  const [galleries, setGalleries] = useState(initialGalleries)
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const [showLogin, setShowLogin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [newName, setNewName] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const images = galleries[person]
  const mural = testimonials[person]

  const refreshGallery = async () => {
    const updated = await listGalleryImages(person)
    setGalleries((prev) => ({ ...prev, [person]: updated }))
  }

  const refreshTestimonials = async () => {
    const updated = await listTestimonials(person)
    setTestimonials((prev) => ({ ...prev, [person]: updated }))
  }

  const handleAddPhotoClick = () => {
    if (isFamily) setShowUpload(true)
    else setShowLogin(true)
  }

  const handlePublishPhoto = async () => {
    if (!file || !title.trim()) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("title", title.trim())
    formData.set("description", description.trim())
    formData.set("file", file)

    const result = await uploadGalleryImage(person, formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setTitle("")
    setDescription("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setShowUpload(false)
    await refreshGallery()
  }

  const handleDeletePhoto = async (imageId: string) => {
    await deleteGalleryImage(person, imageId)
    await refreshGallery()
  }

  const handleAddTestimonial = async () => {
    if (!newName.trim() || !newMessage.trim()) return
    const result = await addTestimonial(person, newName, newMessage)
    if (!result.error) {
      setNewName("")
      setNewMessage("")
      await refreshTestimonials()
    }
  }

  const handleLike = async (testimonialId: string) => {
    await likeTestimonial(person, testimonialId, getSessionId())
    await refreshTestimonials()
  }

  const handleDeleteTestimonial = async (testimonialId: string) => {
    await deleteTestimonial(person, testimonialId)
    await refreshTestimonials()
  }

  return (
    <section id="memorias-por-pessoa" className="bg-sage-50 py-20 dark:bg-sage-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-6 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">Memórias por Pessoa</h2>
          <Tabs value={person} onValueChange={(value) => setPerson(value as Person)}>
            <TabsList>
              {PEOPLE.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-sage-800 dark:text-sage-100">Galeria de {PEOPLE.find((p) => p.id === person)?.name}</h3>
            <Button onClick={handleAddPhotoClick}>
              {isFamily ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              Adicionar Foto
            </Button>
          </div>

          {images.length === 0 && (
            <div className="py-8 text-center">
              <ImageIcon className="mx-auto mb-2 h-12 w-12 text-sage-300" />
              <p className="text-sage-500">Nenhuma foto foi adicionada ainda</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id} className="group relative overflow-hidden border-0 shadow-lg">
                <div className="relative aspect-square">
                  <Image src={image.url} alt={image.title} fill className="object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <h3 className="font-semibold">{image.title}</h3>
                    <p className="text-xs text-gray-200">{formatRelativeDate(image.createdAt)}</p>
                  </div>
                </div>
                {isFamily && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDeletePhoto(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-6 text-2xl font-semibold text-sage-800 dark:text-sage-100">
            Mural de Depoimentos — {PEOPLE.find((p) => p.id === person)?.name}
          </h3>

          <Card className="mb-8 border-0 bg-white/80 shadow-lg dark:bg-sage-800/80">
            <CardContent className="space-y-3 p-6">
              <Input placeholder="Seu nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Textarea
                placeholder="Compartilhe uma memória especial..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button className="w-full" onClick={handleAddTestimonial}>
                <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {mural.map((testimonial) => (
              <Card key={testimonial.id} className="border-0 bg-white/80 shadow-md dark:bg-sage-800/80">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-sage-800 dark:text-sage-100">{testimonial.name}</h4>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleLike(testimonial.id)}>
                        <Heart className="mr-1 h-4 w-4" /> {testimonial.likes}
                      </Button>
                      {isFamily && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTestimonial(testimonial.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sage-600 dark:text-sage-300">{testimonial.message}</p>
                  <p className="mt-2 text-xs text-sage-400">{formatRelativeDate(testimonial.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Adicionar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <Input placeholder="Título da foto *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Selecionar Arquivo"}
            </Button>
            <Button className="w-full" disabled={!file || !title.trim() || pending} onClick={handlePublishPhoto}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publicar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <FamilyLoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={() => {
          setIsFamily(true)
          setShowUpload(true)
        }}
      />
    </section>
  )
}
