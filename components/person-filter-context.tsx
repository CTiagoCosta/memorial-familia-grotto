"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { Person } from "@/types/database"

interface PersonFilterContextValue {
  selectedPerson: Person | null
  togglePerson: (person: Person) => void
  clearPerson: () => void
}

const PersonFilterContext = createContext<PersonFilterContextValue | null>(null)

export function PersonFilterProvider({ children }: { children: ReactNode }) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const value = useMemo<PersonFilterContextValue>(
    () => ({
      selectedPerson,
      togglePerson: (person) => setSelectedPerson((prev) => (prev === person ? null : person)),
      clearPerson: () => setSelectedPerson(null),
    }),
    [selectedPerson],
  )

  return <PersonFilterContext.Provider value={value}>{children}</PersonFilterContext.Provider>
}

export function usePersonFilter(): PersonFilterContextValue {
  const context = useContext(PersonFilterContext)
  if (!context) {
    throw new Error("usePersonFilter must be used within a PersonFilterProvider")
  }
  return context
}
