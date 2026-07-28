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

  async function aoSair() {
    await sair()
    navegar('/')
  }

  /** Vem do card do dia: leva para o chat já falando daquele dia. */
  function conversarSobreDia(n) {
    setDiaDaConversa(n)
    setAba('indez')
  }

  return (
    <section className="tela ativa">
      <header className="topo">
        <div className="container">
          <div className="marca">
            <img src="/logo-bt-areia.webp" className="logo-bt-topo" alt="Better Together" />
            <LogoIndoze variante="topo" />
          </div>
          <button className="perfil-btn" onClick={() => setMenuAberto((v) => !v)}>
            <span>{nome.split(' ')[0] || 'Amigo'}</span> ▾
          </button>
        </div>
      </header>

      {menuAberto && (
        <div className="menu-perfil ativa">
          <button onClick={aoSair}>Sair do ninho</button>
        </div>
      )}

      <nav className="abas">
        {ABAS.map((a) => (
          <button
            key={a.id}
            className={`aba${aba === a.id ? ' ativa' : ''}`}
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>

      {aba === 'sala' && <Sala />}
      {aba === 'dias' && <DozeDias aoConversar={conversarSobreDia} />}
      {aba === 'indez' && <ChatIndez diaDaConversa={diaDaConversa} setDiaDaConversa={setDiaDaConversa} />}
      {aba === 'meu-ninho' && <MeuNinho />}
      {aba === 'historias' && <Historias />}
    </section>
  )
}
