import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { entrar, entrarComGoogle, pedirNovaSenha } from '../lib/auth'
import { LogoIndoze } from '../components/LogoIndoze'
import IconeGoogle from '../components/IconeGoogle'

export default function Login() {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [indoGoogle, setIndoGoogle] = useState(false)

  async function aoEnviar(e) {
    e.preventDefault()
    setErro(''); setAviso(''); setEnviando(true)
    try {
      await entrar({ email, senha })
      navegar('/ninho')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function aoClicarGoogle() {
    setErro(''); setIndoGoogle(true)
    try {
      await entrarComGoogle()
    } catch (err) {
      setErro(err.message)
      setIndoGoogle(false)
    }
  }

  async function esqueci() {
    if (!email.includes('@')) { setErro('Escreva seu e-mail primeiro.'); return }
    setErro(''); setEnviando(true)
    try {
      await pedirNovaSenha(email)
      setAviso('Enviamos um caminho de volta para o seu e-mail. Olhe a caixa de entrada.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="tela-auth">
      <form className="modal" onSubmit={aoEnviar}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <LogoIndoze variante="topo" />
        </div>
        <h2>Entrar no ninho</h2>

        <button type="button" className="btn-google" onClick={aoClicarGoogle} disabled={indoGoogle}>
          <IconeGoogle />
          {indoGoogle ? 'Levando você ao Google…' : 'Continuar com Google'}
        </button>

        <div className="divisor-ou"><span>ou entre com e-mail</span></div>

        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" autoComplete="email" required />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <input id="login-senha" type="password" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="sua senha" autoComplete="current-password" required />
        </div>

        {erro && <div className="erro-msg" role="alert">{erro}</div>}
        {aviso && <div className="aviso-msg" role="status">{aviso}</div>}

        <button className="btn btn-ouro" style={{ width: '100%' }} type="submit" disabled={enviando}>
          {enviando ? 'Abrindo…' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" className="link-texto" onClick={esqueci}>Esqueci minha senha</button>
          <Link className="link-texto" to="/criar-ninho">Ainda não tenho conta</Link>
        </div>
      </form>
    </div>
  )
}
