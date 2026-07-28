import { useState, useEffect, useRef } from 'react'
import { useNinho } from '../lib/NinhoContext'
import { perguntarAoIndez } from '../lib/indez'
import { saudacaoIndez } from '../lib/linguagem'
import { guardarConversa, buscarConversaDoDia } from '../lib/dados'
import { DIAS } from '../data/conteudo'

export default function ChatIndez({ diaDaConversa, setDiaDaConversa }) {
  const { nome, genero, reflexoes } = useNinho()
  const [historico, setHistorico] = useState([])
  const [entrada, setEntrada] = useState('')
  const [pensando, setPensando] = useState(false)
  const [erro, setErro] = useState('')
  const [guardando, setGuardando] = useState(false)
  const fimDaLista = useRef(null)

  // Abre a conversa: retoma a do dia, se já existir; senão, saúda.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      if (diaDaConversa) {
        try {
          const c = await buscarConversaDoDia(diaDaConversa)
          if (!vivo) return
          if (c?.mensagens?.length) { setHistorico(c.mensagens); return }
        } catch { /* segue com a saudação */ }
      }
      if (!vivo) return
      setHistorico((h) => (h.length ? h : [{ role: 'assistant', content: saudacaoIndez(nome, genero) }]))
    })()
    return () => { vivo = false }
  }, [diaDaConversa, nome, genero])

  // Quando vem de um dia, já deixa o contexto pronto no campo.
  useEffect(() => {
    if (!diaDaConversa) return
    const d = DIAS.find((x) => x.n === diaDaConversa)
    const r = reflexoes[diaDaConversa]
    setEntrada(
      `Quero conversar sobre o Dia ${diaDaConversa} — "${d.titulo}". ` +
      (r ? `Escrevi isto na minha reflexão: "${r}"` : 'Ainda não escrevi minha reflexão.')
    )
  }, [diaDaConversa, reflexoes])

  useEffect(() => { fimDaLista.current?.scrollIntoView({ behavior: 'smooth' }) }, [historico, pensando])

  async function enviar() {
    const texto = entrada.trim()
    if (!texto || pensando) return
    setErro('')
    const novo = [...historico, { role: 'user', content: texto }]
    setHistorico(novo)
    setEntrada('')
    setPensando(true)
    try {
      const resposta = await perguntarAoIndez({ historico: novo, nome, genero })
      setHistorico([...novo, { role: 'assistant', content: resposta }])
    } catch (e) {
      setErro(e.message)
      setHistorico(novo)
    } finally {
      setPensando(false)
    }
  }

  async function concluir() {
    if (!diaDaConversa) return
    setGuardando(true)
    try {
      await guardarConversa(diaDaConversa, historico)
      setDiaDaConversa(null)
      setHistorico([{ role: 'assistant', content: saudacaoIndez(nome, genero) }])
      alert('Conversa guardada no seu ninho. 🥚 Você pode reler quando quiser em "Meu Ninho".')
    } catch (e) {
      setErro('Não consegui guardar a conversa: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const dia = diaDaConversa ? DIAS.find((x) => x.n === diaDaConversa) : null

  return (
    <div className="painel ativa container">
      <h2 className="titulo-painel">O Indez</h2>
      <p className="intro">
        O Indez é o guia que mora no ninho. Ele não te dá respostas prontas —
        ele escuta e faz perguntas que ajudam você a encontrar o que já está dentro de você.
      </p>

      <div className="chat">
        <div className="chat-topo">
          <div className="chat-ovo" aria-hidden="true" />
          <div>
            <strong>Indez</strong>
            <small>seu guia residente · escuta e acolhe</small>
          </div>
        </div>

        <div className="chat-msgs">
          {historico.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'eu' : 'indez'}`}>
              {m.content}
            </div>
          ))}
          {pensando && <div className="msg indez pensando">O Indez está pensando…</div>}
          {erro && <div className="erro-msg" role="alert">{erro}</div>}
          <div ref={fimDaLista} />
        </div>

        {diaDaConversa && (
          <div className="barra-concluir" style={{ display: 'flex' }}>
            <span className="rotulo-dia">Conversa sobre o Dia {dia.n} · {dia.titulo}</span>
            <button className="btn-concluir" onClick={concluir} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Concluir e guardar no meu ninho ✓'}
            </button>
          </div>
        )}

        <div className="chat-entrada">
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            placeholder="Escreva o que está sentindo…"
            disabled={pensando}
          />
          <button className="chat-enviar" onClick={enviar} disabled={pensando} aria-label="Enviar">↑</button>
        </div>
      </div>
    </div>
  )
}
