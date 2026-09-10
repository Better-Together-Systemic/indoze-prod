import { useState } from 'react'
import { DIAS, FASES } from '../data/conteudo'
import { useNinho } from '../lib/NinhoContext'
import { estadoDoDia, contarDiasFeitos } from '../lib/linguagem'

export default function DozeDias({ aoConversar }) {
  const { reflexoes } = useNinho()
  const [diaAberto, setDiaAberto] = useState(null)
  const [aviso, setAviso] = useState('')

  const feitos = contarDiasFeitos(reflexoes)

  function tocarNoDia(n) {
    const est = estadoDoDia(n, reflexoes)
    if (est === 'trancado') {
      setAviso(`🥚 Este ovo ainda está chocando. O Dia ${n} abre assim que você guardar sua reflexão do Dia ${n - 1}. Um de cada vez, no seu tempo.`)
      setTimeout(() => setAviso(''), 4200)
      return
    }
    setDiaAberto(n)
  }

  if (diaAberto) {
    return (
      <DetalheDoDia
        n={diaAberto}
        aoVoltar={() => setDiaAberto(null)}
        aoConversar={aoConversar}
      />
    )
  }

  return (
    <div className="painel ativa container">
      <h2 className="titulo-painel">Os 12 Dias</h2>
      <p className="intro">
        Doze dias de incubação. Um ovo choca de cada vez — no seu tempo, sem pressa.
      </p>

      <BarraDoLivro feitos={feitos} />

      {aviso && <div className="aviso-trancado aparece">{aviso}</div>}

      {gruposPorFase(DIAS).map((grupo) => {
        const f = FASES[grupo.fase]
        return (
          <div className="grupo-fase" key={grupo.fase} style={{ '--cor-fase': f.cor }}>
            <div className="grupo-fase-titulo">
              <span className="bola" />
              {f.nome}
            </div>
            <div className="grade-dias">
              {grupo.dias.map((d) => {
                const est = estadoDoDia(d.n, reflexoes)
                return (
                  <div
                    key={d.n}
                    className={`dia-card ${est}`}
                    style={{ '--cor-fase': f.cor, '--cor-fase-bg': f.bg }}
                    onClick={() => tocarNoDia(d.n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && tocarNoDia(d.n)}
                    title={est === 'trancado' ? `Abre quando você concluir o Dia ${d.n - 1}` : undefined}
                  >
                    {est === 'feito' && <div className="selo">✓</div>}
                    {est === 'trancado' && <div className="selo cadeado">🔒</div>}
                    {est === 'aberto' && <div className="selo agora">🥚</div>}
                    <div className="num">Dia {d.n}</div>
                    <div className="emoji">{d.emoji}</div>
                    <h4>{d.titulo}</h4>
                    {est === 'feito' && <span className="estado-dia">guardado no ninho</span>}
                    {est === 'aberto' && <span className="estado-dia agora">é a sua vez</span>}
                    {est === 'trancado' && <span className="estado-dia">chocando…</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Os 12 dias já vêm em blocos contíguos por fase — aqui só agrupamos pra exibir. */
function gruposPorFase(dias) {
  const grupos = []
  for (const d of dias) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.fase === d.fase) ultimo.dias.push(d)
    else grupos.push({ fase: d.fase, dias: [d] })
  }
  return grupos
}

/* ------------------------- a barra do livro ------------------------- */

function BarraDoLivro({ feitos }) {
  const { nome, reflexoes } = useNinho()
  const [gerando, setGerando] = useState(false)

  async function gerar() {
    setGerando(true)
    try {
      // o gerador só é baixado quando alguém realmente vai gerar o livro
      const { gerarLivroPDF } = await import('../lib/livroPdf')
      await gerarLivroPDF({ nome, reflexoes })
    } catch (e) {
      console.error(e)
      alert('O ninho tropeçou ao montar seu livro. Tente de novo em um instante.')
    } finally {
      setGerando(false)
    }
  }

  if (feitos >= 12) {
    return (
      <div className="barra-livro pronta">
        <div>
          <strong>🥚 Seu ovo chocou!</strong>
          <span>Você atravessou os doze dias. Agora seu livro pode nascer.</span>
        </div>
        <button className="btn-livro" onClick={gerar} disabled={gerando}>
          {gerando ? 'Preparando seu ninho…' : 'Gerar meu livro em PDF ✨'}
        </button>
      </div>
    )
  }

  return (
    <div className="barra-livro">
      <div>
        <strong>Seu livro está sendo chocado…</strong>
        <span>{feitos} de 12 dias com reflexão. Quando completar os doze, seu livro nasce aqui.</span>
      </div>
      <div className="progresso-livro">
        <span style={{ width: `${(feitos / 12) * 100}%` }} />
      </div>
    </div>
  )
}

/* ------------------------- o dia por dentro ------------------------- */

function DetalheDoDia({ n, aoVoltar, aoConversar }) {
  const { reflexoes, guardarReflexao } = useNinho()
  const d = DIAS.find((x) => x.n === n)
  const f = FASES[d.fase]
  const est = estadoDoDia(n, reflexoes)

  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function guardar() {
    if (!texto.trim()) { setErro('Escreva algo antes de guardar. 🥚'); return }
    const proximo = n + 1 <= 12 ? n + 1 : 12
    const ok = window.confirm(
      `Guardar sua reflexão do Dia ${n} no ninho?\n\n` +
      `Depois de guardar, este dia fica como memória: você poderá reler sempre que quiser, ` +
      `mas não poderá mais mudar o texto. E o Dia ${proximo} se abre para você.`
    )
    if (!ok) return

    setSalvando(true); setErro('')
    try {
      await guardarReflexao(n, texto)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="painel ativa container" style={{ '--cor-fase': f.cor, '--cor-fase-bg': f.bg }}>
      <button className="link-texto" onClick={aoVoltar} style={{ marginBottom: 20 }}>
        ← Voltar para os 12 dias
      </button>

      <div className="dia-detalhe">
        <div className="emoji-grande">{d.emoji}</div>
        <span className="fase-badge">{f.nome} · Dia {d.n}</span>
        <h2>{d.titulo}</h2>

        <div className="bloco">
          <div className="rotulo">O que a gente vê hoje</div>
          <p>{d.tema}</p>
        </div>

        <div className="bloco indez">
          <div className="rotulo">Plante seu indez</div>
          <p>{d.indez}</p>
        </div>

        {est === 'feito' ? (
          <div className="bloco">
            <div className="rotulo">O que você escreveu</div>
            <div className="reflexao-guardada">{reflexoes[n]}</div>
            <div className="nota-guardada">
              🥚 Guardado no seu ninho. Este dia já chocou — agora ele é memória.
            </div>
          </div>
        ) : (
          <div className="bloco">
            <div className="rotulo">Sua reflexão</div>
            <textarea
              className="reflexao"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva aqui, do seu jeito, sem pressa…"
              maxLength={5000}
            />
            {erro && <div className="erro-msg" role="alert">{erro}</div>}
          </div>
        )}

        <div className="dia-acoes">
          {est !== 'feito' && (
            <button className="btn btn-ouro" onClick={guardar} disabled={salvando}>
              {salvando ? 'Guardando…' : 'Salvar reflexão'}
            </button>
          )}
          <button className="btn btn-linha" onClick={() => aoConversar(n)}>
            Conversar com o Indez sobre este dia
          </button>
        </div>
      </div>
    </div>
  )
}
