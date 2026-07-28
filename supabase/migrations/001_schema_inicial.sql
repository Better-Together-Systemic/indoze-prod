-- =====================================================================
-- INDOZE — O Efeito Chocadeira
-- Esquema inicial do banco de dados (Supabase / PostgreSQL)
-- =====================================================================
-- COMO USAR:
--   Supabase → SQL Editor → cole este arquivo inteiro → Run
--   Rode UMA VEZ. É seguro rodar de novo (usa IF NOT EXISTS).
--
-- IDEIA GERAL:
--   Cada pessoa tem um "ninho" e só enxerga o próprio ninho.
--   Quem garante isso é o RLS (Row Level Security) — a tranca do banco.
-- =====================================================================


-- =====================================================================
-- 1. PERFIS  (dados do cadastro, ligados ao login do Supabase Auth)
-- =====================================================================
create table if not exists public.perfis (
  id           uuid primary key references auth.users(id) on delete cascade,
  nome         text not null check (char_length(nome) between 1 and 120),
  instagram    text check (instagram is null or char_length(instagram) <= 40),
  genero       text not null default 'n' check (genero in ('m','f','n')),
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table  public.perfis is 'Perfil de cada pessoa do ninho. O id é o mesmo do auth.users.';
comment on column public.perfis.genero is 'Como a pessoa quer ser tratada: m=masculino, f=feminino, n=neutro';
comment on column public.perfis.instagram is 'Usuário do Instagram, já sem o @';


-- =====================================================================
-- 2. REFLEXÕES  (o que a pessoa escreve em cada um dos 12 dias)
-- =====================================================================
create table if not exists public.reflexoes (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  dia          smallint not null check (dia between 1 and 12),
  texto        text not null check (char_length(texto) between 1 and 5000),
  criado_em    timestamptz not null default now(),
  -- uma reflexão por dia, por pessoa
  unique (usuario_id, dia)
);

comment on table public.reflexoes is 'A reflexão que a pessoa guardou em cada dia. Depois de guardada, vira memória (não se edita).';

create index if not exists idx_reflexoes_usuario on public.reflexoes(usuario_id);


-- =====================================================================
-- 3. CONVERSAS  (os encontros com o Indez, guardados no ninho)
-- =====================================================================
create table if not exists public.conversas (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  dia          smallint check (dia is null or dia between 1 and 12),
  mensagens    jsonb not null default '[]'::jsonb,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, dia)
);

comment on table public.conversas is 'Conversas com o Indez guardadas por dia. mensagens = [{role, content}, ...]';

create index if not exists idx_conversas_usuario on public.conversas(usuario_id);


-- =====================================================================
-- 4. GATILHO: atualiza "atualizado_em" sozinho
-- =====================================================================
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_perfis_atualizado on public.perfis;
create trigger trg_perfis_atualizado
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists trg_conversas_atualizado on public.conversas;
create trigger trg_conversas_atualizado
  before update on public.conversas
  for each row execute function public.tocar_atualizado_em();


-- =====================================================================
-- 5. GATILHO: cria o perfil sozinho quando alguém se cadastra
-- =====================================================================
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, instagram, genero)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Pessoa do ninho'),
    nullif(new.raw_user_meta_data->>'instagram',''),
    coalesce(new.raw_user_meta_data->>'genero', 'n')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();


-- =====================================================================
-- 6. PERMISSÕES + RLS — A TRANCA DO NINHO
--    Sem isso, qualquer pessoa leria o diário de qualquer outra.
--
--    São DUAS camadas:
--      GRANT = "esta chave existe pra esta porta"
--      RLS   = "mas só abre a SUA gaveta"
-- =====================================================================

-- ninguém anônimo toca em nada
revoke all on public.perfis    from anon;
revoke all on public.reflexoes from anon;
revoke all on public.conversas from anon;

-- pessoas logadas: só o que a jornada precisa
grant select, insert, update on public.perfis    to authenticated;
grant select, insert          on public.reflexoes to authenticated;  -- sem update/delete: memória é imutável
grant select, insert, update, delete on public.conversas to authenticated;

alter table public.perfis    enable row level security;
alter table public.reflexoes enable row level security;
alter table public.conversas enable row level security;

-- ---------- PERFIS ----------
drop policy if exists "perfil: leio o meu" on public.perfis;
create policy "perfil: leio o meu"
  on public.perfis for select
  to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists "perfil: crio o meu" on public.perfis;
create policy "perfil: crio o meu"
  on public.perfis for insert
  to authenticated
  with check ( (select auth.uid()) = id );

drop policy if exists "perfil: atualizo o meu" on public.perfis;
create policy "perfil: atualizo o meu"
  on public.perfis for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- ---------- REFLEXÕES ----------
drop policy if exists "reflexao: leio as minhas" on public.reflexoes;
create policy "reflexao: leio as minhas"
  on public.reflexoes for select
  to authenticated
  using ( (select auth.uid()) = usuario_id );

drop policy if exists "reflexao: guardo a minha" on public.reflexoes;
create policy "reflexao: guardo a minha"
  on public.reflexoes for insert
  to authenticated
  with check ( (select auth.uid()) = usuario_id );

-- Repare: NÃO existe policy de UPDATE nem DELETE em reflexoes.
-- Isso é de propósito: reflexão guardada vira memória e não se altera.
-- A regra do produto está garantida no próprio banco, não só na tela.

-- ---------- CONVERSAS ----------
drop policy if exists "conversa: leio as minhas" on public.conversas;
create policy "conversa: leio as minhas"
  on public.conversas for select
  to authenticated
  using ( (select auth.uid()) = usuario_id );

drop policy if exists "conversa: guardo a minha" on public.conversas;
create policy "conversa: guardo a minha"
  on public.conversas for insert
  to authenticated
  with check ( (select auth.uid()) = usuario_id );

drop policy if exists "conversa: atualizo a minha" on public.conversas;
create policy "conversa: atualizo a minha"
  on public.conversas for update
  to authenticated
  using ( (select auth.uid()) = usuario_id )
  with check ( (select auth.uid()) = usuario_id );

drop policy if exists "conversa: apago a minha" on public.conversas;
create policy "conversa: apago a minha"
  on public.conversas for delete
  to authenticated
  using ( (select auth.uid()) = usuario_id );


-- =====================================================================
-- 7. VISÃO DE PROGRESSO (útil pra tela dos 12 dias)
-- =====================================================================
create or replace view public.meu_progresso
with (security_invoker = true)
as
select
  r.usuario_id,
  count(*)::int                       as dias_concluidos,
  max(r.dia)::int                     as ultimo_dia,
  (count(*) >= 12)                    as jornada_completa
from public.reflexoes r
group by r.usuario_id;

comment on view public.meu_progresso is 'Quantos dias a pessoa já chocou. security_invoker faz o RLS valer aqui também.';

revoke all on public.meu_progresso from anon;
grant select on public.meu_progresso to authenticated;
