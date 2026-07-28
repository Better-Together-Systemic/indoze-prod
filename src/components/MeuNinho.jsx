import { useState, useEffect } from 'react'
import { useNinho } from '../lib/NinhoContext'
import { buscarConversas } from '../lib/dados'
import { DIAS } from '../data/conteudo'

export default function MeuNinho() {
  const { reflexoes } = useNinho()
  const [conversas, setConversas] = useState([])
  const [lendo, setLendo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    buscarConversas()
      .then((c) => { if (vivo) setConversas(c) })
      .catch((e) => console.error('Não consegui buscar as conversas:', e))
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [])

  const diasFeitos = DIAS.filter((d) => reflexoes[d.n]?.trim())
  const vazio = diasFeitos.length === 0 && conversas.length === 0

  return (
    <div className="painel ativa container">
      <h2 className="titulo-painel">Meu Ninho</h2>
      <p className="intro">
        Aqui ficam guardados os seus indezes: os pequenos gestos de mudança que você
        escolheu plantar. Cada um é um ovinho de coragem.
      </p>

      {carregando && <p className="intro">Abrindo seu ninho…</p>}

      {!carregando && vazio && (
        <div className="vazio">
          <div className="emoji">🪺</div>
          <p>
            Seu ninho ainda está vazio. Conforme você atravessa os dias, planta seus indezes
            e conversa com o Indez, tudo aparece aqui.
          </p>
        </div>
      )}

      {diasFeitos.length > 0 && (
        <>
          <h3 className="sub-ninho">Seus indezes plantados</h3>
          <div className="indez-lista">
            {diasFeitos.map((d) => (
              <div className="indez-item" key={d.n}>
                <div className="ovo">{d.emoji}</div>
                <div className="conteudo">
                  <h4>Dia {d.n} · {d.titulo}</h4>
                  <p>{reflexoes[d.n]}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {conversas.length > 0 && (
        <>
          <h3 className="sub-ninho">Suas conversas com o Indez</h3>
          <div className="indez-lista">
            {conversas.map((c) => {
              const d = DIAS.find((x) => x.n === c.dia)
              const trocas = (c.mensagens ?? []).filter((m) => m.role === 'user').length
              return (
                <button className="indez-item conversa-item" key={c.dia} onClick={() => setLendo(c)}>
                  <div className="ovo">💬</div>
                  <div className="conteudo">
                    <h4>Dia {c.dia} · {d?.titulo ?? ''}</h4>
                    <p>Uma conversa guardada, com {trocas} {trocas === 1 ? 'partilha' : 'partilhas'} suas. Toque para reler.</p>
                    <div className="data">
                      guardada em {new Date(c.atualizado_em).toLocaleDateString('pt-BR')} · abrir ›
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {lendo && <LeitorDeConversa conversa={lendo} aoFechar={() => setLendo(null)} />}
    </div>
  )
}

function LeitorDeConversa({ conversa, aoFechar }) {
  const d = DIAS.find((x) => x.n === conversa.dia)
  return (
    <div className="modal-fundo ativa" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal modal-leitor" role="dialog" aria-modal="true">
        <button className="fechar" onClick={aoFechar} aria-label="Fechar">&times;</button>
        <h2>Dia {conversa.dia} · {d?.titulo}</h2>
        <p style={{ marginTop: -8, color: 'var(--dourado)', fontWeight: 600, fontSize: 15 }}>
          conversa guardada em {new Date(conversa.atualizado_em).toLocaleDateString('pt-BR')}
        </p>
        <div className="leitor-corpo">
          {(conversa.mensagens ?? []).map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'eu' : 'indez'}`}>{m.content}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
