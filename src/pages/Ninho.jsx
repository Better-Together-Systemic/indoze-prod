import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNinho } from '../lib/NinhoContext'
import { sair } from '../lib/auth'
import { LogoIndoze } from '../components/LogoIndoze'
import Sala from '../components/Sala'
import DozeDias from '../components/DozeDias'
import ChatIndez from '../components/ChatIndez'
import MeuNinho from '../components/MeuNinho'
import Historias from '../components/Historias'

const ICONE = {
  sala: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  dias: (
    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  indez: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M4 6.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
  ),
  'meu-ninho': (
    <svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="10.5" rx="5.5" ry="7" stroke="currentColor" strokeWidth="1.8"/><path d="M4 18.5c2.5 1.7 13.5 1.7 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  historias: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v14l-6-2.5-6 2.5V7a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 9h4M9 12.3h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
}

const ABAS = [
  { id: 'sala', rotulo: 'A Sala' },
  { id: 'dias', rotulo: 'Os 12 Dias' },
  { id: 'indez', rotulo: 'O Indez' },
  { id: 'meu-ninho', rotulo: 'Meu Ninho' },
  { id: 'historias', rotulo: 'Histórias' },
]

export default function Ninho() {
  const { nome } = useNinho()
  const navegar = useNavigate()
  const [aba, setAba] = useState('sala')
  const [menuAberto, setMenuAberto] = useState(false)
  const [diaDaConversa, setDiaDaConversa] = useState(null)

  const primeiroNome = nome.split(' ')[0] || 'Amigo'
  const inicial = primeiroNome.charAt(0).toUpperCase()

  async function aoSair() {
    await sair()
    navegar('/')
  }

  /** Vem do card do dia: leva para o chat já falando daquele dia. */
  function conversarSobreDia(n) {
    setDiaDaConversa(n)
    setAba('indez')
  }

  function irPara(id) {
    setAba(id)
    setMenuAberto(false)
  }

  return (
    <section className="tela ativa app-ninho">
      <aside className="barra-lateral">
        <div className="marca-lateral">
          <img src="/logo-bt-areia.webp" className="logo-bt-topo" alt="Better Together" />
          <LogoIndoze variante="topo" />
        </div>

        <nav className="nav-lateral">
          {ABAS.map((a) => (
            <button
              key={a.id}
              className={`item-nav${aba === a.id ? ' ativo' : ''}`}
              onClick={() => irPara(a.id)}
            >
              {ICONE[a.id]}
              {a.rotulo}
            </button>
          ))}
        </nav>

        <div className="rodape-lateral">
          <button className="perfil-btn" onClick={() => setMenuAberto((v) => !v)}>
            <span className="avatar-perfil">{inicial}</span>
            <span className="nome-perfil">{primeiroNome}</span>
            <span className="seta-perfil">▾</span>
          </button>
          {menuAberto && (
            <div className="menu-perfil ativa">
              <button onClick={aoSair}>Sair do ninho</button>
            </div>
          )}
        </div>
      </aside>

      <header className="barra-movel">
        <LogoIndoze variante="topo" />
        <div style={{ position: 'relative' }}>
          <button className="perfil-btn" onClick={() => setMenuAberto((v) => !v)}>
            <span className="avatar-perfil">{inicial}</span>
          </button>
          {menuAberto && (
            <div className="menu-perfil ativa" style={{ left: 'auto', right: 0, bottom: 'auto', top: 'calc(100% + 8px)' }}>
              <button onClick={aoSair}>Sair do ninho</button>
            </div>
          )}
        </div>
      </header>

      <main className="conteudo-principal">
        {aba === 'sala' && <Sala />}
        {aba === 'dias' && <DozeDias aoConversar={conversarSobreDia} />}
        {aba === 'indez' && <ChatIndez diaDaConversa={diaDaConversa} setDiaDaConversa={setDiaDaConversa} />}
        {aba === 'meu-ninho' && <MeuNinho />}
        {aba === 'historias' && <Historias />}
      </main>

      <nav className="abas-movel">
        {ABAS.map((a) => (
          <button
            key={a.id}
            className={`item-aba-movel${aba === a.id ? ' ativo' : ''}`}
            onClick={() => irPara(a.id)}
          >
            {ICONE[a.id]}
            {a.rotulo}
          </button>
        ))}
      </nav>
    </section>
  )
}
