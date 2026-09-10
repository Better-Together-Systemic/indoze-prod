import { supabase } from './supabase'

/**
 * Login de verdade, via Supabase Auth.
 * As senhas nunca passam por aqui em texto: quem guarda (com hash) é o Supabase.
 */

export async function cadastrar({ nome, email, senha, whatsapp, instagram, genero }) {
  const erroSenha = validarSenha(senha)
  if (erroSenha) throw new Error(erroSenha)
  if (!nome?.trim()) throw new Error('Escreva seu nome, por favor.')

  const erroEmail = validarEmail(email)
  if (erroEmail) throw new Error(erroEmail)

  const erroWhatsapp = validarWhatsapp(whatsapp)
  if (erroWhatsapp) throw new Error(erroWhatsapp)

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: {
      // isto vira o perfil automaticamente, pelo gatilho do banco
      data: {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        instagram: (instagram ?? '').replace(/^@+/, '').trim(),
        genero: genero ?? 'n',
      },
      emailRedirectTo: `${window.location.origin}/entrar`,
    },
  })

  if (error) throw traduzirErro(error)
  return data
}

export async function entrar({ email, senha }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  })
  if (error) throw traduzirErro(error)
  return data
}

/**
 * Login (ou cadastro automático, se for a primeira vez) via Google.
 * O Supabase leva a pessoa até o Google e traz de volta com a sessão pronta.
 */
export async function entrarComGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/entrar`,
    },
  })
  if (error) throw traduzirErro(error)
}

export async function sair() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function pedirNovaSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/nova-senha`,
  })
  if (error) throw traduzirErro(error)
}

export async function definirNovaSenha(senha) {
  const erroSenha = validarSenha(senha)
  if (erroSenha) throw new Error(erroSenha)
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw traduzirErro(error)
}

/* --------------------------- ajuda --------------------------- */

/** Mesmas regras da tela: 8+ letras, maiúscula, número e símbolo. */
export function validarSenha(senha) {
  if (!senha || senha.length < 8) return 'A senha precisa de pelo menos 8 letras.'
  if (!/[A-Z]/.test(senha)) return 'A senha precisa de uma letra maiúscula.'
  if (!/[0-9]/.test(senha)) return 'A senha precisa de um número.'
  if (!/[^A-Za-z0-9]/.test(senha)) return 'A senha precisa de um símbolo (!@#$...).'
  return null
}

/** E-mail no formato básico algo@algo.algo — sem regex exagerada, só o essencial. */
export function validarEmail(email) {
  const limpo = (email ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) {
    return 'Escreva um e-mail válido.'
  }
  return null
}

/** WhatsApp com DDI, DDD e número — ex: +55 11 91234-5678. */
export function validarWhatsapp(whatsapp) {
  const limpo = (whatsapp ?? '').trim()
  if (!/^\+\d{1,3}\s?\d{2}\s?\d{4,5}-?\d{4}$/.test(limpo)) {
    return 'Escreva o WhatsApp com DDI, DDD e número, assim: +55 11 91234-5678.'
  }
  return null
}

export function forcaDaSenha(senha) {
  let pontos = 0
  if ((senha ?? '').length >= 8) pontos++
  if (/[A-Z]/.test(senha ?? '')) pontos++
  if (/[0-9]/.test(senha ?? '')) pontos++
  if (/[^A-Za-z0-9]/.test(senha ?? '')) pontos++
  return pontos // 0..4
}

/** Mensagens do Supabase vêm em inglês; aqui viram acolhimento em português. */
function traduzirErro(error) {
  const m = (error?.message ?? '').toLowerCase()
  if (m.includes('invalid login credentials')) return new Error('E-mail ou senha não conferem.')
  if (m.includes('email not confirmed')) return new Error('Confirme seu e-mail antes de entrar. Olhe sua caixa de entrada.')
  if (m.includes('user already registered')) return new Error('Este e-mail já tem um ninho. Tente entrar.')
  if (m.includes('rate limit') || m.includes('too many')) return new Error('Muitas tentativas. Respire um pouco e tente de novo.')
  if (m.includes('password')) return new Error('Senha fraca demais. Use 8+ letras, uma maiúscula, um número e um símbolo.')
  return new Error(error?.message ?? 'Algo não saiu como esperado. Tente de novo.')
}
