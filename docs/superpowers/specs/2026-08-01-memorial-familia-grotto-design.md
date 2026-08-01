# Memorial Família Grotto — Design

## Contexto

Memorial digital em homenagem a **Israel Andreo** (1951–2023) e **Sonia Grotto**
(1956–2026), sogro e sogra do usuário. Novo projeto irmão de
`memorial-israel-andreo`, reaproveitando sua estrutura de página e sua
identidade de componentes (Next.js + Tailwind + shadcn/ui), mas com:

- Conteúdo para os dois, não só para o Israel.
- Backend trocado: o Firebase (Auth + Firestore + Storage) vem dando
  problemas de estabilidade/configuração e será substituído por completo
  pelo **Supabase** (Postgres + Storage), com um esquema de acesso mais
  simples para a família.
- Um refresh visual, direção **"Sereno Natureza"** (validada com mockups).

## Escopo

Um projeto novo, `memorial-familia-grotto`, criado do zero em
`C:\Develop\Projetos\memorial-familia-grotto`, usando `memorial-israel-andreo`
como referência de estrutura/componentes — não um fork ou uma migração
incremental.

Fora de escopo: o projeto `memorial-israel-andreo` original não é alterado.

## Arquitetura

- **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + shadcn/ui**
  — mesma base de UI do projeto de referência (componentes `ui/*`
  reaproveitados como estão).
- **Sem static export.** O projeto de referência roda com `next export` para
  hospedar em qualquer lugar; este projeto passa a rodar como app Next.js
  padrão (Server Actions / Route Handlers), necessário para manter a senha da
  família e as chaves do Supabase fora do cliente.
- **Deploy na Vercel.**
- **Supabase** substitui o Firebase inteiro:
  - **Postgres** — depoimentos do mural aberto e metadados das fotos.
  - **Storage** — arquivos de imagem (bucket público para leitura).
  - Não usa Supabase Auth — ver "Acesso da família" abaixo.

## Modelo de dados (Supabase)

```sql
-- Depoimentos do mural aberto (qualquer visitante pode postar)
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('israel', 'sonia')),
  name text not null,
  message text not null,
  likes int not null default 0,
  liked_by text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Metadados das fotos (arquivo em si fica no Storage)
create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('family', 'israel', 'sonia')),
  title text not null,
  description text,
  storage_path text not null,
  created_at timestamptz not null default now()
);
```

- Bucket de Storage `memorial-photos`, público para leitura, com prefixos
  `family/`, `israel/`, `sonia/` correspondentes ao `scope`.
- RLS: **sem escrita pública** em nenhuma tabela nem no bucket. Toda escrita
  (insert/delete de foto e depoimento, exceto a criação de depoimento — ver
  abaixo) passa por Server Actions que usam a **service role key** do
  Supabase (nunca exposta ao cliente). Leitura (`select`) é pública via anon
  key, direto do cliente.
- Criar depoimento é aberto a qualquer visitante (sem senha), mas ainda passa
  por uma Server Action (não INSERT direto do cliente) para permitir
  validação básica anti-abuso no futuro sem mudar o modelo de dados.

## Acesso da família

Sem contas individuais. Uma **senha única da família**:

- Hash da senha (bcrypt) guardado em env var no servidor
  (`FAMILY_PASSWORD_HASH`), nunca no código nem no cliente.
- Server Action `loginFamily(password)` compara o hash e, se válido, grava um
  cookie **httpOnly, assinado** (`grotto_family_session`) marcando a sessão
  como autorizada. Sem expiração curta agressiva — pensado para uso
  esporádico ao longo dos anos.
- Toda Server Action de escrita sensível (publicar foto, apagar foto, apagar
  depoimento) verifica esse cookie no servidor antes de tocar no Supabase.
  Sem o cookie válido, a ação é rejeitada mesmo que alguém tente chamar a
  rota diretamente.
- Qualquer familiar autenticado pode apagar **qualquer** foto ou depoimento
  (não só o que ele mesmo publicou) — decisão explícita do usuário, dado que
  é um grupo pequeno e de confiança.
- Sem a senha: visitante só visualiza fotos/depoimentos e pode deixar um
  depoimento no mural aberto (comportamento igual ao projeto de referência).

## Estrutura da página (rolagem única, sem rotas separadas)

1. **Hero** — Israel e Sonia lado a lado (foto, nome, datas), compartilhado.
2. **Depoimentos dos filhos** — seção única e fixa, sobre os dois pais
   (conteúdo do `content/`, ver abaixo).
3. **Música** — só do Israel ("Vida Melhor"), reaproveita player/letra do
   projeto de referência. Sonia não teve música própria, então não há
   equivalente para ela.
4. **Galeria da Família** — fotos gerais dos dois juntos e da família em
   geral (`scope = 'family'`). Compartilhada, visível e "adicionável" por
   qualquer familiar autenticado, sem filtro por pessoa.
5. **Memórias por pessoa** — um seletor (dois cartões/abas "Israel" /
   "Sonia") que troca o conteúdo abaixo:
   - Galeria de fotos individual (`scope = 'israel'` ou `'sonia'`)
   - Mural de depoimentos livres (`person = 'israel'` ou `'sonia'`)

   Trocar a pessoa selecionada não rola a página nem muda de URL — só
   re-renderiza essa área (evita duplicar a página inteira duas vezes).
6. **Rodapé** — compartilhado.

## Conteúdo editável

Arquivos de conteúdo separados dos componentes, para edição sem mexer em
código:

- `content/israel.ts` — nome, datas, foto do hero, depoimentos fixos dos
  filhos sobre ele, dados da música. Populado reaproveitando o conteúdo já
  existente no `memorial-israel-andreo`.
- `content/sonia.ts` — mesma estrutura (sem música), com placeholders até a
  família definir o texto final.
- Depoimentos fixos "dos filhos" (seção 2) ficam num arquivo próprio, já que
  é uma seção só, compartilhada entre os dois.

## Visual — "Sereno Natureza"

Validado via mockup interativo:

- Paleta: verde-sálvia + branco quente (`#f4f7f1` → `#e6ede2` em gradiente,
  acentos em tons de verde ~`#6b8a5a`/`#a9c398`), toques botânicos sutis
  (remetendo ao sítio da família, já usado como imagem de fundo no projeto
  de referência).
- Tipografia: serifada suave nos títulos (ex.: `Lora` ou `Cormorant
  Garamond` via `next/font/google`) + sans-serif limpa no corpo (ex.:
  `Inter`), substituindo a tipografia padrão do shadcn.
- Modo claro/escuro mantido, adaptando a mesma paleta para dark mode.
- Componentes shadcn/ui (`Card`, `Dialog`, `Button`, etc.) do projeto de
  referência são reaproveitados como base, restilizados para a nova paleta —
  não reescritos do zero.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # só no servidor
FAMILY_PASSWORD_HASH=            # bcrypt hash, só no servidor
SESSION_SECRET=                  # assina o cookie de sessão da família
```

## Fora de escopo / decisões adiadas

- Textos finais dos depoimentos dos filhos sobre a Sonia (e possivelmente
  atualização dos depoimentos existentes do Israel para mencionar os dois) —
  o usuário preenche depois via `content/sonia.ts` / arquivo de depoimentos.
- Fotos reais (hero, galeria inicial) — projeto sobe com placeholders até a
  família enviar os arquivos.
- Criação da conta/projeto Supabase e do projeto na Vercel — feito durante a
  implementação, com o usuário (requer login nas contas dele).
