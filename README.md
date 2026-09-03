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
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (em Project Settings > API Keys do Supabase, aba **"Legacy anon, service_role API keys"** — use a `service_role` key nesse formato JWT, começando com `eyJ...`. **Não** use a `sb_secret_...` da aba "Publishable and secret API keys": esse formato novo não é compatível com a versão do `@supabase/supabase-js` usada aqui e causa erro `JWT issued at future`.)
   - `SESSION_SECRET` — qualquer string longa e aleatória
   - `FAMILY_PASSWORD_HASH` — gere com `node scripts/hash-family-password.mjs "sua-senha-de-familia"`. **Atenção:** cole no `.env.local` a versão com `\$` (escapada) que o script imprime — o Next.js expande `$` em arquivos `.env`, e um hash bcrypt sem escape (`$2a$12$...`) é truncado silenciosamente. Na Vercel use a versão sem escape.
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
