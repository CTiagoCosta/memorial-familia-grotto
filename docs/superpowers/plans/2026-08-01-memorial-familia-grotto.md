# Memorial Família Grotto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new Next.js memorial site honoring Israel Andreo (1951–2023) and Sonia Grotto (1956–2026), reusing the UI language of `memorial-israel-andreo` but replacing Firebase entirely with Supabase + a single family-password gate, per `docs/superpowers/specs/2026-08-01-memorial-familia-grotto-design.md`.

**Architecture:** Next.js 15 App Router (no static export) with React Server Components fetching data server-side through a service-role Supabase client; all mutations (photo upload/delete, testimonial add/like/delete, family login) go through Server Actions that check a signed httpOnly cookie for family authorization. No Supabase Auth, no anon key on the client — the DB and Storage bucket are locked down to server-only access.

**Tech Stack:** Next.js 15.2.4, React 19, TypeScript, Tailwind CSS 3 + shadcn/ui (Radix primitives), `@supabase/supabase-js`, `bcryptjs`, Node `crypto` (session signing), Vitest + Testing Library.

## Global Constraints

- No static export (`output: 'export'` must NOT appear in `next.config.mjs`) — the app needs Server Actions.
- No Supabase Auth, no `NEXT_PUBLIC_SUPABASE_ANON_KEY` — all Supabase access goes through the server-only service-role client (`lib/supabase/server.ts`).
- Family gate is a single shared password (bcrypt-hashed in `FAMILY_PASSWORD_HASH` env var), not per-user accounts.
- Any authenticated family member can delete any photo or testimonial (not just their own).
- Visual direction: "Sereno Natureza" — sage green (`#6b8a5a`/`#a9c398`) + warm off-white (`#f4f7f1`→`#e6ede2`), serif headings (`Lora`), sans body (`Inter`), light/dark mode both themed.
- Page is a single scroll, one URL: Hero → Depoimentos dos filhos → Música (Israel only) → Galeria da Família → Memórias por pessoa (seletor Israel/Sonia + galeria e mural filtrados) → Rodapé.
- Reuse real content from `C:\Develop\Projetos\memorial-israel-andreo` verbatim where it exists (hero copy, children's testimonials, song lyrics/asset); Sonia-specific content ships as clearly-marked placeholders for the family to edit later.

---

### Task 1: Project scaffold, dependencies, and test tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `components.json`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `lib/utils.ts`
- Create: `lib/utils.test.ts`
- Modify: none (new project)

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`, used by every UI primitive copied in Task 2.
- Produces: working `npm test` (Vitest) and `npm run build` (Next.js) commands that later tasks rely on.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "memorial-familia-grotto",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "1.1.2",
    "@supabase/supabase-js": "^2.45.4",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next": "15.2.4",
    "next-themes": "^0.4.4",
    "react": "^19",
    "react-dom": "^19",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.5",
    "tailwindcss": "^3.4.17",
    "typescript": "^5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`** (no static export — Server Actions need a Node runtime)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
}

export default nextConfig
```

- [ ] **Step 4: Write `postcss.config.mjs`**

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

- [ ] **Step 5: Write `tailwind.config.ts`** (base shadcn tokens; palette/fonts extended in Task 2, kept here so Task 1 already builds)

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

- [ ] **Step 6: Write `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 7: Write `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 8: Write the failing test `lib/utils.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("drops falsy values", () => {
    expect(cn("text-sm", false && "hidden", undefined, "font-bold")).toBe("text-sm font-bold")
  })
})
```

- [ ] **Step 9: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Step 10: Write `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 11: Write placeholder `app/globals.css`** (design tokens filled in Task 2)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 12: Write placeholder `app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Memorial Família Grotto",
  description: "Em memória de Israel Andreo e Sonia Grotto",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 13: Write placeholder `app/page.tsx`**

```tsx
export default function MemorialPage() {
  return <main className="p-8">Memorial Família Grotto — em construção.</main>
}
```

- [ ] **Step 14: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `package-lock.json`.

- [ ] **Step 15: Run the test to verify it passes**

Run: `npm test`
Expected: `lib/utils.test.ts` — 2 passed.

- [ ] **Step 16: Verify the app builds**

Run: `npm run build`
Expected: build succeeds (no `output: 'export'`, standard `.next` server build).

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Vitest tooling"
```

---

### Task 2: Design tokens, fonts, and global layout shell

**Files:**
- Modify: `app/globals.css` (replace `:root`/`.dark` tokens with Sereno Natureza palette)
- Modify: `tailwind.config.ts` (add `sage` color scale and font family tokens)
- Modify: `app/layout.tsx` (load `Lora` + `Inter` via `next/font/google`, wire fonts as CSS variables)
- Create: `components/theme-provider.tsx`
- Create: `tailwind.config.test.ts`

**Interfaces:**
- Consumes: `cn` from Task 1.
- Produces: Tailwind color tokens `sage-50`…`sage-900` and font classes `font-serif`/`font-sans` (via CSS vars `--font-heading`/`--font-body`) that every section component (Tasks 7–14) styles with.
- Produces: `ThemeProvider` component wrapping `next-themes`, consumed by `app/layout.tsx` and the `Navigation` component (Task 14) for the dark/light switch.

- [ ] **Step 1: Write the failing test `tailwind.config.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import config from "./tailwind.config"

describe("tailwind config", () => {
  it("defines the sage color scale used by the Sereno Natureza palette", () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, unknown>
    expect(colors.sage).toMatchObject({
      50: expect.any(String),
      500: expect.any(String),
      700: expect.any(String),
    })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- tailwind.config.test.ts`
Expected: FAIL — `colors.sage` is undefined.

- [ ] **Step 3: Add the sage scale and font tokens to `tailwind.config.ts`**

Add inside `theme.extend`:

```ts
      colors: {
        // ...existing shadcn tokens stay...
        sage: {
          50: "#f4f7f1",
          100: "#e6ede2",
          200: "#d3ddc9",
          300: "#a9c398",
          400: "#8bab77",
          500: "#6b8a5a",
          600: "#557146",
          700: "#425939",
          800: "#33452c",
          900: "#283823",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)"],
        sans: ["var(--font-body)"],
      },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tailwind.config.test.ts`
Expected: PASS.

