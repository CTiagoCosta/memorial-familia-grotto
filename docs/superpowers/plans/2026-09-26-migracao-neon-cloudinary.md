# Migração Supabase -> Neon + Cloudinary

**Motivo:** o projeto gratuito do Supabase foi pausado por inatividade e o site em produção retorna 500 (a página inicial consulta o banco no servidor). Como o memorial ainda não foi lançado, não há dados a migrar.

**Decisão:** banco no Neon (Postgres, região AWS São Paulo `sa-east-1`) e fotos no Cloudinary. Funções da Vercel também em São Paulo (`gru1`).

## Pré-requisitos (feitos por Carlos antes de começar)

- [ ] Projeto Neon criado em **AWS South America (São Paulo)**. Copiar a connection string **pooled** para `DATABASE_URL` no `.env.local`.
- [ ] Conta Cloudinary criada. Colocar no `.env.local`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. (Não é preciso criar pasta; o upload cria `memorial-grotto/<scope>` sozinho.)
- [ ] Vercel: as mesmas variáveis em Settings > Environment Variables, e remover as `SUPABASE_*` depois que o deploy novo estiver no ar.
- [ ] Manter `SESSION_SECRET` e `FAMILY_PASSWORD_HASH` como estão.

## Arquitetura resultante

| Camada | Antes | Depois |
|---|---|---|
| Banco | `@supabase/supabase-js` (service role) | `@neondatabase/serverless` (`neon()` via HTTP, SQL com tagged template) |
| Fotos | bucket `memorial-photos`, upload dentro da Server Action | Cloudinary, **upload assinado direto do navegador** |
| Segurança | RLS sem políticas + service role | Só o servidor conhece `DATABASE_URL`; sem RLS (não há acesso do cliente ao banco) |
| Entrega de imagem | URL pública do bucket, `images.unoptimized` | URL Cloudinary com `f_auto,q_auto,w_<n>` |

### Por que upload direto do navegador

O upload atual passa o arquivo pela Server Action, que tem limite padrão de 1 MB no Next (`serverActions.bodySizeLimit`) e ~4,5 MB na Vercel, enquanto o código promete 5 MB. Fotos maiores que ~1 MB provavelmente já falhariam hoje (confirmar). Fluxo novo:

1. Cliente chama a action `getGalleryUploadSignature(scope)`. Exige sessão da família e devolve `{ cloudName, apiKey, timestamp, folder, signature }`.
2. Cliente envia o arquivo direto para `https://api.cloudinary.com/v1_1/<cloud>/image/upload` com a assinatura.
3. Cliente chama `registerGalleryImage(scope, publicId, title, description)`. A action exige sessão, confere que o `publicId` começa com `memorial-grotto/<scope>/` e que o asset existe (`cloudinary.api.resource`), e só então grava a linha no banco.

Exclusão: `deleteGalleryImage` apaga a linha e chama `cloudinary.uploader.destroy(publicId)`.

## Schema (novo `db/schema.sql`, substitui `supabase/schema.sql`)

Mesmas tabelas `testimonials` e `gallery_images`, com estas diferenças:

- `gallery_images.storage_path` vira `public_id` (identificador do Cloudinary).
- Remover `create extension pgcrypto` se `gen_random_uuid()` já vier nativo (Postgres 13+ tem; no Neon funciona) e remover os `alter table ... enable row level security`.
- Manter os índices `testimonials_person_idx` e `gallery_images_scope_idx`.

Rodar o arquivo no SQL Editor do Neon.

## Tarefas (em ordem, uma branch: `feature/neon-cloudinary`)

1. **Dependências.** Adicionar `@neondatabase/serverless` e `cloudinary`; remover `@supabase/supabase-js`.
2. **`lib/db.ts`** (substitui `lib/supabase/server.ts`): exporta `getSql()` que lê `DATABASE_URL`, lança erro claro se faltar e reaproveita a instância. Portar `lib/supabase/server.test.ts`.
3. **`lib/cloudinary.ts`:** config do SDK a partir das envs, constante `GALLERY_FOLDER = "memorial-grotto"`, função `imageUrl(publicId, width)` que monta `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_<width>/<publicId>`, e assinatura de upload.
4. **`types/database.ts`:** `GalleryImage.storagePath` -> `publicId` (o `url` continua sendo montado no servidor).
5. **`actions/testimonials.ts`:** reescrever com SQL. Trocar o `likeTestimonial` (hoje lê e depois escreve, com corrida entre dois cliques) por um único `UPDATE` atômico que usa `array_append`/`array_remove` conforme `sessionId` já esteja em `liked_by`. Atualizar `testimonials.test.ts` mockando o driver do Neon.
6. **`actions/gallery.ts`:** `listGalleryImages` em SQL; adicionar `getGalleryUploadSignature` e `registerGalleryImage`; reescrever `deleteGalleryImage`; remover `uploadGalleryImage`. Atualizar `gallery.test.ts`.
7. **Componentes:** ajustar o formulário de upload em `components/family-gallery-section.tsx` e `components/person-memories-section.tsx` para o fluxo de 3 passos (assinatura, envio direto, registro), mantendo a validação de tipo `image/*` e o limite de 5 MB no cliente. Revisar os testes `*.test.tsx` que citam Supabase.
8. **`next.config.mjs`:** trocar `images.unoptimized` por `remotePatterns` para `res.cloudinary.com` se for usar `next/image`; senão manter `<img>` com as transformações na URL.
9. **`vercel.json`:** `{ "regions": ["gru1"] }`.
10. **Docs:** `.env.example` (`DATABASE_URL`, `CLOUDINARY_*`), README (setup novo, remover passos do Supabase) e nota em `docs/superpowers/specs/...` de que o backend mudou.
11. **Remover** `lib/supabase/`, `supabase/schema.sql`.
12. **(Opcional, recomendado) Resiliência da página inicial:** em `app/page.tsx`, envolver as listas em `try/catch` e cair em listas vazias para o banco fora do ar não derrubar o site inteiro com 500.

## Verificação

- `npm test`, `npm run lint` e `npm run build` passando.
- Local com Neon e Cloudinary reais: enviar foto (>1 MB) como família, ver aparecer, excluir e conferir que sumiu do Cloudinary; adicionar depoimento; curtir e descurtir duas vezes seguidas; login da família continua funcionando.
- Deploy de preview na Vercel com as envs novas antes de mergear na `master`.
- Conferir nos logs da Vercel que as funções rodam em `gru1`.

## Riscos e observações

- Sem RLS, a segurança depende de `DATABASE_URL` nunca ir para o cliente. Manter todo acesso ao banco dentro de Server Actions/Server Components.
- O plano gratuito do Neon suspende a computação ociosa; a primeira requisição depois de um tempo parado leva alguns segundos a mais, sem perda de dados.
- Assinatura de upload deve incluir `folder` e `timestamp` para o cliente não conseguir enviar para outra pasta.
