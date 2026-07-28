-- =====================================================================
-- INDOZE — adiciona WhatsApp ao perfil (agora obrigatório no cadastro)
-- =====================================================================
-- COMO USAR:
--   Supabase → SQL Editor → cole este arquivo inteiro → Run
--   Rode UMA VEZ. É seguro rodar de novo (usa IF NOT EXISTS).
-- =====================================================================

alter table public.perfis
  add column if not exists whatsapp text;

comment on column public.perfis.whatsapp is 'WhatsApp com DDI e DDD, ex: +55 11 91234-5678';

-- refaz o gatilho de criação de perfil para gravar o whatsapp também
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, instagram, genero, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Pessoa do ninho'),
    nullif(new.raw_user_meta_data->>'instagram',''),
    coalesce(new.raw_user_meta_data->>'genero', 'n'),
    nullif(new.raw_user_meta_data->>'whatsapp','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
