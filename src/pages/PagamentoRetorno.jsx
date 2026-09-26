import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNinho } from '../lib/NinhoContext'
import { confirmarPagamento } from '../lib/pagamento'
import { LogoIndoze } from '../components/LogoIndoze'

/** Para onde a InfinitePay traz a pessoa de volta depois do pagamento. */
export default function PagamentoRetorno() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const { recarregar } = useNinho()
  const [erro, setErro] = useState('')
  const jaTentou = useRef(false)

  useEffect(() => {
    if (jaTentou.current) return
    jaTentou.current = true

    const orderNsu = params.get('order_nsu')
    const transactionNsu = params.get('transaction_nsu')
    const slug = params.get('slug')
    const receiptUrl = params.get('receipt_url')

    if (!orderNsu || !transactionNsu || !slug) {
      setErro('Faltam dados do pagamento no retorno. Volte e tente "Já paguei, verificar".')
      return
    }

    ;(async () => {
      try {
        await confirmarPagamento({ orderNsu, transactionNsu, slug, receiptUrl })
        await recarregar()
        navegar('/ninho', { replace: true })
      } catch (err) {
        setErro(err.message)
      }
    })()
  }, [params, recarregar, navegar])

  return (
    <div className="tela-auth">
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <LogoIndoze variante="topo" />
        </div>
        <h2>Confirmando seu pagamento…</h2>
        {erro ? (
          <>
            <div className="erro-msg" role="alert">{erro}</div>
            <button className="btn btn-ouro" style={{ width: '100%', marginTop: 16 }} onClick={() => navegar('/ninho', { replace: true })}>
              Voltar
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--tinta-suave)' }}>Só mais um instante…</p>
        )}
      </div>
    </div>
  )
}
