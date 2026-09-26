import { supabase } from './supabase'

const URL_BASE = import.meta.env.VITE_SUPABASE_URL

async function chamar(nomeFuncao, corpo) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Entre no ninho para continuar.')

  const resposta = await fetch(`${URL_BASE}/functions/v1/${nomeFuncao}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(corpo ?? {}),
  })

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(dados.error || 'Não consegui falar com o pagamento agora.')
  return dados
}

/** Gera (ou reaproveita, se já pago) o link de pagamento único desta pessoa. */
export async function criarLinkPagamento() {
  return chamar('infinitepay-criar-link')
}

/** Confirma com a InfinitePay o pagamento cujos dados vieram no redirect de volta. */
export async function confirmarPagamento({ orderNsu, transactionNsu, slug, receiptUrl }) {
  return chamar('infinitepay-confirmar', {
    order_nsu: orderNsu,
    transaction_nsu: transactionNsu,
    slug,
    receipt_url: receiptUrl,
  })
}
