import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { cadastrar, forcaDaSenha, validarEmail, validarWhatsapp } from '../lib/auth'
import { detectarGenero } from '../lib/linguagem'
import { LogoIndoze } from '../components/LogoIndoze'

const CORES_FORCA = ['#e8dcc0', '#d64545', '#e08a2e', '#c8952a', '#2e7d32']

export default function Cadastro() {
  const navegar = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [senha, setSenha] = useState('')
  const [genero, setGenero] = useState('n')
  const [escolheuGenero, setEscolheuGenero] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [emailTocado, setEmailTocado] = useState(false)
  const [whatsappTocado, setWhatsappTocado] = useState(false)

  // Palpite educado pelo nome — mas quem manda é a pessoa.
  useEffect(() => {
    if (!escolheuGenero) setGenero(detectarGenero(nome))
  }, [nome, escolheuGenero])

  const forca = forcaDaSenha(senha)
  const podeCriar =
    nome.trim() &&
    !validarEmail(email) &&
    !validarWhatsapp(whatsapp) &&
    forca === 4 &&
    !enviando

  async function aoEnviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await cadastrar({ nome, email, senha, whatsapp, instagram, genero })
      setPronto(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (pronto) {
    return (
      <div className="tela-auth">
        <div className="modal">
          <div style={{ fontSize: 52, textAlign: 'center' }}>🥚</div>
          <h2>Seu ninho está quase pronto</h2>
          <p>
            Mandamos um e-mail para <strong>{email}</strong>. Abra e confirme — é como
            colocar a última palhinha no ninho. Depois disso, você entra.
          </p>
          <Link className="btn btn-ouro" style={{ width: '100%', textAlign: 'center', marginTop: 20 }} to="/entrar">
            Já confirmei, quero entrar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="tela-auth">
      <form className="modal" onSubmit={aoEnviar}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <LogoIndoze variante="topo" />
        </div>
        <h2>Faça seu ninho</h2>

        <div className="campo">
          <label htmlFor="cad-nome">Seu nome completo</label>
          <input
            id="cad-nome" type="text" value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você quer ser chamado(a)" autoComplete="name" required
          />
        </div>

        <div className="campo">
          <label>Como você quer que o ninho fale com você?</label>
          <div className="opcoes-genero">
            {[
              { g: 'f', titulo: 'No feminino', sub: 'incluída, acolhida' },
              { g: 'm', titulo: 'No masculino', sub: 'incluído, acolhido' },
              { g: 'n', titulo: 'Neutro', sub: 'sem gênero' },
            ].map((op) => (
              <button
                key={op.g} type="button"
                className={`op-genero${genero === op.g ? ' ativa' : ''}`}
                onClick={() => { setGenero(op.g); setEscolheuGenero(true) }}
                aria-pressed={genero === op.g}
              >
                {op.titulo}<br /><small>{op.sub}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="cad-email">E-mail</label>
          <input
            id="cad-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTocado(true)}
            placeholder="seu@email.com" autoComplete="email" required
          />
          {emailTocado && validarEmail(email) && (
            <div className="erro-msg" role="alert">{validarEmail(email)}</div>
          )}
        </div>

        <div className="campo">
          <label htmlFor="cad-whatsapp">WhatsApp</label>
          <input
            id="cad-whatsapp" type="tel" value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            onBlur={() => setWhatsappTocado(true)}
            placeholder="+55 11 91234-5678" autoComplete="tel" required
          />
          {whatsappTocado && validarWhatsapp(whatsapp) && (
            <div className="erro-msg" role="alert">{validarWhatsapp(whatsapp)}</div>
          )}
        </div>

        <div className="campo">
          <label htmlFor="cad-insta">
            Seu Instagram <span style={{ fontWeight: 400, color: 'var(--tinta-suave)' }}>(opcional)</span>
          </label>
          <div className="campo-insta">
            <span className="arroba">@</span>
            <input
              id="cad-insta" type="text" value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ''))}
              placeholder="seu_usuario" autoComplete="off"
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="cad-senha">Crie uma senha</label>
          <input
            id="cad-senha" type="password" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="uma senha forte" autoComplete="new-password" required
          />
          <div className="forca">
            <span style={{ width: `${forca * 25}%`, background: CORES_FORCA[forca] }} />
          </div>
          <ul className="requisitos">
            <li className={senha.length >= 8 ? 'ok' : ''}>pelo menos 8 letras</li>
            <li className={/[A-Z]/.test(senha) ? 'ok' : ''}>uma letra maiúscula</li>
            <li className={/[0-9]/.test(senha) ? 'ok' : ''}>um número</li>
            <li className={/[^A-Za-z0-9]/.test(senha) ? 'ok' : ''}>um símbolo (!@#$...)</li>
          </ul>
        </div>

        {erro && <div className="erro-msg" role="alert">{erro}</div>}

        <button className="btn btn-ouro" style={{ width: '100%' }} type="submit" disabled={!podeCriar}>
          {enviando ? 'Preparando seu ninho…' : 'Criar minha conta'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link className="link-texto" to="/entrar">Já tenho conta</Link>
        </div>
      </form>
    </div>
  )
}
