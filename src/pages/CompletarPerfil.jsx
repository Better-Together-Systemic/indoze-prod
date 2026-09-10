import { useState } from 'react'
import { useNinho } from '../lib/NinhoContext'
import { definirWhatsapp } from '../lib/dados'
import { sair } from '../lib/auth'
import { LogoIndoze } from '../components/LogoIndoze'

/** Quem entra pelo Google não passa pelo formulário de cadastro — falta o WhatsApp. */
export default function CompletarPerfil() {
  const { recarregar } = useNinho()
  const [whatsapp, setWhatsapp] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e) {
    e.preventDefault()
    setErro(''); setEnviando(true)
    try {
      await definirWhatsapp(whatsapp)
      await recarregar()
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="tela-auth">
      <form className="modal" onSubmit={aoEnviar}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <LogoIndoze variante="topo" />
        </div>
        <h2>Só mais um passo</h2>
        <p style={{ marginBottom: 20, color: 'var(--tinta-suave)' }}>
          O Google não nos conta seu WhatsApp — e a gente usa ele pra te acompanhar na jornada.
        </p>

        <div className="campo">
          <label htmlFor="cp-whatsapp">WhatsApp</label>
          <input
            id="cp-whatsapp" type="tel" value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+55 11 91234-5678" autoComplete="tel" required
          />
        </div>

        {erro && <div className="erro-msg" role="alert">{erro}</div>}

        <button className="btn btn-ouro" style={{ width: '100%' }} type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Entrar no ninho'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button type="button" className="link-texto" onClick={sair}>Sair</button>
        </div>
      </form>
    </div>
  )
}
