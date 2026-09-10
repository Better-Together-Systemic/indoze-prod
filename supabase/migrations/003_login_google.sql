-- =====================================================================
-- INDOZE — login/cadastro via Google (SSO)
-- =====================================================================
-- COMO USAR:
--   1) No painel do Supabase: Authentication → Providers → Google → habilite
--      e cole o Client ID e Client Secret (criados no Google Cloud Console).
--   2) No Google Cloud Console, a "Authorized redirect URI" é:
--        https://<SEU-PROJETO>.supabase.co/auth/v1/callback
--   3) Supabase → SQL Editor → cole este arquivo inteiro → Run.
--      Rode UMA VEZ. É seguro rodar de novo.
--
-- O QUE MUDA:
--   Quem entra pelo Google não passa pelo formulário de cadastro, então
--   raw_user_meta_data não tem 'nome' — só 'full_name'/'name' do Google.
--   O gatilho agora aceita esses nomes também. O WhatsApp continua sem
--   valor (o Google não fornece) — a tela pede ele no primeiro acesso.
-- =====================================================================

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
    coalesce(
      nullif(new.raw_user_meta_data->>'nome',''),
      nullif(new.raw_user_meta_data->>'full_name',''),
      nullif(new.raw_user_meta_data->>'name',''),
      'Pessoa do ninho'
    ),
    nullif(new.raw_user_meta_data->>'instagram',''),
    coalesce(new.raw_user_meta_data->>'genero', 'n'),
    nullif(new.raw_user_meta_data->>'whatsapp','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