- [ ] **Step 5: Replace `app/globals.css` tokens with the Sereno Natureza palette**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 90 20% 97%;
    --foreground: 100 15% 20%;
    --card: 0 0% 100%;
    --card-foreground: 100 15% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 100 15% 20%;
    --primary: 96 22% 42%;
    --primary-foreground: 90 30% 98%;
    --secondary: 90 20% 92%;
    --secondary-foreground: 100 15% 20%;
    --muted: 90 20% 92%;
    --muted-foreground: 100 10% 40%;
    --accent: 96 22% 88%;
    --accent-foreground: 100 15% 20%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 90 30% 98%;
    --border: 90 15% 85%;
    --input: 90 15% 85%;
    --ring: 96 22% 42%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 100 15% 10%;
    --foreground: 90 20% 94%;
    --card: 100 14% 13%;
    --card-foreground: 90 20% 94%;
    --popover: 100 14% 13%;
    --popover-foreground: 90 20% 94%;
    --primary: 96 25% 62%;
    --primary-foreground: 100 15% 10%;
    --secondary: 100 12% 18%;
    --secondary-foreground: 90 20% 94%;
    --muted: 100 12% 18%;
    --muted-foreground: 90 10% 65%;
    --accent: 100 12% 20%;
    --accent-foreground: 90 20% 94%;
    --destructive: 0 62% 45%;
    --destructive-foreground: 90 20% 94%;
    --border: 100 12% 22%;
    --input: 100 12% 22%;
    --ring: 96 25% 62%;
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans; }
  h1, h2, h3, h4 { @apply font-serif; }
}

