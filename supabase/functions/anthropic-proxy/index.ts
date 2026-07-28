// Proxy entre o front do INDOZE e a API da Anthropic.
// A ANTHROPIC_API_KEY vive só aqui (variável de ambiente da função), nunca no front.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const origensPermitidas = [
  'https://indoze.vercel.app',
  'https://indoze-prod.vercel.app',
  'http://localhost:5173',
]

function corsHeaders(origem: string) {
  return {
    'Access-Control-Allow-Origin': origensPermitidas.includes(origem) ? origem : '',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas automaticamente
// pelo runtime das Edge Functions — não precisam ser configuradas na mão.
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

  // PASSO 3.2 — só gente logada usa o Indez.
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

  let corpo
  try {
    corpo = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'corpo inválido' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { model, max_tokens, system, messages } = corpo ?? {}
  if (!model || !max_tokens || !messages) {
    return new Response(JSON.stringify({ error: 'corpo incompleto' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const respostaAnthropic = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  })

  const dados = await respostaAnthropic.json()

  return new Response(JSON.stringify(dados), {
    status: respostaAnthropic.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
