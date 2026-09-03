"use server"

import { getServiceRoleClient } from "@/lib/supabase/server"
import { getFamilySession } from "@/lib/auth/get-family-session"
import type { Person, Testimonial } from "@/types/database"

interface ActionResult {
  error: string | null
}

interface TestimonialRow {
  id: string
  person: Person
  name: string
  message: string
  likes: number
  liked_by: string[]
  created_at: string
}

function mapRow(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    person: row.person,
    name: row.name,
    message: row.message,
    likes: row.likes,
    likedBy: row.liked_by,
    createdAt: row.created_at,
  }
}

export async function listTestimonials(person: Person): Promise<Testimonial[]> {
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("person", person)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as TestimonialRow[]).map(mapRow)
}

export async function addTestimonial(person: Person, name: string, message: string): Promise<ActionResult> {
  const trimmedName = name.trim()
  const trimmedMessage = message.trim()

  if (!trimmedName || !trimmedMessage) {
    return { error: "Nome e mensagem são obrigatórios." }
  }

  const supabase = getServiceRoleClient()
  const { error } = await supabase.from("testimonials").insert({
    person,
    name: trimmedName,
    message: trimmedMessage,
  })

  return { error: error ? error.message : null }
}

export async function likeTestimonial(person: Person, testimonialId: string, sessionId: string): Promise<ActionResult> {
  const supabase = getServiceRoleClient()

  const { data, error: fetchError } = await supabase
    .from("testimonials")
    .select("likes, liked_by")
    .eq("id", testimonialId)
    .single()

  if (fetchError || !data) {
    return { error: fetchError?.message ?? "Depoimento não encontrado." }
  }

  const alreadyLiked = (data.liked_by as string[]).includes(sessionId)
  const likedBy = alreadyLiked
    ? (data.liked_by as string[]).filter((id) => id !== sessionId)
    : [...(data.liked_by as string[]), sessionId]
  const likes = alreadyLiked ? data.likes - 1 : data.likes + 1

  const { error } = await supabase.from("testimonials").update({ likes, liked_by: likedBy }).eq("id", testimonialId)

  return { error: error ? error.message : null }
}

export async function deleteTestimonial(person: Person, testimonialId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const supabase = getServiceRoleClient()
  const { error } = await supabase.from("testimonials").delete().eq("id", testimonialId)

  return { error: error ? error.message : null }
}