html { scroll-behavior: smooth; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
```

- [ ] **Step 6: Create `components/theme-provider.tsx`**

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

- [ ] **Step 7: Wire fonts and `ThemeProvider` into `app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Lora, Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const heading = Lora({ subsets: ["latin"], variable: "--font-heading" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Memorial Família Grotto",
  description: "Em memória de Israel Andreo e Sonia Grotto",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${heading.variable} ${body.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts tailwind.config.test.ts components/theme-provider.tsx
git commit -m "feat: apply Sereno Natureza palette, fonts, and theme provider"
```

---

### Task 3: shadcn/ui primitives

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/dialog.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/alert.tsx`, `components/ui/avatar.tsx`, `components/ui/badge.tsx`, `components/ui/switch.tsx`, `components/ui/tabs.tsx`, `components/ui/label.tsx`, `components/ui/pagination.tsx`

**Interfaces:**
- Consumes: `cn` from `lib/utils.ts` (Task 1).
- Produces: `Button`/`buttonVariants`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`, `Dialog`/`DialogTrigger`/`DialogPortal`/`DialogOverlay`/`DialogContent`/`DialogHeader`/`DialogFooter`/`DialogTitle`/`DialogDescription`, `Input`, `Textarea`, `Alert`/`AlertTitle`/`AlertDescription`, `Avatar`/`AvatarImage`/`AvatarFallback`, `Badge`/`badgeVariants`, `Switch`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Label`, `Pagination` — consumed by every section component in Tasks 7–14.

- [ ] **Step 1: Copy the primitives verbatim from the reference project**

These are stable, dependency-only shadcn/ui files with no project-specific content — copy them byte-for-byte rather than retyping:

```bash
SRC="C:/Develop/Projetos/memorial-israel-andreo/components/ui"
DST="C:/Develop/Projetos/memorial-familia-grotto/components/ui"
mkdir -p "$DST"
for f in button card dialog input textarea alert avatar badge switch tabs label pagination; do
  cp "$SRC/$f.tsx" "$DST/$f.tsx"
done
```

- [ ] **Step 2: Verify no copied file imports a component outside this list**

Run: `grep -n "@/components/ui/" components/ui/*.tsx`
Expected: every match's target file (e.g. `@/components/ui/button` inside `pagination.tsx`, if any) is one of the 12 files just copied. If a match points to a file not in the list (e.g. `chart.tsx`, `sidebar.tsx`), copy that file too and re-run this check.

- [ ] **Step 3: Verify the app builds with the primitives in place**

Run: `npm run build`
Expected: build succeeds — these files aren't imported anywhere yet, so this just checks they compile standalone under `tsc`/Next's type check.

- [ ] **Step 4: Commit**

```bash
git add components/ui
git commit -m "feat: add shadcn/ui primitives (button, card, dialog, form controls)"
```

---

### Task 4: Supabase schema and server-only client

**Files:**
- Create: `supabase/schema.sql`
- Create: `types/database.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/server.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `Testimonial`, `GalleryImage`, `Person` (`"israel" | "sonia"`), `GalleryScope` (`"family" | "israel" | "sonia"`) types from `types/database.ts` — consumed by Tasks 8–13.
- Produces: `getServiceRoleClient(): SupabaseClient` from `lib/supabase/server.ts` — consumed by every Server Action in Tasks 6, 9, 10.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
create extension if not exists "pgcrypto";

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('israel', 'sonia')),
  name text not null,
  message text not null,
  likes int not null default 0,
  liked_by text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('family', 'israel', 'sonia')),
  title text not null,
  description text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index testimonials_person_idx on testimonials (person, created_at desc);
create index gallery_images_scope_idx on gallery_images (scope, created_at desc);

-- RLS stays enabled with NO policies: only the service-role key (server-only,
-- used exclusively inside Server Actions) can read or write these tables.
alter table testimonials enable row level security;
alter table gallery_images enable row level security;

-- Run manually in the Supabase dashboard: Storage > New bucket > "memorial-photos",
-- public = true (read-only public URLs; writes still require the service-role key).
```

- [ ] **Step 2: Write `types/database.ts`**

```ts
export type Person = "israel" | "sonia"
export type GalleryScope = "family" | Person

export interface Testimonial {
  id: string
  person: Person
  name: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface GalleryImage {
  id: string
  scope: GalleryScope
  title: string
  description: string | null
  storagePath: string
  url: string
  createdAt: string
}
```

- [ ] **Step 3: Write the failing test `lib/supabase/server.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from "vitest"

describe("getServiceRoleClient", () => {
  const ORIGINAL_ENV = process.env

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.resetModules()
  })

  it("throws a clear error when SUPABASE_URL is missing", async () => {
    process.env = { ...ORIGINAL_ENV, SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "key" }
    const { getServiceRoleClient } = await import("./server")
    expect(() => getServiceRoleClient()).toThrow("SUPABASE_URL")
  })

  it("throws a clear error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env = { ...ORIGINAL_ENV, SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "" }
    const { getServiceRoleClient } = await import("./server")
    expect(() => getServiceRoleClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY")
  })

  it("returns a client when both env vars are set", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "key",
    }
    const { getServiceRoleClient } = await import("./server")
    expect(getServiceRoleClient()).toBeDefined()
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npm test -- lib/supabase/server.test.ts`
Expected: FAIL — `./server` module does not exist yet.

- [ ] **Step 5: Write `lib/supabase/server.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedClient: SupabaseClient | null = null

export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  if (!url) {
    throw new Error("Missing environment variable: SUPABASE_URL")
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY")
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return cachedClient
}

export const GALLERY_BUCKET = "memorial-photos"
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- lib/supabase/server.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 7: Write `.env.example`**

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FAMILY_PASSWORD_HASH=
SESSION_SECRET=
```

- [ ] **Step 8: Commit**

```bash
git add supabase/schema.sql types/database.ts lib/supabase/server.ts lib/supabase/server.test.ts .env.example
git commit -m "feat: add Supabase schema and server-only client"
```

---

### Task 5: Family password hashing and session signing

**Files:**
- Create: `lib/auth/password.ts`
- Create: `lib/auth/password.test.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/session.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>` — used by `scripts/hash-family-password.mjs` (Task 15) and `actions/family-auth.ts` (Task 6).
- Produces: `SESSION_COOKIE_NAME: string`, `signSession(): string`, `verifySession(token: string | undefined): boolean` — used by `actions/family-auth.ts` (Task 6) and every mutating Server Action (Tasks 9, 10).

- [ ] **Step 1: Write the failing test `lib/auth/password.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password"

describe("password hashing", () => {
  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("familia-grotto-2026")
    await expect(verifyPassword("familia-grotto-2026", hash)).resolves.toBe(true)
  })

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("familia-grotto-2026")
    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/auth/password.test.ts`
Expected: FAIL — `./password` module does not exist.

- [ ] **Step 3: Write `lib/auth/password.ts`**

```ts
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lib/auth/password.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test `lib/auth/session.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest"
import { SESSION_COOKIE_NAME, signSession, verifySession } from "./session"

describe("session signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret"
  })

  it("exposes a stable cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("grotto_family_session")
  })

  it("verifies a token produced by signSession", () => {
    const token = signSession()
    expect(verifySession(token)).toBe(true)
  })

  it("rejects an undefined token", () => {
    expect(verifySession(undefined)).toBe(false)
  })

  it("rejects a tampered token", () => {
    const token = signSession()
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")
    expect(verifySession(tampered)).toBe(false)
  })

  it("rejects a token signed with a different secret", () => {
    const token = signSession()
    process.env.SESSION_SECRET = "different-secret"
    expect(verifySession(token)).toBe(false)
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- lib/auth/session.test.ts`
Expected: FAIL — `./session` module does not exist.

- [ ] **Step 7: Write `lib/auth/session.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "grotto_family_session"

const PAYLOAD = "family-authorized"

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("Missing environment variable: SESSION_SECRET")
  }
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

export function signSession(): string {
  const signature = sign(PAYLOAD, getSecret())
  return `${PAYLOAD}.${signature}`
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false

  const separatorIndex = token.lastIndexOf(".")
  if (separatorIndex === -1) return false

  const payload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  if (payload !== PAYLOAD) return false

  let expectedSignature: string
  try {
    expectedSignature = sign(payload, getSecret())
  } catch {
    return false
  }

  const expected = Buffer.from(expectedSignature)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- lib/auth/session.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 9: Commit**

```bash
git add lib/auth
git commit -m "feat: add family password hashing and signed session helpers"
```

---

### Task 6: Family auth Server Actions and login dialog

**Files:**
- Create: `actions/family-auth.ts`
- Create: `actions/family-auth.test.ts`
- Create: `lib/auth/get-family-session.ts`
- Create: `components/family-login-dialog.tsx`

**Interfaces:**
- Consumes: `hashPassword`/`verifyPassword` (Task 5), `SESSION_COOKIE_NAME`/`signSession`/`verifySession` (Task 5), `Dialog*`/`Input`/`Button`/`Alert*` (Task 3).
- Produces: `loginFamily(_prevState: { error: string | null }, formData: FormData): Promise<{ error: string | null }>` and `logoutFamily(): Promise<void>` Server Actions — consumed by `FamilyLoginDialog` here and by the navigation bar (Task 14).
- Produces: `getFamilySession(): boolean` from `lib/auth/get-family-session.ts` (reads the cookie via `next/headers`, server-only, callable directly from Server Components) — consumed by Tasks 9, 10, 12, 13, 14.
- Produces: `<FamilyLoginDialog open, onOpenChange>` component — consumed by Task 14 (`Navigation`) and Tasks 12/13 (gallery/testimonial "add" flows that require login first).

- [ ] **Step 1: Write the failing test `actions/family-auth.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: () => cookieStore,
}))

vi.mock("../lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}))

import { verifyPassword } from "../lib/auth/password"
import { loginFamily, logoutFamily } from "./family-auth"
import { SESSION_COOKIE_NAME } from "../lib/auth/session"

describe("loginFamily", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = "test-secret"
    process.env.FAMILY_PASSWORD_HASH = "stored-hash"
  })

  it("sets the session cookie when the password matches the stored hash", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("password", "correct-password")

    const result = await loginFamily({ error: null }, formData)

    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "stored-hash")
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: SESSION_COOKIE_NAME, httpOnly: true }),
    )
    expect(result.error).toBeNull()
  })

  it("returns an error and does not set a cookie when the password is wrong", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("password", "wrong-password")

    const result = await loginFamily({ error: null }, formData)

    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(result.error).toBe("Senha incorreta.")
  })
})

describe("logoutFamily", () => {
  it("deletes the session cookie", async () => {
    await logoutFamily()
    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- actions/family-auth.test.ts`
Expected: FAIL — `./family-auth` module does not exist.

- [ ] **Step 3: Write `actions/family-auth.ts`**

```ts
"use server"

import { cookies } from "next/headers"
import { verifyPassword } from "@/lib/auth/password"
import { SESSION_COOKIE_NAME, signSession } from "@/lib/auth/session"

export interface LoginState {
  error: string | null
}

export async function loginFamily(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "")
  const storedHash = process.env.FAMILY_PASSWORD_HASH ?? ""

  const isValid = storedHash.length > 0 && (await verifyPassword(password, storedHash))
  if (!isValid) {
    return { error: "Senha incorreta." }
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: signSession(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return { error: null }
}

export async function logoutFamily(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- actions/family-auth.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write `lib/auth/get-family-session.ts`** (plain server-only helper, callable directly from Server Components — no `"use server"` needed since it doesn't cross the client/server boundary)

```ts
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, verifySession } from "./session"

export async function getFamilySession(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
```

- [ ] **Step 6: Write `components/family-login-dialog.tsx`**

```tsx
"use client"

import { useActionState } from "react"
import { Lock, Shield, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginFamily, type LoginState } from "@/actions/family-auth"

interface FamilyLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const initialState: LoginState = { error: null }

export function FamilyLoginDialog({ open, onOpenChange, onSuccess }: FamilyLoginDialogProps) {
  const [state, formAction, pending] = useActionState(async (prev: LoginState, formData: FormData) => {
    const result = await loginFamily(prev, formData)
    if (!result.error) {
      onSuccess()
      onOpenChange(false)
    }
    return result
  }, initialState)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>Acesso da Família</span>
          </DialogTitle>
        </DialogHeader>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Digite a senha combinada em família para publicar fotos ou remover conteúdo.
          </AlertDescription>
        </Alert>
        <form action={formAction} className="space-y-3">
          {state.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{state.error}</AlertDescription>
            </Alert>
          )}
          <Input type="password" name="password" placeholder="Senha da família" autoFocus required />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 7: Verify the app builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add actions/family-auth.ts actions/family-auth.test.ts lib/auth/get-family-session.ts components/family-login-dialog.tsx
git commit -m "feat: add family login server action, session check, and login dialog"
```

---

### Task 7: Date formatting helper and content files

**Files:**
- Create: `lib/format.ts`
- Create: `lib/format.test.ts`
- Create: `content/israel.ts`
- Create: `content/sonia.ts`
- Create: `content/children-testimonials.ts`
- Create: `public/assets/img/` (copy image assets), `public/rael2.mp4` (copy audio/video asset)

**Interfaces:**
- Produces: `formatRelativeDate(dateString: string): string` — consumed by Tasks 12, 13.
- Produces: `israelContent: PersonContent`, `soniaContent: PersonContent` (from `content/israel.ts`/`content/sonia.ts`) and `childrenTestimonials: ChildTestimonial[]` (from `content/children-testimonials.ts`) — consumed by Tasks 8, 9, 11, 13.

- [ ] **Step 1: Write the failing test `lib/format.test.ts`**

```ts
import { describe, expect, it, vi, afterEach } from "vitest"
import { formatRelativeDate } from "./format"

describe("formatRelativeDate", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns '1 dia atrás' for yesterday", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-02T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("1 dia atrás")
  })

  it("returns '3 dias atrás' for 3 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-04T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("3 dias atrás")
  })

  it("returns weeks for 10 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-11T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe("2 semanas atrás")
  })

  it("falls back to a localized date past 30 days", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"))
    expect(formatRelativeDate("2026-08-01T12:00:00Z")).toBe(
      new Date("2026-08-01T12:00:00Z").toLocaleDateString("pt-BR"),
    )
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/format.test.ts`
Expected: FAIL — `./format` module does not exist.

- [ ] **Step 3: Write `lib/format.ts`**

```ts
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "1 dia atrás"
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semanas atrás`
  return date.toLocaleDateString("pt-BR")
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lib/format.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Copy image and media assets from the reference project**

```bash
SRC="C:/Develop/Projetos/memorial-israel-andreo/public"
DST="C:/Develop/Projetos/memorial-familia-grotto/public"
mkdir -p "$DST/assets/img"
cp "$SRC/assets/img/imagem15.jpeg" "$DST/assets/img/israel-hero.jpeg"
cp "$SRC/assets/img/sonia.jpg" "$DST/assets/img/sonia-hero.jpg"
cp "$SRC/assets/img/sitio.jpg" "$DST/assets/img/sitio.jpg"
cp "$SRC/assets/img/silvana.jpg" "$DST/assets/img/silvana.jpg"
cp "$SRC/assets/img/silvio.jpg" "$DST/assets/img/silvio.jpg"
cp "$SRC/assets/img/sandro.jpg" "$DST/assets/img/sandro.jpg"
cp "$SRC/assets/img/samira.jpg" "$DST/assets/img/samira.jpg"
cp "$SRC/rael2.mp4" "$DST/rael2.mp4"
```

- [ ] **Step 6: Write `content/israel.ts`** (real content reused from the reference project)

```ts
export interface MusicLyricLine {
  text: string
  isChorus: boolean
}

export interface PersonContent {
  name: string
  years: string
  heroPhoto: string
  tagline: string
}

export const israelContent: PersonContent = {
  name: "Israel Andreo",
  years: "1951 – 2023",
  heroPhoto: "/assets/img/israel-hero.jpeg",
  tagline: "Uma vida dedicada ao amor, à música e à família.",
}

export const israelMusic = {
  title: "Vida Melhor",
  videoSrc: "/rael2.mp4",
  lyrics: [
    {
      text: "Eu fiz de tudo pra tratar vida melhor,\nEu trabalhei eu derramei o meu suor,\nNão tive estudo foi por isso que sofri,\nPouca visão, sem profissão, mas consegui.",
      isChorus: false,
    },
    {
      text: "Corri, parei, sorri, mas também chorei,\nEu construí, eu desmanchei,\nFui insistente e não desanimei",
      isChorus: true,
    },
    {
      text: "Homem valente é aquele que trabalha,\nLuta com fé e não perde a batalha.\nNa minha vida muita luta enfrentei",
      isChorus: false,
    },
    {
      text: "Corri, parei, sorri, mas também chorei,\nEu construí, eu desmanchei,\nFui insistente e não desanimei",
      isChorus: true,
    },
  ] satisfies MusicLyricLine[],
}
```

- [ ] **Step 7: Write `content/sonia.ts`** (placeholder tagline clearly marked for family review — no fabricated biography)

```ts
import type { PersonContent } from "./israel"

export const soniaContent: PersonContent = {
  name: "Sonia Grotto",
  years: "1956 – 2026",
  heroPhoto: "/assets/img/sonia-hero.jpg",
  // placeholder — família deve revisar e personalizar este texto
  tagline: "Uma vida de amor, dedicação e carinho pela família.",
}
```

- [ ] **Step 8: Write `content/children-testimonials.ts`** (real testimonials reused from the reference project's about-section, minus Sonia's own entry — she is now honored, not authoring a tribute)

```ts
export interface ChildTestimonial {
  photo: string
  name: string
  description: string
  fullText: string
}

export const childrenTestimonials: ChildTestimonial[] = [
  {
    photo: "/assets/img/silvana.jpg",
    name: "Silvana Grotto",
    description: "Ter você em minha vida sempre foi exemplo de superação...",
    fullText:
      "Ter você em minha vida sempre foi exemplo de superação, honestidade, paciência, dedicação e amor. Como foi bom ter você como pai, sei que aproveitei cada minuto possível com você, fizemos planos e os desfazemos, foram dias incríveis ao seu lado, tudo era possível, otimismo era seu lema, não tinha tempo ruim, mesmo nas horas mais complicadas, mas ainda assim gostaria de mais, mais abraços seus, mais conversas, mais beijos ou apenas ficar pertinho no sofá enquanto você descansava, minha vida tem um marco, com você e sem você, o antes e o depois, tudo tem um novo olhar, um novo significado e nada mais será completo, a cada dia que passa a saudade aumenta, como dói saber que você não está aqui entre nós, mas honrarei sua memória com a prática de seus ensinamentos e seu legado estará vivo para sempre. Com amor sua filha Silvana.",
  },
  {
    photo: "/assets/img/silvio.jpg",
    name: "Silvio Grotto",
    description: "Obrigado por plantar raízes, e pegar minha mão para me...",
    fullText:
      "Obrigado por plantar raízes, e pegar minha mão para me ensinar coragem e determinação. Obrigado por dar a vida, dar amor, orientação e mostrar o caminho. Mais que um depoimento, você com certeza merece todo o meu coração e minha gratidão. Seu amor é minha força e sua sabedoria é minha bússola. Na sua simplicidade e honestidade nos passou valores para ser cada vez melhor. Deixa saudades, mas sentimos a sua presença em cada canto e em cada dia que passa. Te amaremos sempre.",
  },
  {
    photo: "/assets/img/sandro.jpg",
    name: "Sandro Grotto",
    description: "Pai. O que dizer desse homem, maravilhoso que me deu a...",
    fullText:
      "O que dizer desse homem, maravilhoso que me deu a vida! Tenho tanta coisa pra dizer, mas só quero agradecer, por ter sido seu filho, foi com você que conheci o que é ser um homem honesto e honrado, sou grato por todo tempo que vivi com o senhor papai, sua falta e um vazio enorme no meu coração, te amarei eternamente, obrigada por tudo que aprendi com o senhor.",
  },
  {
    photo: "/assets/img/samira.jpg",
    name: "Samira Grotto",
    description: "Saudade de ouvir sua risada, sentir sua alegria, você...",
    fullText:
      "Saudade de ouvir sua risada, sentir sua alegria, você faz muita falta. O que me traz conforto é saber que seu tempo aqui na terra deixou um legado inestimável de aprendizado. Com voce aprendi a ser uma pessoas honesta e persistente. Aprendi o valor do trabalho duro e o mais importante, a ter fé. Quem o conheceu sabe o quanto sofreu na infância e o quanto trabalhou pra criar seus filho, e nos últimos dias de sua vida você me deixou mais uma lição, a gratidão. Quando pedi pra que fizesse um desejo o senhor só agradeceu por tudo que fizemos. Obrigado por ter feito minha vida mais alegre e segura. Sempre levarei os momentos preciosos que passamos juntos. Seu legado de bondade e força permanece em mim. Te amo pra sempre.",
  },
]
```

- [ ] **Step 9: Commit**

```bash
git add lib/format.ts lib/format.test.ts content public
git commit -m "feat: add date formatting helper and reused content/media assets"
```

---

### Task 8: Hero section

**Files:**
- Create: `components/hero-section.tsx`
- Create: `components/hero-section.test.tsx`

**Interfaces:**
- Consumes: `israelContent`, `soniaContent` (Task 7), `Button` (Task 3).
- Produces: `<HeroSection />` — consumed by `app/page.tsx` (Task 14).

- [ ] **Step 1: Write the failing test `components/hero-section.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HeroSection } from "./hero-section"

describe("HeroSection", () => {
  it("shows both names and their years side by side", () => {
    render(<HeroSection />)
    expect(screen.getByText("Israel Andreo")).toBeInTheDocument()
    expect(screen.getByText("1951 – 2023")).toBeInTheDocument()
    expect(screen.getByText("Sonia Grotto")).toBeInTheDocument()
    expect(screen.getByText("1956 – 2026")).toBeInTheDocument()
  })

  it("links to the family gallery section", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: /galeria da família/i })).toHaveAttribute(
      "href",
      "#galeria-familia",
    )
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/hero-section.test.tsx`
Expected: FAIL — `./hero-section` module does not exist.

- [ ] **Step 3: Write `components/hero-section.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/hero-section.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add components/hero-section.tsx components/hero-section.test.tsx
git commit -m "feat: add hero section with both honorees side by side"
```

---

### Task 9: Depoimentos dos filhos and Música sections

**Files:**
- Create: `components/children-testimonials-section.tsx`
- Create: `components/children-testimonials-section.test.tsx`
- Create: `components/music-section.tsx`
- Create: `components/music-section.test.tsx`

**Interfaces:**
- Consumes: `childrenTestimonials` (Task 7), `israelMusic` (Task 7), `Card*`/`Dialog*`/`Button`/`Slider`-free custom audio controls (Task 3 primitives).
- Produces: `<ChildrenTestimonialsSection />`, `<MusicSection />` — consumed by `app/page.tsx` (Task 14).

- [ ] **Step 1: Write the failing test `components/children-testimonials-section.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChildrenTestimonialsSection } from "./children-testimonials-section"

