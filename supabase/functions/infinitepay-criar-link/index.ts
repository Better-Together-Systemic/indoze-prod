// Gera o link de pagamento único de quem está logado (order_nsu = id da pessoa).
// A pessoa clica em "Pagar agora" na tela /pagamento e cai aqui antes de ir
// para o checkout da InfinitePay.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, origemConfiavel } from '../_shared/cors.ts'
import { criarLinkCheckout } from '../_shared/infinitepay.ts'

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

  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('pago, nome')
    .eq('id', user.id)
    .maybeSingle()

  if (perfil?.pago) {
    return new Response(JSON.stringify({ jaPago: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const base = origemConfiavel(origem)
    const url = await criarLinkCheckout({
      orderNsu: user.id,
      redirectUrl: `${base}/pagamento/retorno`,
      webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/infinitepay-webhook`,
      nome: perfil?.nome,
      email: user.email,
    })
    return new Response(JSON.stringify({ url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (erro) {
    console.error('infinitepay-criar-link:', erro)
    return new Response(JSON.stringify({ error: (erro as Error).message }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
