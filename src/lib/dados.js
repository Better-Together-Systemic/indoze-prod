import { supabase } from './supabase'
import { validarWhatsapp } from './auth'

/**
 * Camada de dados do ninho.
 *
 * Repare que nenhuma função aqui recebe "usuario_id" de fora.
 * Quem diz quem é a pessoa é o token de login, e o RLS no banco confere.
 * Assim, mesmo que alguém mexa no código do navegador, não alcança o ninho alheio.
 */

/* ---------------------------------- PERFIL --------------------------------- */

export async function buscarPerfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, instagram, genero, whatsapp, pago')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function atualizarPerfil({ nome, instagram, genero }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Você precisa entrar no ninho primeiro.')

  const { data, error } = await supabase
    .from('perfis')
    .update({ nome, instagram: instagram || null, genero })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Usado na telinha que pede o WhatsApp de quem entrou pelo Google. */
export async function definirWhatsapp(whatsapp) {
  const erro = validarWhatsapp(whatsapp)
  if (erro) throw new Error(erro)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Você precisa entrar no ninho primeiro.')

  const { data, error } = await supabase
    .from('perfis')
    .update({ whatsapp: whatsapp.trim() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/* -------------------------------- REFLEXÕES -------------------------------- */

/** Todas as reflexões da pessoa, no formato { 1: 'texto', 2: 'texto', ... } */
export async function buscarReflexoes() {
  const { data, error } = await supabase
    .from('reflexoes')
    .select('dia, texto, criado_em')
    .order('dia')

  if (error) throw error

  const mapa = {}
  for (const r of data ?? []) mapa[r.dia] = r.texto
  return mapa
}

/**
 * Guarda a reflexão de um dia. É definitivo: vira memória.
 * O banco também recusa qualquer tentativa de editar depois — não é só a tela.
 */
export async function guardarReflexao(dia, texto) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Você precisa entrar no ninho primeiro.')

  const limpo = (texto ?? '').trim()
  if (!limpo) throw new Error('Escreva algo antes de guardar.')
  if (limpo.length > 5000) throw new Error('Texto muito longo (máximo 5000 letras).')
  if (!Number.isInteger(dia) || dia < 1 || dia > 12) throw new Error('Dia inválido.')

  const { data, error } = await supabase
    .from('reflexoes')
    .insert({ usuario_id: user.id, dia, texto: limpo })
    .select()
    .single()

  if (error) {
    // 23505 = tentou guardar duas vezes o mesmo dia
    if (error.code === '23505') throw new Error('Este dia já foi guardado no seu ninho.')
    throw error
  }
  return data
}

/* -------------------------------- CONVERSAS -------------------------------- */

export async function buscarConversas() {
  const { data, error } = await supabase
    .from('conversas')
    .select('dia, mensagens, atualizado_em')
    .order('dia')

  if (error) throw error
  return data ?? []
}

export async function buscarConversaDoDia(dia) {
  const { data, error } = await supabase
    .from('conversas')
    .select('dia, mensagens, atualizado_em')
    .eq('dia', dia)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Guarda (ou atualiza) a conversa de um dia. Conversa pode ser retomada. */
export async function guardarConversa(dia, mensagens) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Você precisa entrar no ninho primeiro.')

  const { data, error } = await supabase
    .from('conversas')
    .upsert(
      { usuario_id: user.id, dia, mensagens },
      { onConflict: 'usuario_id,dia' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/* -------------------------------- PROGRESSO -------------------------------- */

export async function buscarProgresso() {
  const { data, error } = await supabase
    .from('meu_progresso')
    .select('dias_concluidos, ultimo_dia, jornada_completa')
    .maybeSingle()

  if (error) throw error
  return data ?? { dias_concluidos: 0, ultimo_dia: 0, jornada_completa: false }
}
