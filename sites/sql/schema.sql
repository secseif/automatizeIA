-- Automatize — schema do Supabase
-- Rode este script inteiro em: Supabase > SQL Editor > New query > Run

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  plan text not null,
  business text not null,
  segment text not null,
  goal text not null,
  name text not null,
  phone text not null,
  email text,
  page_path text,
  user_agent text
);

alter table leads enable row level security;

-- Qualquer visitante do site pode enviar um lead (insert), mas não pode ler os leads de outras pessoas.
create policy "Visitantes podem enviar leads"
  on leads for insert
  to anon
  with check (true);

-- Só usuários autenticados (você, logado no dashboard) podem ver os leads.
create policy "Usuários autenticados podem ver leads"
  on leads for select
  to authenticated
  using (true);

create index if not exists leads_created_at_idx on leads (created_at desc);
