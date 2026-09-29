"use server"

import { getSql } from "@/lib/db"
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
  const sql = getSql()
  const rows = (await sql`
    select * from testimonials where person = ${person} order by created_at desc
  `) as unknown as TestimonialRow[]

  return rows.map(mapRow)
}

export async function addTestimonial(person: Person, name: string, message: string): Promise<ActionResult> {
  const trimmedName = name.trim()
  const trimmedMessage = message.trim()

  if (!trimmedName || !trimmedMessage) {
    return { error: "Nome e mensagem são obrigatórios." }
  }

  const sql = getSql()
  await sql`insert into testimonials (person, name, message) values (${person}, ${trimmedName}, ${trimmedMessage})`

  return { error: null }
}

export async function likeTestimonial(person: Person, testimonialId: string, sessionId: string): Promise<ActionResult> {
  const sql = getSql()
  const rows = (await sql`
    update testimonials
    set
      liked_by = case
        when ${sessionId} = any(liked_by) then array_remove(liked_by, ${sessionId})
        else array_append(liked_by, ${sessionId})
      end,
      likes = case
        when ${sessionId} = any(liked_by) then likes - 1
        else likes + 1
      end
    where id = ${testimonialId}
    returning id
  `) as unknown as { id: string }[]

  if (rows.length === 0) {
    return { error: "Depoimento não encontrado." }
  }

  return { error: null }
}

export async function deleteTestimonial(person: Person, testimonialId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const sql = getSql()
  await sql`delete from testimonials where id = ${testimonialId}`

  return { error: null }
}
