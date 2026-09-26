// Recebido diretamente pela InfinitePay quando um pagamento é aprovado.
// Não tem crachá de login (quem chama é o servidor da InfinitePay, não o
// navegador de ninguém) — por isso NUNCA confiamos só no corpo recebido:
// sempre conferimos de volta com a própria InfinitePay antes de liberar o
// acesso. É o caminho garantido de confirmação (funciona mesmo se a pessoa
// fechar a aba antes do redirect de volta ao site).
//
// IMPORTANTE NO DEPLOY: esta função precisa rodar com a verificação de JWT
// desligada (a InfinitePay não manda token nenhum). Veja supabase/config.toml
// e docs/GUIA-DO-BRUNO.md.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { confirmarPagamentoNaInfinitePay, pagamentoValido } from '../_shared/infinitepay.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let corpo
  try {
    corpo = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'corpo inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { order_nsu, transaction_nsu, invoice_slug, receipt_url } = corpo ?? {}

  if (!order_nsu || !transaction_nsu || !invoice_slug) {
    console.error('infinitepay-webhook: corpo incompleto', corpo)
    // 200 de propósito: corpo malformado não é algo que uma nova tentativa resolve.
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const check = await confirmarPagamentoNaInfinitePay({
      orderNsu: order_nsu,
      transactionNsu: transaction_nsu,
      slug: invoice_slug,
    })

    if (!pagamentoValido(check)) {
      console.warn('infinitepay-webhook: aviso não confirmado no payment_check', { order_nsu, transaction_nsu })
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    const { error } = await supabaseAdmin
      .from('perfis')
      .update({
        pago: true,
        pago_em: new Date().toISOString(),
        pagamento_transacao_nsu: transaction_nsu,
        pagamento_comprovante_url: receipt_url ?? null,
      })
      .eq('id', order_nsu)

    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (erro) {
    console.error('infinitepay-webhook:', erro)
    // 400 aqui É de propósito: se a checagem falhou por erro de rede/InfinitePay
    // fora do ar, vale a InfinitePay tentar de novo mais tarde.
    return new Response(JSON.stringify({ error: (erro as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
