import { supabase } from './supabase'
import { SYS_INDEZ } from '../data/conteudo'
import { instrucaoGenero } from './linguagem'

const PROXY_URL = import.meta.env.VITE_INDEZ_PROXY_URL

/**
 * Conversa com o Indez.
 *
 * A chave da Anthropic NUNCA fica aqui. Quem fala com a Anthropic é o proxy
 * (Edge Function no Supabase), que guarda a chave no servidor.
 * O navegador só mostra o crachá de quem está logado.
 */
export async function perguntarAoIndez({ historico, nome, genero }) {
  if (!PROXY_URL) {
    throw new Error('O ninho ainda não sabe onde encontrar o Indez (falta VITE_INDEZ_PROXY_URL).')
  }

  // O crachá da pessoa logada: o proxy usa isto para saber que o pedido é legítimo.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Entre no ninho para conversar com o Indez.')

  const resposta = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYS_INDEZ + instrucaoGenero(nome, genero),
      messages: historico.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!resposta.ok) {
    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error('O Indez não reconheceu seu crachá. Tente sair e entrar de novo.')
    }
    if (resposta.status === 429) {
      throw new Error('O Indez está com muitas conversas ao mesmo tempo. Respire e tente de novo em instantes.')
    }
    throw new Error('O Indez está sem sinal agora. Tente de novo daqui a pouco.')
  }

  const dados = await resposta.json()
  const texto = (dados.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  if (!texto) throw new Error('O Indez ficou em silêncio. Tente perguntar de novo.')
  return texto
}
