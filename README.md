# Memorial Família Grotto

Memorial digital em homenagem a Israel Andreo (1951–2023) e Sonia Grotto (1956–2026).

## Stack

Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui + Neon (Postgres) + Cloudinary (fotos), hospedado na Vercel (funções na região `gru1`, São Paulo). Sem Firebase.

## Configuração local

1. `npm install`
2. Crie um projeto Neon em https://neon.tech, região **AWS South America (São Paulo)**
3. No SQL Editor do Neon, rode o conteúdo de `db/schema.sql`
4. Crie uma conta em https://cloudinary.com (não é preciso criar pasta; o upload cria `memorial-grotto/<scope>` sozinho)
5. Copie `.env.example` para `.env.local` e preencha:
   - `DATABASE_URL` — connection string **pooled** do Neon
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — em Cloudinary, Dashboard > Product Environment Credentials
   - `SESSION_SECRET` — qualquer string longa e aleatória
   - `FAMILY_PASSWORD_HASH` — gere com `node scripts/hash-family-password.mjs "sua-senha-de-familia"`. **Atenção:** cole no `.env.local` a versão com `\$` (escapada) que o script imprime — o Next.js expande `$` em arquivos `.env`, e um hash bcrypt sem escape (`$2a$12$...`) é truncado silenciosamente. Na Vercel use a versão sem escape.
6. `npm run dev` e acesse http://localhost:3000

## Deploy

1. Suba o repositório para o GitHub
2. Importe o projeto na Vercel
3. Configure as mesmas 6 variáveis de ambiente acima nas configurações do projeto na Vercel
4. Deploy

O plano gratuito do Neon suspende a computação ociosa; ao contrário do projeto gratuito do Supabase (que pausava depois de 7 dias e derrubava o site com erro 500), a primeira requisição depois de um tempo parado no Neon só leva alguns segundos a mais para "acordar" o banco — sem tirar o site do ar.

## Conteúdo

- `content/israel.ts`, `content/sonia.ts` — nomes, datas, foto de destaque e texto de homenagem de cada um
- `content/children-testimonials.ts` — depoimentos fixos dos filhos (seção compartilhada)
- Fotos e depoimentos livres são publicados pela própria família pelo site, usando a senha da família (veja o botão "Adicionar Foto" e o mural de depoimentos)