describe("ChildrenTestimonialsSection", () => {
  it("renders a card for every child testimonial", () => {
    render(<ChildrenTestimonialsSection />)
    expect(screen.getByText("Silvana Grotto")).toBeInTheDocument()
    expect(screen.getByText("Silvio Grotto")).toBeInTheDocument()
    expect(screen.getByText("Sandro Grotto")).toBeInTheDocument()
    expect(screen.getByText("Samira Grotto")).toBeInTheDocument()
  })

  it("opens the full testimonial in a dialog when a card is clicked", async () => {
    const user = userEvent.setup()
    render(<ChildrenTestimonialsSection />)

    await user.click(screen.getByText("Silvana Grotto"))

    expect(await screen.findByText(/honrarei sua memória/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/children-testimonials-section.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write `components/children-testimonials-section.tsx`**

```tsx
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
              className="cursor-pointer border-0 bg-white/80 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-sage-800/80"
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/children-testimonials-section.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Write the failing test `components/music-section.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MusicSection } from "./music-section"

describe("MusicSection", () => {
  it("shows the song title and attributes it to Israel", () => {
    render(<MusicSection />)
    expect(screen.getByText("Vida Melhor")).toBeInTheDocument()
    expect(screen.getByText(/israel andreo/i)).toBeInTheDocument()
  })

  it("renders the first lyric line", () => {
    render(<MusicSection />)
    expect(screen.getByText(/eu fiz de tudo pra tratar vida melhor/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- components/music-section.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Write `components/music-section.tsx`**

```tsx
"use client"

import { useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { israelMusic } from "@/content/israel"

export function MusicSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <section id="musica" className="bg-sage-100/60 py-20 dark:bg-sage-900/60">
      <video ref={videoRef} src={israelMusic.videoSrc} style={{ display: "none" }} preload="auto" onEnded={() => setIsPlaying(false)} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">
            Música: {israelMusic.title}
          </h2>
          <Badge variant="secondary">De: Israel Andreo</Badge>
        </div>

        <Card className="border-0 bg-white/80 shadow-2xl dark:bg-sage-800/80">
          <CardContent className="p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Tocar"}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-500 text-white shadow-lg transition-colors hover:bg-sage-600"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
              </button>
            </div>
            <div className="space-y-6 text-center text-sage-700 dark:text-sage-200">
              {israelMusic.lyrics.map((lyric, index) => (
                <p key={index} className={lyric.isChorus ? "font-medium text-sage-600 dark:text-sage-300" : ""}>
                  {lyric.text.split("\n").map((line, lineIndex) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < lyric.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- components/music-section.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 9: Commit**

```bash
git add components/children-testimonials-section.tsx components/children-testimonials-section.test.tsx components/music-section.tsx components/music-section.test.tsx
git commit -m "feat: add children's testimonials section and Israel's music section"
```

---

### Task 10: Testimonials Server Actions

**Files:**
- Create: `actions/testimonials.ts`
- Create: `actions/testimonials.test.ts`

**Interfaces:**
- Consumes: `Testimonial`, `Person` (Task 4), `getServiceRoleClient` (Task 4), `getFamilySession` (Task 6).
- Produces: `listTestimonials(person: Person): Promise<Testimonial[]>`, `addTestimonial(person: Person, name: string, message: string): Promise<{ error: string | null }>`, `likeTestimonial(person: Person, testimonialId: string, sessionId: string): Promise<{ error: string | null }>`, `deleteTestimonial(person: Person, testimonialId: string): Promise<{ error: string | null }>` — consumed by Task 13.

- [ ] **Step 1: Write the failing test `actions/testimonials.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const supabaseMock = {
  from: vi.fn(),
}

vi.mock("../lib/supabase/server", () => ({
  getServiceRoleClient: () => supabaseMock,
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "./testimonials"

function mockSelectChain(rows: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  supabaseMock.from.mockReturnValue({ select })
  return { select, eq, order }
}

describe("listTestimonials", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows for the given person", async () => {
    mockSelectChain([
      {
        id: "1",
        person: "israel",
        name: "Alguém",
        message: "Saudade",
        likes: 2,
        liked_by: ["session-a"],
        created_at: "2026-01-01T00:00:00Z",
      },
    ])

    const result = await listTestimonials("israel")

    expect(supabaseMock.from).toHaveBeenCalledWith("testimonials")
    expect(result).toEqual([
      {
        id: "1",
        person: "israel",
        name: "Alguém",
        message: "Saudade",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: "2026-01-01T00:00:00Z",
      },
    ])
  })
})

describe("addTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an empty name or message without touching supabase", async () => {
    const result = await addTestimonial("israel", "  ", "mensagem")
    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("inserts a trimmed testimonial when valid", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    supabaseMock.from.mockReturnValue({ insert })

    const result = await addTestimonial("israel", "  Maria  ", "  Com carinho  ")

    expect(insert).toHaveBeenCalledWith({ person: "israel", name: "Maria", message: "Com carinho" })
    expect(result.error).toBeNull()
  })
})

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds the session and increments likes when not already liked", async () => {
    const single = vi.fn().mockResolvedValue({ data: { likes: 1, liked_by: [] }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    supabaseMock.from.mockReturnValue({ select, update })

    const result = await likeTestimonial("israel", "1", "session-a")

    expect(update).toHaveBeenCalledWith({ likes: 2, liked_by: ["session-a"] })
    expect(result.error).toBeNull()
  })

  it("removes the session and decrements likes when already liked", async () => {
    const single = vi.fn().mockResolvedValue({ data: { likes: 1, liked_by: ["session-a"] }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    supabaseMock.from.mockReturnValue({ select, update })

    const result = await likeTestimonial("israel", "1", "session-a")

    expect(update).toHaveBeenCalledWith({ likes: 0, liked_by: [] })
    expect(result.error).toBeNull()
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("israel", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    supabaseMock.from.mockReturnValue({ delete: del })

    const result = await deleteTestimonial("israel", "1")

    expect(del).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- actions/testimonials.test.ts`
Expected: FAIL — `./testimonials` module does not exist.

- [ ] **Step 3: Write `actions/testimonials.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- actions/testimonials.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add actions/testimonials.ts actions/testimonials.test.ts
git commit -m "feat: add testimonials server actions (list, add, like, delete)"
```

---

### Task 11: Gallery Server Actions

**Files:**
- Create: `actions/gallery.ts`
- Create: `actions/gallery.test.ts`

**Interfaces:**
- Consumes: `GalleryImage`, `GalleryScope` (Task 4), `getServiceRoleClient`, `GALLERY_BUCKET` (Task 4), `getFamilySession` (Task 6).
- Produces: `listGalleryImages(scope: GalleryScope): Promise<GalleryImage[]>`, `uploadGalleryImage(scope: GalleryScope, formData: FormData): Promise<{ error: string | null }>`, `deleteGalleryImage(scope: GalleryScope, imageId: string): Promise<{ error: string | null }>` — consumed by Tasks 12, 13.

- [ ] **Step 1: Write the failing test `actions/gallery.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const storageMock = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
}

const supabaseMock = {
  from: vi.fn(),
  storage: { from: vi.fn(() => storageMock) },
}

vi.mock("../lib/supabase/server", () => ({
  getServiceRoleClient: () => supabaseMock,
  GALLERY_BUCKET: "memorial-photos",
}))

vi.mock("../lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn(),
}))

import { getFamilySession } from "../lib/auth/get-family-session"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "./gallery"

describe("listGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows to public URLs for the given scope", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          scope: "family",
          title: "Piquenique",
          description: null,
          storage_path: "family/1-piquenique.jpg",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    supabaseMock.from.mockReturnValue({ select })
    storageMock.getPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/family/1-piquenique.jpg" } })

    const result = await listGalleryImages("family")

    expect(eq).toHaveBeenCalledWith("scope", "family")
    expect(result[0].url).toBe("https://cdn.test/family/1-piquenique.jpg")
  })
})

describe("uploadGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Não autorizado.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("rejects a non-image file even when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.txt", { type: "text/plain" }))

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Apenas arquivos de imagem são permitidos.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("rejects a file over 5MB", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", bigFile)

    const result = await uploadGalleryImage("family", formData)

    expect(result.error).toBe("Arquivo muito grande. Máximo 5MB.")
    expect(storageMock.upload).not.toHaveBeenCalled()
  })

  it("uploads and inserts metadata when valid and authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    storageMock.upload.mockResolvedValue({ error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    supabaseMock.from.mockReturnValue({ insert })

    const formData = new FormData()
    formData.set("title", "Piquenique")
    formData.set("description", "")
    formData.set("file", new File(["a"], "foto.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("family", formData)

    expect(storageMock.upload).toHaveBeenCalled()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "family", title: "Piquenique" }),
    )
    expect(result.error).toBeNull()
  })
})

describe("deleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteGalleryImage("family", "1")

    expect(result.error).toBe("Não autorizado.")
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it("removes the storage object and the row when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const single = vi.fn().mockResolvedValue({ data: { storage_path: "family/1-foto.jpg" }, error: null })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })
    const eqDelete = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq: eqDelete })
    supabaseMock.from.mockReturnValue({ select, delete: del })
    storageMock.remove.mockResolvedValue({ error: null })

    const result = await deleteGalleryImage("family", "1")

    expect(storageMock.remove).toHaveBeenCalledWith(["family/1-foto.jpg"])
    expect(del).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- actions/gallery.test.ts`
Expected: FAIL — `./gallery` module does not exist.

- [ ] **Step 3: Write `actions/gallery.ts`**

```ts
"use server"

import { GALLERY_BUCKET, getServiceRoleClient } from "@/lib/supabase/server"
import { getFamilySession } from "@/lib/auth/get-family-session"
import type { GalleryImage, GalleryScope } from "@/types/database"

interface ActionResult {
  error: string | null
}

interface GalleryImageRow {
  id: string
  scope: GalleryScope
  title: string
  description: string | null
  storage_path: string
  created_at: string
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function mapRow(row: GalleryImageRow, url: string): GalleryImage {
  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    description: row.description,
    storagePath: row.storage_path,
    url,
    createdAt: row.created_at,
  }
}

export async function listGalleryImages(scope: GalleryScope): Promise<GalleryImage[]> {
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("scope", scope)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as GalleryImageRow[]).map((row) => {
    const { data: publicUrlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(row.storage_path)
    return mapRow(row, publicUrlData.publicUrl)
  })
}

export async function uploadGalleryImage(scope: GalleryScope, formData: FormData): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const file = formData.get("file")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!(file instanceof File) || !title) {
    return { error: "Título e arquivo são obrigatórios." }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Apenas arquivos de imagem são permitidos." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo muito grande. Máximo 5MB." }
  }

  const supabase = getServiceRoleClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-")
  const storagePath = `${scope}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(storagePath, file)
  if (uploadError) {
    return { error: uploadError.message }
  }

  const { error: insertError } = await supabase.from("gallery_images").insert({
    scope,
    title,
    description: description || null,
    storage_path: storagePath,
  })

  return { error: insertError ? insertError.message : null }
}

export async function deleteGalleryImage(scope: GalleryScope, imageId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const supabase = getServiceRoleClient()
  const { data, error: fetchError } = await supabase
    .from("gallery_images")
    .select("storage_path")
    .eq("id", imageId)
    .single()

  if (fetchError || !data) {
    return { error: fetchError?.message ?? "Foto não encontrada." }
  }

  const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove([data.storage_path])
  if (removeError) {
    return { error: removeError.message }
  }

  const { error: deleteError } = await supabase.from("gallery_images").delete().eq("id", imageId)

  return { error: deleteError ? deleteError.message : null }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- actions/gallery.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add actions/gallery.ts actions/gallery.test.ts
git commit -m "feat: add gallery server actions (list, upload, delete)"
```

---

### Task 12: Family Gallery section (shared photos)

**Files:**
- Create: `components/family-gallery-section.tsx`
- Create: `components/family-gallery-section.test.tsx`

**Interfaces:**
- Consumes: `GalleryImage` (Task 4), `listGalleryImages`/`uploadGalleryImage`/`deleteGalleryImage` (Task 11), `getFamilySession` (Task 6), `FamilyLoginDialog` (Task 6), `Card`/`Dialog*`/`Button`/`Input`/`Textarea`/`Alert*` (Task 3), `formatRelativeDate` (Task 7).
- Produces: `<FamilyGallerySection initialImages, initialIsFamily />` (client component, receives server-fetched data as props) — consumed by `app/page.tsx` (Task 14), which fetches `listGalleryImages("family")` and `getFamilySession()` server-side and passes them down.

- [ ] **Step 1: Write the failing test `components/family-gallery-section.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FamilyGallerySection } from "./family-gallery-section"

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

const sampleImage = {
  id: "1",
  scope: "family" as const,
  title: "Piquenique em família",
  description: null,
  storagePath: "family/1.jpg",
  url: "https://cdn.test/family/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}

describe("FamilyGallerySection", () => {
  it("renders the initial images passed from the server", () => {
    render(<FamilyGallerySection initialImages={[sampleImage]} initialIsFamily={false} />)
    expect(screen.getByText("Piquenique em família")).toBeInTheDocument()
  })

  it("shows an empty state when there are no photos yet", () => {
    render(<FamilyGallerySection initialImages={[]} initialIsFamily={false} />)
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })

  it("prompts login instead of the upload form when not authenticated as family", async () => {
    const user = userEvent.setup()
    render(<FamilyGallerySection initialImages={[]} initialIsFamily={false} />)

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByText(/acesso da família/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/family-gallery-section.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write `components/family-gallery-section.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/family-gallery-section.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/family-gallery-section.tsx components/family-gallery-section.test.tsx
git commit -m "feat: add shared family gallery section"
```

---

### Task 13: Person Memories section (selector + per-person gallery and mural)

**Files:**
- Create: `components/person-memories-section.tsx`
- Create: `components/person-memories-section.test.tsx`

**Interfaces:**
- Consumes: `GalleryImage`, `Testimonial`, `Person` (Task 4), `listGalleryImages`/`uploadGalleryImage`/`deleteGalleryImage` (Task 11), `listTestimonials`/`addTestimonial`/`likeTestimonial`/`deleteTestimonial` (Task 10), `getFamilySession` (Task 6), `FamilyLoginDialog` (Task 6), `israelContent`/`soniaContent` (Task 7), `formatRelativeDate` (Task 7), `Tabs*`/`Card`/`Dialog*`/`Avatar*`/`Button`/`Input`/`Textarea` (Task 3).
- Produces: `<PersonMemoriesSection initialPerson, initialGalleries, initialTestimonials, initialIsFamily />` — consumed by `app/page.tsx` (Task 14), which pre-fetches both people's data server-side (`israel` and `sonia` galleries/testimonials) so switching tabs is instant with no loading state.

- [ ] **Step 1: Write the failing test `components/person-memories-section.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PersonMemoriesSection } from "./person-memories-section"

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))
vi.mock("@/actions/testimonials", () => ({
  listTestimonials: vi.fn(),
  addTestimonial: vi.fn(),
  likeTestimonial: vi.fn(),
  deleteTestimonial: vi.fn(),
}))

