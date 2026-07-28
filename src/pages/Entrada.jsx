import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogoIndoze } from '../components/LogoIndoze'
import ModalOrigem from '../components/ModalOrigem'

export default function Entrada() {
  const navegar = useNavigate()
  const [origemAberta, setOrigemAberta] = useState(false)

  return (
    <section id="tela-entrada" className="tela ativa">
      <div className="hero-titulo">
        <LogoIndoze />

        <div className="entrada-acoes">
          <button className="btn btn-linha" onClick={() => setOrigemAberta(true)}>
            Como o INDOZE nasceu
          </button>
          <button className="btn btn-ouro" onClick={() => navegar('/entrar')}>
            Entrar no ninho
          </button>
        </div>

        <div className="assinatura-marca">
          <span className="assinatura-rotulo">uma criação</span>
          <img src="/logo-bt-marinho.webp" className="logo-bt" alt="Better Together" />
        </div>
      </div>

      {origemAberta && <ModalOrigem aoFechar={() => setOrigemAberta(false)} />}
    </section>
  )
}
