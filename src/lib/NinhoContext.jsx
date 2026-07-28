import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { buscarPerfil, buscarReflexoes, guardarReflexao as salvarNoBanco } from './dados'

const NinhoContext = createContext(null)

/**
 * O estado do ninho: quem está dentro e o que já chocou.
 * Fica num lugar só para as telas não brigarem entre si.
 */
export function NinhoProvider({ children }) {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [reflexoes, setReflexoes] = useState({})
  const [carregando, setCarregando] = useState(true)

  // Escuta o login: se a pessoa sai numa aba, sai em todas.
  useEffect(() => {
    let vivo = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!vivo) return
      setSessao(session)
      if (!session) setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (!vivo) return
      setSessao(session)
      if (!session) {
        setPerfil(null)
        setReflexoes({})
        setCarregando(false)
      }
    })

    return () => { vivo = false; subscription.unsubscribe() }
  }, [])

  // Quando entra alguém, busca o ninho dela.
  useEffect(() => {
    if (!sessao) return
    let vivo = true

    ;(async () => {
      setCarregando(true)
      try {
        const [p, r] = await Promise.all([buscarPerfil(), buscarReflexoes()])
        if (!vivo) return
        setPerfil(p)
        setReflexoes(r)
      } catch (e) {
        console.error('Não consegui abrir seu ninho:', e)
      } finally {
        if (vivo) setCarregando(false)
      }
    })()

    return () => { vivo = false }
  }, [sessao])

  /** Guarda a reflexão e já atualiza a tela (o banco é a fonte da verdade). */
  const guardarReflexao = useCallback(async (dia, texto) => {
    await salvarNoBanco(dia, texto)
    setReflexoes((atual) => ({ ...atual, [dia]: texto.trim() }))
  }, [])

  const recarregar = useCallback(async () => {
    const [p, r] = await Promise.all([buscarPerfil(), buscarReflexoes()])
    setPerfil(p)
    setReflexoes(r)
  }, [])

  const valor = {
    sessao,
    perfil,
    reflexoes,
    carregando,
    logado: Boolean(sessao),
    genero: perfil?.genero ?? 'n',
    nome: perfil?.nome ?? '',
    guardarReflexao,
    recarregar,
    setPerfil,
  }

  return <NinhoContext.Provider value={valor}>{children}</NinhoContext.Provider>
}

export function useNinho() {
  const ctx = useContext(NinhoContext)
  if (!ctx) throw new Error('useNinho precisa estar dentro de <NinhoProvider>')
  return ctx
}