const israelImage = {
  id: "img-1",
  scope: "israel" as const,
  title: "No sítio",
  description: null,
  storagePath: "israel/1.jpg",
  url: "https://cdn.test/israel/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}
const soniaImage = {
  id: "img-2",
  scope: "sonia" as const,
  title: "Aniversário",
  description: null,
  storagePath: "sonia/1.jpg",
  url: "https://cdn.test/sonia/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}
const israelTestimonial = {
  id: "t-1",
  person: "israel" as const,
  name: "Amigo",
  message: "Vai fazer muita falta",
  likes: 0,
  likedBy: [],
  createdAt: "2026-01-01T00:00:00Z",
}

const props = {
  initialPerson: "israel" as const,
  initialGalleries: { israel: [israelImage], sonia: [soniaImage] },
  initialTestimonials: { israel: [israelTestimonial], sonia: [] },
  initialIsFamily: false,
}

describe("PersonMemoriesSection", () => {
  it("shows Israel's content by default", () => {
    render(<PersonMemoriesSection {...props} />)
    expect(screen.getByText("No sítio")).toBeInTheDocument()
    expect(screen.getByText("Vai fazer muita falta")).toBeInTheDocument()
    expect(screen.queryByText("Aniversário")).not.toBeInTheDocument()
  })

  it("switches to Sonia's content when her tab is selected", async () => {
    const user = userEvent.setup()
    render(<PersonMemoriesSection {...props} />)

    await user.click(screen.getByRole("tab", { name: /sonia/i }))

    expect(screen.getByText("Aniversário")).toBeInTheDocument()
    expect(screen.queryByText("No sítio")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/person-memories-section.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write `components/person-memories-section.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/person-memories-section.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add components/person-memories-section.tsx components/person-memories-section.test.tsx
git commit -m "feat: add per-person memories section with gallery and testimonial mural"
```

---

### Task 14: Navigation, Footer, and page assembly

**Files:**
- Create: `components/navigation.tsx`
- Create: `components/footer.tsx`
- Modify: `app/page.tsx` (replace placeholder with the full server-rendered assembly)
- Create: `app/page.test.tsx` — actually not applicable to a Server Component page; see Step-level manual verification instead
- Create: `components/navigation.test.tsx`

**Interfaces:**
- Consumes: `logoutFamily` (Task 6), `getFamilySession` (Task 6), `HeroSection` (Task 8), `ChildrenTestimonialsSection`/`MusicSection` (Task 9), `FamilyGallerySection` (Task 12), `PersonMemoriesSection` (Task 13), `listGalleryImages` (Task 11), `listTestimonials` (Task 10).
- Produces: fully wired `app/page.tsx` — the final deliverable users load in a browser.

- [ ] **Step 1: Write the failing test `components/navigation.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Navigation } from "./navigation"

describe("Navigation", () => {
  it("shows a 'Família' badge and a Sair button when authenticated", () => {
    render(<Navigation isFamily={true} />)
    expect(screen.getByText("Família")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument()
  })

  it("hides the Família badge when not authenticated", () => {
    render(<Navigation isFamily={false} />)
    expect(screen.queryByText("Família")).not.toBeInTheDocument()
  })

  it("links to every page section by anchor", () => {
    render(<Navigation isFamily={false} />)
    expect(screen.getByRole("link", { name: /início/i })).toHaveAttribute("href", "#home")
    expect(screen.getByRole("link", { name: /depoimentos/i })).toHaveAttribute("href", "#depoimentos-filhos")
    expect(screen.getByRole("link", { name: /música/i })).toHaveAttribute("href", "#musica")
    expect(screen.getByRole("link", { name: /galeria da família/i })).toHaveAttribute("href", "#galeria-familia")
    expect(screen.getByRole("link", { name: /memórias/i })).toHaveAttribute("href", "#memorias-por-pessoa")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/navigation.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write `components/navigation.tsx`**

```tsx
"use client"

import { useState } from "react"
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
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            <Moon className="h-4 w-4 text-sage-500" />
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/navigation.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write `components/footer.tsx`**

```tsx
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
```

- [ ] **Step 6: Replace `app/page.tsx`** (Server Component: fetches everything up front, no client-side loading spinners on first paint)

```tsx
import { HeroSection } from "@/components/hero-section"
import { ChildrenTestimonialsSection } from "@/components/children-testimonials-section"
import { MusicSection } from "@/components/music-section"
import { FamilyGallerySection } from "@/components/family-gallery-section"
import { PersonMemoriesSection } from "@/components/person-memories-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { listGalleryImages } from "@/actions/gallery"
import { listTestimonials } from "@/actions/testimonials"
import { getFamilySession } from "@/lib/auth/get-family-session"

export default async function MemorialPage() {
  const [isFamily, familyImages, israelImages, soniaImages, israelTestimonials, soniaTestimonials] =
    await Promise.all([
      getFamilySession(),
      listGalleryImages("family"),
      listGalleryImages("israel"),
      listGalleryImages("sonia"),
      listTestimonials("israel"),
      listTestimonials("sonia"),
    ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation isFamily={isFamily} />
      <HeroSection />
      <ChildrenTestimonialsSection />
      <MusicSection />
      <FamilyGallerySection initialImages={familyImages} initialIsFamily={isFamily} />
      <PersonMemoriesSection
        initialPerson="israel"
        initialGalleries={{ israel: israelImages, sonia: soniaImages }}
        initialTestimonials={{ israel: israelTestimonials, sonia: soniaTestimonials }}
        initialIsFamily={isFamily}
      />
      <Footer />
    </div>
  )
}
```

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests across every task pass.

- [ ] **Step 8: Verify the app builds**

Run: `npm run build`
Expected: build succeeds. (It will fail at this point if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` aren't set in the environment, because `app/page.tsx` calls the data-fetching functions at build/request time — this is expected until Task 15 wires up real Supabase credentials in `.env.local`; note it and continue.)

- [ ] **Step 9: Commit**

```bash
git add components/navigation.tsx components/navigation.test.tsx components/footer.tsx app/page.tsx
git commit -m "feat: wire navigation, footer, and full page assembly"
```

---

### Task 15: Supabase/Vercel setup docs and family password script

**Files:**
- Create: `scripts/hash-family-password.mjs`
- Create: `README.md`

**Interfaces:**
- Consumes: `hashPassword` (Task 5) — reused as a compiled-from-source CLI helper (plain Node script, no TS build step, so it re-implements the two-line bcrypt call directly rather than importing the TS module).
- Produces: none consumed by other tasks — this is the last task.

- [ ] **Step 1: Write `scripts/hash-family-password.mjs`**

```js
import bcrypt from "bcryptjs"

const password = process.argv[2]
if (!password) {
  console.error("Uso: node scripts/hash-family-password.mjs <senha>")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log("\nFAMILY_PASSWORD_HASH=" + hash + "\n")
console.log("Copie a linha acima para o .env.local e para as variáveis de ambiente da Vercel.")
```

- [ ] **Step 2: Run it manually to verify it produces a usable hash**

Run: `node scripts/hash-family-password.mjs "senha-de-teste"`
Expected: prints a `FAMILY_PASSWORD_HASH=$2a$12$...` line.

- [ ] **Step 3: Write `README.md`**

```markdown
# Memorial Família Grotto

Memorial digital em homenagem a Israel Andreo (1951–2023) e Sonia Grotto (1956–2026).

## Stack

Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui + Supabase (Postgres + Storage), hospedado na Vercel. Sem Firebase.

## Configuração local

1. `npm install`
2. Crie um projeto em https://supabase.com
3. No SQL Editor do Supabase, rode o conteúdo de `supabase/schema.sql`
4. Em Storage, crie um bucket público chamado `memorial-photos`
5. Copie `.env.example` para `.env.local` e preencha:
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (em Project Settings > API do Supabase — use a **service_role key**, não a anon key)
   - `SESSION_SECRET` — qualquer string longa e aleatória
   - `FAMILY_PASSWORD_HASH` — gere com `node scripts/hash-family-password.mjs "sua-senha-de-familia"`
6. `npm run dev` e acesse http://localhost:3000

## Deploy

1. Suba o repositório para o GitHub
2. Importe o projeto na Vercel
3. Configure as mesmas 4 variáveis de ambiente acima nas configurações do projeto na Vercel
4. Deploy

## Conteúdo

- `content/israel.ts`, `content/sonia.ts` — nomes, datas, foto de destaque e texto de homenagem de cada um
- `content/children-testimonials.ts` — depoimentos fixos dos filhos (seção compartilhada)
- Fotos e depoimentos livres são publicados pela própria família pelo site, usando a senha da família (veja o botão "Adicionar Foto" e o mural de depoimentos)
```

- [ ] **Step 4: Commit**

```bash
git add scripts/hash-family-password.mjs README.md
git commit -m "docs: add Supabase/Vercel setup guide and family password hash script"
```

---

## After implementation

Content still needed from the family before going live (tracked in the spec's "Fora de escopo" section):

- Real hero photos for Israel and Sonia (currently reusing `imagem15.jpeg`/`sonia.jpg` from the reference project)
- Final tagline for `content/sonia.ts` (currently a generic placeholder)
- A Supabase project, its bucket, and env vars (Task 15) before the site can run against real data
- A chosen family password, hashed via `scripts/hash-family-password.mjs`
