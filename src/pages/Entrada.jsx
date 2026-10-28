import { useNavigate } from 'react-router-dom'

export default function Entrada() {
  const navegar = useNavigate()

  return (
    <section id="tela-entrada" className="tela ativa">
      {/* A arte já traz o logo e o botão desenhados — o botão real fica por cima do "ENTRAR". */}
      <div className="entrada-arte">
        <img src="/entrada-fundo.webp" alt="INDOZE — um ovo dourado num ninho entre palmeiras" />
        <button className="entrada-botao" onClick={() => navegar('/entrar')} aria-label="Entrar" />
      </div>
    </section>
  )
}
