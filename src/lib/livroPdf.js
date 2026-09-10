import { jsPDF } from 'jspdf'
import { DIAS } from '../data/conteudo'

/**
 * O jornal que nasce dos 12 dias.
 *
 * Cada matéria é construída só a partir do que a pessoa escreveu — sem os
 * textos fixos do app (título do dia, tema, pergunta do Indez). As 12
 * páginas circulam por 4 moldes de jornal (manchete, reportagem, carta do
 * leitor, quadro/classificados) pra não parecer um relatório escolar. Se
 * uma resposta for longa, a matéria continua na página seguinte — como em
 * qualquer jornal de verdade.
 * Mexer no layout aqui muda o jornal de todo mundo — mexer com cuidado.
 */

const corHex = (h) => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const MARINHO = corHex('#0d1b3e')
const DOURADO = corHex('#c8952a')
const AREIA = corHex('#f2ead6')
const PAPEL = corHex('#faf5e9')
const TINTA = corHex('#1a1a1a')
const TINTASU = corHex('#4a4a4a')
const CIANO = corHex('#22d3ee')
const VERMELHO = corHex('#b3341f')

const CORFASE = {
  mente: corHex('#d64545'),
  sistema: corHex('#2e7d32'),
  corpo: corHex('#1565c0'),
  manifesto: corHex('#c8952a'),
}

const INSTAGRAM_URL = 'https://instagram.com/elianesimoescruz'
const WHATSAPP_URL = 'https://wa.me/13214294517'

const NOME_JORNAL = 'JORNAL BETTER TOGETHER SYSTEMIC'
const SUBTITULO_JORNAL = '12 dias dentro do ninho, uma ideia sendo transformada'

// Cada um dos 12 dias circula por um molde de jornal diferente, escolhido
// pelo clima do dia — pra parecer edição de verdade, não lista escolar.
const PLANO = [
  { secao: 'MANCHETE', molde: 'manchete' },
  { secao: 'REPORTAGEM ESPECIAL', molde: 'reportagem' },
  { secao: 'CARTA DO LEITOR', molde: 'carta' },
  { secao: 'REPORTAGEM ESPECIAL', molde: 'reportagem' },
  { secao: 'REPORTAGEM ESPECIAL', molde: 'reportagem' },
  { secao: 'CARTA DO LEITOR', molde: 'carta' },
  { secao: 'CLASSIFICADOS', molde: 'moldura' },
  { secao: 'BOLETIM', molde: 'moldura' },
  { secao: 'REPORTAGEM ESPECIAL', molde: 'reportagem' },
  { secao: 'CLASSIFICADOS', molde: 'moldura' },
  { secao: 'BOLETIM', molde: 'moldura' },
  { secao: 'ÚLTIMA HORA', molde: 'manchete' },
]

/**
 * Busca uma imagem da pasta public e devolve como PNG em base64.
 *
 * Redesenha em canvas em vez de só ler os bytes: o WEBP com transparência
 * (as logos) fica preto e corrompido se embutido cru no PDF — o jsPDF não
 * lida bem com o alfa do WEBP. Passando por canvas, o navegador decodifica
 * o WEBP de verdade e o PNG de saída carrega a transparência do jeito certo.
 */
