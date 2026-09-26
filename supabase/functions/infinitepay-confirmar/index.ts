// Chamado pelo navegador assim que a InfinitePay redireciona a pessoa de volta
// para /pagamento/retorno — é o caminho rápido (o webhook é o caminho garantido,
// que funciona mesmo se a pessoa fechar a aba antes do redirect).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { confirmarPagamentoNaInfinitePay, pagamentoValido } from '../_shared/infinitepay.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  const origem = req.headers.get('origin') ?? ''
  const cors = corsHeaders(origem)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'método não permitido' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: { user }, error: authError } = auth
    ? await supabaseAdmin.auth.getUser(auth)
    : { data: { user: null }, error: 'sem token' }

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'não autorizado' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { data: perfilAtual } = await supabaseAdmin
    .from('perfis').select('pago').eq('id', user.id).maybeSingle()

  if (perfilAtual?.pago) {
    return new Response(JSON.stringify({ pago: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let corpo
  try {
    corpo = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'corpo inválido' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { order_nsu, transaction_nsu, slug, receipt_url } = corpo ?? {}

  // A pessoa só pode confirmar o próprio pagamento — nunca o de outra.
  if (order_nsu !== user.id) {
    return new Response(JSON.stringify({ error: 'pedido não confere com quem está logado' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (!transaction_nsu || !slug) {
    return new Response(JSON.stringify({ error: 'faltam dados do pagamento' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const check = await confirmarPagamentoNaInfinitePay({ orderNsu: order_nsu, transactionNsu: transaction_nsu, slug })

    if (!pagamentoValido(check)) {
      return new Response(JSON.stringify({ pago: false }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabaseAdmin
      .from('perfis')
      .update({
        pago: true,
        pago_em: new Date().toISOString(),
        pagamento_transacao_nsu: transaction_nsu,
        pagamento_comprovante_url: receipt_url ?? null,
      })
      .eq('id', user.id)

    if (error) throw error

    return new Response(JSON.stringify({ pago: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (erro) {
    console.error('infinitepay-confirmar:', erro)
    return new Response(JSON.stringify({ error: (erro as Error).message }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
