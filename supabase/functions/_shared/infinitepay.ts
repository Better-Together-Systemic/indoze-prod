// Camada comum de acesso à InfinitePay, usada pelas três funções de pagamento
// (infinitepay-criar-link, infinitepay-confirmar, infinitepay-webhook).
//
// Handle não é segredo: já aparece na URL pública do checkout
// (checkout.infinitepay.io/<handle>/...). O que É segredo é o preço —
// isso fica só na variável de ambiente INFINITEPAY_PRECO_CENTAVOS, para
// ninguém no navegador conseguir forjar um valor menor.

export const INFINITEPAY_HANDLE = 'bettertogethersystemic'

export function precoCentavos(): number {
  const valor = Number(Deno.env.get('INFINITEPAY_PRECO_CENTAVOS'))
  if (!Number.isInteger(valor) || valor <= 0) {
    throw new Error(
      'Falta configurar INFINITEPAY_PRECO_CENTAVOS (o preço do acesso, em centavos) ' +
      'nas variáveis de ambiente desta Edge Function.'
    )
  }
  return valor
}

export function descricaoProduto(): string {
  return Deno.env.get('INFINITEPAY_DESCRICAO') || 'Acesso à jornada INDOZE'
}

type RespostaLink = {
  url?: string
  checkout_url?: string
  link?: string
  payment_url?: string
  [chave: string]: unknown
}

/**
 * Cria um link de checkout único para este pedido (order_nsu = id da pessoa).
 * Não precisa de autenticação: quem identifica o recebedor é o `handle`.
 */
export async function criarLinkCheckout(opts: {
  orderNsu: string
  redirectUrl: string
  webhookUrl: string
  nome?: string
  email?: string
}): Promise<string> {
  const resposta = await fetch('https://api.checkout.infinitepay.io/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      handle: INFINITEPAY_HANDLE,
      order_nsu: opts.orderNsu,
      redirect_url: opts.redirectUrl,
      webhook_url: opts.webhookUrl,
      items: [
        { quantity: 1, price: precoCentavos(), description: descricaoProduto() },
      ],
      customer: {
        name: opts.nome || undefined,
        email: opts.email || undefined,
      },
    }),
  })

  const dados: RespostaLink = await resposta.json().catch(() => ({}))

  if (!resposta.ok) {
    console.error('InfinitePay /links recusou o pedido:', resposta.status, dados)
    throw new Error('A InfinitePay recusou a criação do link de pagamento.')
  }

  const url = dados.url || dados.checkout_url || dados.link || dados.payment_url
  if (!url) {
    // A resposta não documenta oficialmente o nome do campo — logamos tudo
    // para dar pra corrigir rápido caso a InfinitePay mude o formato.
    console.error('InfinitePay /links devolveu formato inesperado:', dados)
    throw new Error('A InfinitePay não devolveu o link de pagamento.')
  }
  return url
}

type RespostaPaymentCheck = {
  success?: boolean
  paid?: boolean
  amount?: number
  paid_amount?: number
  installments?: number
  capture_method?: string
}

/**
 * Confere com a própria InfinitePay se um pagamento foi realmente aprovado.
 * Usado tanto no webhook quanto na confirmação pelo navegador — nunca
 * confiamos só no que chega de fora sem essa segunda checagem.
 */
export async function confirmarPagamentoNaInfinitePay(opts: {
  orderNsu: string
  transactionNsu: string
  slug: string
}): Promise<RespostaPaymentCheck> {
  const resposta = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      handle: INFINITEPAY_HANDLE,
      order_nsu: opts.orderNsu,
      transaction_nsu: opts.transactionNsu,
      slug: opts.slug,
    }),
  })

  const dados: RespostaPaymentCheck = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    console.error('InfinitePay /payment_check falhou:', resposta.status, dados)
    throw new Error('Não consegui confirmar o pagamento com a InfinitePay.')
  }
  return dados
}

/** true só quando a InfinitePay confirma pago E o valor pago cobre o preço combinado. */
export function pagamentoValido(check: RespostaPaymentCheck): boolean {
  if (!check.paid) return false
  const pago = check.paid_amount ?? 0
  return pago >= precoCentavos()
}