async function carregarImagem(caminho) {
  try {
    const r = await fetch(caminho)
    if (!r.ok) return null
    const blob = await r.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d').drawImage(bitmap, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/** Transforma o texto da pessoa numa manchete (a primeira frase/trecho) + o resto do corpo. */
function extrairManchete(textoBruto) {
  const t = (textoBruto ?? '').trim()
  if (!t) return { manchete: 'Este espaço ainda está em branco.', corpo: '' }
  if (t.length <= 92) return { manchete: t, corpo: '' }
  const trecho = t.slice(0, 150)
  const fimDeFrase = trecho.match(/^(.{20,120}?[.!?])(\s|$)/)
  if (fimDeFrase) {
    const manchete = fimDeFrase[1].trim()
    return { manchete, corpo: t.slice(manchete.length).trim() }
  }
  // sem ponto final por perto: prefere cortar numa vírgula (pausa natural)
  const limite = 100
  const janela = t.slice(0, limite)
  const ultimaVirgula = janela.lastIndexOf(',')
  let corte
  if (ultimaVirgula >= 40) {
    corte = ultimaVirgula + 1
  } else {
    corte = t.length > limite ? t.lastIndexOf(' ', limite) : t.length
    if (corte < 40) corte = Math.min(limite, t.length)
  }
  return { manchete: t.slice(0, corte).trim(), corpo: t.slice(corte).trim() }
}

export async function gerarLivroPDF({ nome, reflexoes }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const CX = PW / 2
  const MARGEM = 44
  const LARG_CONTEUDO = PW - MARGEM * 2
  const GUTTER = 26
  const LARG_COL = (LARG_CONTEUDO - GUTTER) / 2
  const COL_X = [MARGEM, MARGEM + LARG_COL + GUTTER]
  const LIMITE_Y = PH - 70

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const fundo = () => { doc.setFillColor(...PAPEL); doc.rect(0, 0, PW, PH, 'F') }

  const linkAlinhado = (texto, xRef, y, url, alinhamento = 'left') => {
    const w = doc.getTextWidth(texto)
    const x = alinhamento === 'right' ? xRef - w : alinhamento === 'center' ? xRef - w / 2 : xRef
    doc.textWithLink(texto, x, y, { url })
  }

  const [logoMarinho, logoAreia, ...ilustracoes] = await Promise.all([
    carregarImagem('/logo-bt-marinho.webp'),
    carregarImagem('/logo-bt-areia.webp'),
    ...DIAS.map((d) => carregarImagem(`/ilustracoes/${d.img}.webp`)),
  ])

  /** Cabeçalho fino repetido no alto de cada página — número de página real, não "dia N". */
  const mastheadMini = () => {
    doc.setDrawColor(...MARINHO); doc.setLineWidth(1.2)
    doc.line(MARGEM, 32, PW - MARGEM, 32)
    doc.setDrawColor(...DOURADO); doc.setLineWidth(0.5)
    doc.line(MARGEM, 35, PW - MARGEM, 35)
    let xTexto = MARGEM
    if (logoMarinho) {
      try { doc.addImage(logoMarinho, 'PNG', MARGEM, 12, 34, 12.5); xTexto = MARGEM + 42 } catch { /* segue sem o logo */ }
    }
    doc.setFont('times', 'bolditalic'); doc.setFontSize(9.5); doc.setTextColor(...MARINHO)
    doc.text(NOME_JORNAL, xTexto, 25)
    doc.setFont('times', 'italic'); doc.setFontSize(8); doc.setTextColor(...TINTASU)
    doc.text(`Página ${doc.internal.getNumberOfPages()} · ${hoje}`, PW - MARGEM, 25, { align: 'right' })
  }

  /** Rodapé com crédito e contatos da Eliane — em toda página. */
  const rodape = (cf) => {
    doc.setDrawColor(...cf); doc.setLineWidth(0.6)
    doc.line(MARGEM, PH - 54, PW - MARGEM, PH - 54)
    doc.setFont('times', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...TINTASU)
    doc.text('Eliane Simões Cruz · Indez Terapia · Better Together Systemic', MARGEM, PH - 38)
    doc.setFont('times', 'normal'); doc.setFontSize(8)
    doc.setTextColor(...MARINHO)
    linkAlinhado('Instagram: @elianesimoescruz', CX, PH - 38, INSTAGRAM_URL, 'center')
    doc.setTextColor(...DOURADO)
    linkAlinhado('WhatsApp — Fale com a Eli', PW - MARGEM, PH - 38, WHATSAPP_URL, 'right')
  }

  /** Fluxo de texto com 1 ou 2 colunas: se não couber, a matéria continua na próxima página. */
  const criarFluxo = ({ colunas, xs, yInicial, cf, tituloContinuacao }) => {
    const estado = { col: 0, y: yInicial, topo: yInicial }
    const continuar = () => {
      rodape(cf)
      doc.addPage(); fundo()
      mastheadMini()
      doc.setFont('times', 'italic'); doc.setFontSize(10); doc.setTextColor(...cf)
      doc.text(`${tituloContinuacao}… (continuação)`, MARGEM, 54)
      doc.setDrawColor(...TINTASU); doc.setLineWidth(0.5)
      doc.line(MARGEM, 60, PW - MARGEM, 60)
      return 78
    }
    const garantirEspaco = (altura) => {
      if (estado.y + altura <= LIMITE_Y) return
      if (colunas === 2 && estado.col === 0) {
        estado.col = 1
        estado.y = estado.topo
        if (estado.y + altura <= LIMITE_Y) return
      }
      const novoTopo = continuar()
      estado.col = 0
      estado.topo = novoTopo
      estado.y = novoTopo
    }
    return { estado, garantirEspaco, x: () => xs[estado.col] }
  }

  const escreverParagrafo = (fluxo, largura, texto, opts = {}) => {
    const { estilo = 'normal', tamanho = 11, cor = TINTA, altura = 15, espacoDepois = 10 } = opts
    doc.setFont('times', estilo); doc.setFontSize(tamanho)
    const linhas = doc.splitTextToSize(texto, largura)
    linhas.forEach((linha) => {
      fluxo.garantirEspaco(altura)
      doc.setTextColor(...cor)
      doc.text(linha, fluxo.x(), fluxo.estado.y)
      fluxo.estado.y += altura
    })
    fluxo.estado.y += espacoDepois
  }

  /** Abertura de matéria com letra capitular — reservada pro molde de reportagem. */
  const escreverLetraCapitular = (fluxo, largura, texto, cf) => {
    const alturaLinha = 15
    const tamCap = 28
    fluxo.garantirEspaco(alturaLinha * 2)
    const x = fluxo.x()
    const yBase = fluxo.estado.y
    const cap = texto.charAt(0)
    doc.setFont('times', 'bold'); doc.setFontSize(tamCap); doc.setTextColor(...cf)
    doc.text(cap, x, yBase + 23)
    const wCap = doc.getTextWidth(cap) + 5

    doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(...TINTA)
    const resto = texto.slice(1).trimStart()
    const linhasEstreitas = doc.splitTextToSize(resto, largura - wCap)
    const nEstreitas = Math.min(2, linhasEstreitas.length)
    for (let i = 0; i < nEstreitas; i++) doc.text(linhasEstreitas[i], x + wCap, yBase + 14 + i * alturaLinha)
    fluxo.estado.y = yBase + 14 + nEstreitas * alturaLinha

    const consumido = linhasEstreitas.slice(0, nEstreitas).join(' ')
    const restante = resto.slice(consumido.length).trimStart()
    fluxo.estado.y += 10
    if (restante) escreverParagrafo(fluxo, largura, restante, { espacoDepois: 12 })
  }

  /* ------------------------------ moldes de matéria ------------------------------ */

  const layoutManchete = (plano, cf, texto, img, ultimaHora) => {
    doc.addPage(); fundo()
    mastheadMini()
    let yy = 56
    if (ultimaHora) {
      doc.setFillColor(...VERMELHO); doc.rect(MARGEM, yy, 112, 18, 'F')
      doc.setFont('times', 'bold'); doc.setFontSize(10); doc.setTextColor(...AREIA)
      doc.text('ÚLTIMA HORA', MARGEM + 56, yy + 13, { align: 'center' })
      yy += 32
    } else {
      doc.setFont('times', 'bold'); doc.setFontSize(9); doc.setTextColor(...cf)
      doc.text(plano.secao, MARGEM, yy)
      doc.setDrawColor(...cf); doc.setLineWidth(2); doc.line(MARGEM, yy + 6, MARGEM + 70, yy + 6)
      yy += 26
    }

    const { manchete, corpo } = extrairManchete(texto)
    doc.setFont('times', 'bold'); doc.setFontSize(29); doc.setTextColor(...MARINHO)
    const linhasM = doc.splitTextToSize(manchete, LARG_CONTEUDO)
    doc.text(linhasM, MARGEM, yy + 27)
    yy += 27 + linhasM.length * 32 + 14

    if (img) {
      const larg = LARG_CONTEUDO
      const alt = larg * (corpo ? 0.4 : 0.6)
      try { doc.addImage(img, 'PNG', MARGEM, yy, larg, alt); yy += alt + 20 } catch { yy += 6 }
    }

    if (corpo) {
      const fluxo = criarFluxo({ colunas: 1, xs: [MARGEM], yInicial: yy, cf, tituloContinuacao: manchete.slice(0, 40) })
      escreverParagrafo(fluxo, LARG_CONTEUDO, corpo, { tamanho: 12.5, altura: 17 })
    }
    rodape(cf)
  }

  const layoutReportagem = (plano, cf, texto, img) => {
    doc.addPage(); fundo()
    mastheadMini()
    let yy = 56
    doc.setFont('times', 'bold'); doc.setFontSize(9); doc.setTextColor(...cf)
    doc.text(plano.secao, MARGEM, yy)
    doc.setDrawColor(...cf); doc.setLineWidth(2); doc.line(MARGEM, yy + 6, MARGEM + 70, yy + 6)
    yy += 26

    const { manchete, corpo } = extrairManchete(texto)
    doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(...MARINHO)
    const linhasM = doc.splitTextToSize(manchete, LARG_CONTEUDO)
    doc.text(linhasM, MARGEM, yy + 22)
    yy += 22 + linhasM.length * 26 + 12
    doc.setDrawColor(...TINTASU); doc.setLineWidth(0.5); doc.line(MARGEM, yy, PW - MARGEM, yy)
    yy += 18

    if (img) {
      const larg = LARG_CONTEUDO
      const alt = larg * (corpo ? 0.32 : 0.56)
      try { doc.addImage(img, 'PNG', MARGEM, yy, larg, alt); yy += alt + 18 } catch { yy += 6 }
    }

    if (corpo) {
      const fluxo = criarFluxo({ colunas: 2, xs: COL_X, yInicial: yy, cf, tituloContinuacao: manchete.slice(0, 40) })
      escreverLetraCapitular(fluxo, LARG_COL, corpo, cf)
    }
    rodape(cf)
  }

  const layoutCarta = (plano, cf, texto, img) => {
    doc.addPage(); fundo()
    mastheadMini()
    const inset = 34
    const larguraCarta = LARG_CONTEUDO - inset * 2
    let yy = 60
    doc.setDrawColor(...cf); doc.setLineWidth(1)
    doc.line(MARGEM + inset, yy, PW - MARGEM - inset, yy)
    yy += 20
    doc.setFont('times', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...cf)
    doc.text(plano.secao, CX, yy, { align: 'center' })
    yy += 26

    const { manchete, corpo } = extrairManchete(texto)
    doc.setFont('times', 'bolditalic'); doc.setFontSize(18); doc.setTextColor(...MARINHO)
    const linhasM = doc.splitTextToSize(manchete, larguraCarta)
    doc.text(linhasM, CX, yy, { align: 'center' })
    yy += linhasM.length * 23 + 16

    if (img) {
      const larg = corpo ? 170 : 240; const alt = corpo ? 120 : 170
      try { doc.addImage(img, 'PNG', CX - larg / 2, yy, larg, alt); yy += alt + 18 } catch { yy += 6 }
    }

    if (corpo) {
      const fluxo = criarFluxo({ colunas: 1, xs: [MARGEM + inset], yInicial: yy, cf, tituloContinuacao: manchete.slice(0, 40) })
      escreverParagrafo(fluxo, larguraCarta, corpo, { estilo: 'italic', tamanho: 12.5, altura: 18 })
    }
    rodape(cf)
  }

  const layoutMoldura = (plano, cf, texto, img) => {
    doc.addPage(); fundo()
    mastheadMini()
    const yTopoBox = 56
    const inset = 28
    const larguraBox = LARG_CONTEUDO - inset * 2
    let yy = yTopoBox + 34
    doc.setFont('times', 'bold'); doc.setFontSize(11); doc.setTextColor(...cf)
    doc.text(plano.secao, CX, yy, { align: 'center' })
    yy += 8
    doc.setDrawColor(...cf); doc.setLineWidth(0.6)
    doc.line(CX - 60, yy, CX + 60, yy)
    yy += 24

    const { manchete, corpo } = extrairManchete(texto)
    doc.setFont('times', 'bold'); doc.setFontSize(16); doc.setTextColor(...MARINHO)
    const linhasM = doc.splitTextToSize(manchete, larguraBox)
    doc.text(linhasM, CX, yy, { align: 'center' })
    yy += linhasM.length * 21 + 14

    if (img) {
      const larg = 140; const alt = 98
      try { doc.addImage(img, 'PNG', CX - larg / 2, yy, larg, alt); yy += alt + 16 } catch { yy += 6 }
    }

    // Molde pensado pra texto curto: se a resposta for pequena, a moldura
    // abraça só o conteúdo (como um anúncio de verdade); se for longa,
    // a moldura cobre a página toda e o texto continua com segurança.
    const yFundoBox = corpo ? LIMITE_Y : Math.min(yy + 14, LIMITE_Y)
    doc.setDrawColor(...cf); doc.setLineWidth(1.4)
    doc.roundedRect(MARGEM, yTopoBox, LARG_CONTEUDO, yFundoBox - yTopoBox, 10, 10, 'S')

    if (corpo) {
      const fluxo = criarFluxo({ colunas: 1, xs: [MARGEM + inset], yInicial: yy, cf, tituloContinuacao: manchete.slice(0, 40) })
      escreverParagrafo(fluxo, larguraBox, corpo, { tamanho: 10.5, altura: 14.5 })
    }
    rodape(cf)
  }

  /* ============================ CAPA (frente do jornal) ============================ */
  fundo()
  doc.setFillColor(...MARINHO); doc.rect(0, 0, PW, 150, 'F')
  if (logoAreia) { try { doc.addImage(logoAreia, 'PNG', MARGEM, 26, 92, 34) } catch { /* segue sem o logo */ } }
  doc.setFont('times', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...CIANO)
  doc.text(`Ano I · Nº 1 · ${hoje}`, PW - MARGEM, 40, { align: 'right' })

  doc.setFont('times', 'bold'); doc.setFontSize(28); doc.setTextColor(...AREIA)
  const linhasNome = doc.splitTextToSize(NOME_JORNAL, LARG_CONTEUDO - 20)
  doc.text(linhasNome, CX, 95, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(12); doc.setTextColor(...DOURADO)
  doc.text(SUBTITULO_JORNAL, CX, 95 + linhasNome.length * 25, { align: 'center' })

  doc.setFillColor(...AREIA); doc.rect(0, 150, PW, 24, 'F')
  doc.setFont('times', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MARINHO)
  doc.text('Edição Especial · Doze Matérias, Doze Dias', CX, 166, { align: 'center' })

  let y = 205
  const primeiraManchete = extrairManchete((reflexoes?.[DIAS[0].n] ?? '').trim())
  doc.setFont('times', 'bold'); doc.setFontSize(24); doc.setTextColor(...MARINHO)
  const linhasManchetePrincipal = doc.splitTextToSize(`“${primeiraManchete.manchete}”`, LARG_CONTEUDO - 40)
  doc.text(linhasManchetePrincipal, CX, y, { align: 'center' })
  y += linhasManchetePrincipal.length * 29 + 10

  doc.setDrawColor(...DOURADO); doc.setLineWidth(1); doc.line(MARGEM, y, PW - MARGEM, y)
  y += 24

  doc.setFont('times', 'bold'); doc.setFontSize(11); doc.setTextColor(...MARINHO)
  doc.text('NESTA EDIÇÃO', MARGEM, y)
  y += 20

  const colIndiceW = LARG_CONTEUDO / 2 - 16
  DIAS.forEach((d, i) => {
    const col = i % 2
    const linha = Math.floor(i / 2)
    const xx = MARGEM + col * (colIndiceW + 32)
    const yy = y + linha * 42
    const texto = (reflexoes?.[d.n] ?? '').trim()
    const { manchete } = extrairManchete(texto)
    const cf = CORFASE[d.fase]
    doc.setFillColor(...cf); doc.circle(xx + 3, yy - 3, 3, 'F')
    doc.setFont('times', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...cf)
    doc.text(PLANO[i].secao, xx + 13, yy)
    doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(...TINTA)
    const linhasTrecho = doc.splitTextToSize(manchete, colIndiceW - 13)
    doc.text(linhasTrecho.slice(0, 2), xx + 13, yy + 12)
  })
  y += Math.ceil(DIAS.length / 2) * 42 + 14

  const altoBoxContato = 74
  doc.setFillColor(...MARINHO); doc.roundedRect(MARGEM, y, LARG_CONTEUDO, altoBoxContato, 8, 8, 'F')
  doc.setFont('times', 'bold'); doc.setFontSize(12); doc.setTextColor(...DOURADO)
  doc.text('Eliane Simões Cruz', MARGEM + 20, y + 27)
  doc.setFont('times', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...AREIA)
  doc.text('Criadora Certificada · Indez Terapia', MARGEM + 20, y + 45)
  doc.setFont('times', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...CIANO)
  linkAlinhado('Instagram: @elianesimoescruz', PW - MARGEM - 20, y + 27, INSTAGRAM_URL, 'right')
  doc.setTextColor(...DOURADO)
  linkAlinhado('WhatsApp — Fale com a Eli', PW - MARGEM - 20, y + 45, WHATSAPP_URL, 'right')

  /* ============================= MATÉRIAS (uma por dia) ============================= */
  DIAS.forEach((d, idx) => {
    const plano = PLANO[idx]
    const cf = CORFASE[d.fase]
    const texto = (reflexoes?.[d.n] ?? '').trim()
    const img = ilustracoes[idx]

    if (plano.molde === 'manchete') layoutManchete(plano, cf, texto, img, plano.secao === 'ÚLTIMA HORA')
    else if (plano.molde === 'reportagem') layoutReportagem(plano, cf, texto, img)
    else if (plano.molde === 'carta') layoutCarta(plano, cf, texto, img)
    else layoutMoldura(plano, cf, texto, img)
  })

  /* ================================= CONTRACAPA ================================= */
  doc.addPage()
  doc.setFillColor(...MARINHO); doc.rect(0, 0, PW, PH, 'F')
  doc.setDrawColor(...DOURADO); doc.setLineWidth(1.5)
  ;[[150, 70], [112, 50], [75, 34]].forEach(([rx, ry]) => doc.ellipse(CX, 210, rx, ry, 'S'))
  doc.setFillColor(127, 227, 240); doc.ellipse(CX, 195, 40, 54, 'F')

  doc.setFont('times', 'bolditalic'); doc.setFontSize(23); doc.setTextColor(...AREIA)
  doc.text('Esta edição fica sempre aberta.', CX, 320, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(13); doc.setTextColor(...CIANO)
  doc.text('Você pode voltar a qualquer momento.', CX, 346, { align: 'center' })
  doc.setDrawColor(...DOURADO); doc.line(CX - 90, 374, CX + 90, 374)

  doc.setFont('times', 'bold'); doc.setFontSize(18); doc.setTextColor(227, 184, 98)
  doc.text('Indez Terapia', CX, 410, { align: 'center' })
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(...AREIA)
  doc.text('Eliane Simões Cruz', CX, 431, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(10); doc.setTextColor(159, 179, 200)
  doc.text('Edição encerrada em ' + hoje, CX, 450, { align: 'center' })

  const boxY = 480
  doc.setDrawColor(...DOURADO); doc.setLineWidth(1)
  doc.roundedRect(CX - 150, boxY, 300, 84, 8, 8, 'S')
  doc.setFont('times', 'bold'); doc.setFontSize(11); doc.setTextColor(...DOURADO)
  doc.text('Continue essa conversa com a Eli', CX, boxY + 24, { align: 'center' })
  doc.setFont('times', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...AREIA)
  linkAlinhado('Instagram: @elianesimoescruz', CX, boxY + 46, INSTAGRAM_URL, 'center')
  doc.setTextColor(...CIANO)
  linkAlinhado('WhatsApp — Fale com a Eli', CX, boxY + 66, WHATSAPP_URL, 'center')

  if (logoAreia) { try { doc.addImage(logoAreia, 'PNG', CX - 76, PH - 110, 152, 55) } catch { /* segue */ } }

  doc.save('INDOZE_jornal_dos_12_dias.pdf')
}
