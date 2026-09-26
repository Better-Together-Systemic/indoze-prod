// Mesma lista de origens do anthropic-proxy — se mudar o domínio de produção,
// atualize aqui E lá.
const origensPermitidas = [
  'https://indoze.vercel.app',
  'https://indoze-prod.vercel.app',
  'http://localhost:5173',
]

export function corsHeaders(origem: string) {
  return {
    'Access-Control-Allow-Origin': origensPermitidas.includes(origem) ? origem : '',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

/** Origem já conferida contra a lista — usada para montar redirect_url com segurança. */
export function origemConfiavel(origem: string) {
  return origensPermitidas.includes(origem) ? origem : origensPermitidas[0]
}
