import { useState } from 'react'
import { useNinho } from '../lib/NinhoContext'
import { criarLinkPagamento } from '../lib/pagamento'
import { sair } from '../lib/auth'
import { LogoIndoze } from '../components/LogoIndoze'

/** Cadastro sozinho não abre o ninho — falta garantir o acesso. */
export default function Pagamento() {
  const { recarregar } = useNinho()
  const [indo, setIndo] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function aoClicarPagar() {
    setErro(''); setIndo(true)
    try {
      const { url, jaPago } = await criarLinkPagamento()
      if (jaPago) { await recarregar(); return }
      window.location.href = url
    } catch (err) {
      setErro(err.message)
      setIndo(false)
    }
  }

  async function aoClicarJaPaguei() {
    setErro(''); setAviso(''); setVerificando(true)
    try {
      await recarregar()
      setAviso('Ainda não encontramos seu pagamento. Se você acabou de pagar, espere um instante e tente de novo.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="tela-auth">
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <LogoIndoze variante="topo" />
        </div>
        <h2>Falta um passo para entrar</h2>
        <p style={{ marginBottom: 20, color: 'var(--tinta-suave)' }}>
          Seu cadastro está pronto. Para abrir o ninho, garanta seu acesso com o pagamento.
        </p>

        {erro && <div className="erro-msg" role="alert">{erro}</div>}
        {aviso && <div className="aviso-msg" role="status">{aviso}</div>}

        <button className="btn btn-ouro" style={{ width: '100%' }} onClick={aoClicarPagar} disabled={indo}>
          {indo ? 'Abrindo pagamento…' : 'Pagar agora'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" className="link-texto" onClick={aoClicarJaPaguei} disabled={verificando}>
            {verificando ? 'Verificando…' : 'Já paguei, verificar'}
          </button>
          <button type="button" className="link-texto" onClick={sair}>Sair</button>
        </div>
      </div>
    </div>
  )
}
