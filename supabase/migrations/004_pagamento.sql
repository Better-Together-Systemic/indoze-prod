-- =====================================================================
-- INDOZE — acesso mediante pagamento (InfinitePay)
-- =====================================================================
-- COMO USAR:
--   Supabase → SQL Editor → cole este arquivo inteiro → Run
--   Rode UMA VEZ. É seguro rodar de novo (usa IF NOT EXISTS).
--
-- IDEIA GERAL:
--   Cadastro sozinho não abre o ninho. É preciso pagar.
--   Quem diz que pagou é a Edge Function `infinitepay-webhook` (ou
--   `infinitepay-confirmar`), sempre conferindo com a própria InfinitePay
--   antes de marcar `pago = true`. O navegador da pessoa NUNCA consegue
--   se marcar como paga sozinho — veja o GRANT no final deste arquivo.
--
--   Quem já tinha conta ANTES desta migração continua entrando normalmente
--   (fica marcado como pago). A cobrança vale só para quem se cadastrar
--   dali pra frente.
-- =====================================================================

alter table public.perfis
  add column if not exists pago boolean not null default false,
  add column if not exists pago_em timestamptz,
  add column if not exists pagamento_transacao_nsu text,
  add column if not exists pagamento_comprovante_url text;

comment on column public.perfis.pago is 'Só é true depois que a Edge Function confirma o pagamento direto com a InfinitePay.';
comment on column public.perfis.pagamento_transacao_nsu is 'transaction_nsu devolvido pela InfinitePay — guardado para suporte/auditoria.';
comment on column public.perfis.pagamento_comprovante_url is 'Link do comprovante (receipt_url) devolvido pela InfinitePay.';

-- Quem já estava cadastrado antes de existir cobrança não fica trancado pra fora.
update public.perfis set pago = true where pago = false;

-- =====================================================================
-- A TRANCA: ninguém logado consegue se marcar como pago pelo navegador.
--
-- O GRANT de UPDATE de `perfis` hoje libera TODAS as colunas para quem
-- está logado. Trocamos por uma lista explícita SEM as colunas de
-- pagamento — assim, mesmo alguém mexendo direto no console (supabase.from
-- ('perfis').update({pago:true})), o banco recusa. Só a service_role
-- (usada pelas Edge Functions) escreve nessas colunas.
-- =====================================================================
revoke update on public.perfis from authenticated;
grant update (nome, instagram, genero, whatsapp) on public.perfis to authenticated;
