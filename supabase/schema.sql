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
