"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, ImageIcon, Loader2, Lock, Plus, Send, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FamilyLoginDialog } from "@/components/family-login-dialog"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "@/actions/gallery"
import { formatRelativeDate } from "@/lib/format"
import type { GalleryImage } from "@/types/database"

interface FamilyGallerySectionProps {
  initialImages: GalleryImage[]
  initialIsFamily: boolean
}

export function FamilyGallerySection({ initialImages, initialIsFamily }: FamilyGallerySectionProps) {
  const [images, setImages] = useState(initialImages)
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const [showLogin, setShowLogin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    setImages(await listGalleryImages("family"))
  }

  const handleAddClick = () => {
    if (isFamily) {
      setShowUpload(true)
    } else {
      setShowLogin(true)
    }
  }

  const handlePublish = async () => {
    if (!file || !title.trim()) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("title", title.trim())
    formData.set("description", description.trim())
    formData.set("file", file)

    const result = await uploadGalleryImage("family", formData)
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
    await refresh()
  }

  const handleDelete = async (imageId: string) => {
    await deleteGalleryImage("family", imageId)
    await refresh()
  }

  return (
    <section id="galeria-familia" className="bg-white/60 py-20 dark:bg-sage-950/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">Galeria da Família</h2>
          <p className="mb-8 text-xl text-sage-600 dark:text-sage-300">
            Momentos dos dois juntos e de toda a família
          </p>
          <Button onClick={handleAddClick}>
            {isFamily ? <Plus className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            Adicionar Foto
          </Button>
        </div>

        {images.length === 0 && (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-16 w-16 text-sage-300" />
            <p className="text-lg text-sage-500">Nenhuma foto foi adicionada ainda</p>
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
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Adicionar Foto da Família
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
            <Button className="w-full" disabled={!file || !title.trim() || pending} onClick={handlePublish}>
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
