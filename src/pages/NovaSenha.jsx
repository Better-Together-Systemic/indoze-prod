import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { definirNovaSenha, forcaDaSenha } from '../lib/auth'

const CORES = ['#e8dcc0', '#d64545', '#e08a2e', '#c8952a', '#2e7d32']

export default function NovaSenha() {
  const navegar = useNavigate()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const forca = forcaDaSenha(senha)

  async function aoEnviar(e) {
    e.preventDefault()
    setErro(''); setEnviando(true)
    try {
      await definirNovaSenha(senha)
      navegar('/ninho')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="tela-auth">
      <form className="modal" onSubmit={aoEnviar}>
        <h2>Uma senha nova</h2>
        <p style={{ marginBottom: 20, color: 'var(--tinta-suave)' }}>
          Escolha uma chave nova para o seu ninho.
        </p>
        <div className="campo">
          <label htmlFor="ns">Nova senha</label>
          <input id="ns" type="password" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password" required />
          <div className="forca"><span style={{ width: `${forca * 25}%`, background: CORES[forca] }} /></div>
          <ul className="requisitos">
            <li className={senha.length >= 8 ? 'ok' : ''}>pelo menos 8 letras</li>
            <li className={/[A-Z]/.test(senha) ? 'ok' : ''}>uma letra maiúscula</li>
            <li className={/[0-9]/.test(senha) ? 'ok' : ''}>um número</li>
            <li className={/[^A-Za-z0-9]/.test(senha) ? 'ok' : ''}>um símbolo (!@#$...)</li>
          </ul>
        </div>
        {erro && <div className="erro-msg" role="alert">{erro}</div>}
        <button className="btn btn-ouro" style={{ width: '100%' }} type="submit" disabled={forca < 4 || enviando}>
          {enviando ? 'Guardando…' : 'Guardar nova senha'}
        </button>
      </form>
    </div>
  )
}
