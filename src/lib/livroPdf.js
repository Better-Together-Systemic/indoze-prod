import { jsPDF } from 'jspdf'
import { DIAS } from '../data/conteudo'

/**
 * O livro que nasce dos 12 dias.
 *
 * Este é o formato aprovado pela Eliane: A4 vertical, capa, 12 páginas
 * (ilustração + o que a pessoa escreveu + a reflexão do ninho) e fechamento.
 * Mexer no layout aqui muda o livro de todo mundo — mudar com cuidado.
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

const CORFASE = {
  mente: corHex('#d64545'),
  sistema: corHex('#2e7d32'),
  corpo: corHex('#1565c0'),
  manifesto: corHex('#c8952a'),
}
const NOMES_FASE = { mente: 'A Mente', sistema: 'O Sistema', corpo: 'O Corpo', manifesto: 'A Manifestação' }

/** Busca uma imagem da pasta public e devolve em base64 (o jsPDF precisa assim). */
async function carregarImagem(caminho) {
  try {
    const r = await fetch(caminho)
    if (!r.ok) return null
    const blob = await r.blob()
    return await new Promise((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result)
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function gerarLivroPDF({ nome, reflexoes }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const CX = PW / 2

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const fundo = () => { doc.setFillColor(...PAPEL); doc.rect(0, 0, PW, PH, 'F') }

  // as imagens vêm da pasta public (o navegador guarda em cache)
  const [logoMarinho, logoAreia, ...ilustracoes] = await Promise.all([
    carregarImagem('/logo-bt-marinho.webp'),
    carregarImagem('/logo-bt-areia.webp'),
    ...DIAS.map((d) => carregarImagem(`/ilustracoes/${d.img}.webp`)),
  ])

  /* ------------------------------- CAPA ------------------------------- */
  fundo()
  doc.setFillColor(...MARINHO); doc.rect(0, 0, PW, 90, 'F')
  doc.setFillColor(127, 227, 240); doc.ellipse(PW - 70, 45, 26, 34, 'F')
  if (logoMarinho) { try { doc.addImage(logoMarinho, 'WEBP', CX - 95, 150, 190, 69) } catch { /* segue sem o logo */ } }

  doc.setFont('times', 'bold'); doc.setFontSize(52)
  const wIn = doc.getTextWidth('IND')
  const wOze = doc.getTextWidth('OZE')
  const x0 = CX - (wIn + wOze) / 2
  doc.setTextColor(...MARINHO); doc.text('IND', x0, 285)
  doc.setTextColor(...DOURADO); doc.text('OZE', x0 + wIn, 285)

  doc.setFont('times', 'italic'); doc.setFontSize(17); doc.setTextColor(...DOURADO)
  doc.text('— O Efeito Chocadeira —', CX, 312, { align: 'center' })
  doc.setFont('times', 'normal'); doc.setFontSize(13); doc.setTextColor(...TINTASU)
  doc.text('12 Dias de Incubação', CX, 335, { align: 'center' })
  doc.setDrawColor(...DOURADO); doc.setLineWidth(1.2); doc.line(CX - 90, 360, CX + 90, 360)

  doc.setFontSize(10); doc.setTextColor(...TINTASU)
  doc.text('Registro de criação', CX, 400, { align: 'center' })
  doc.setFont('times', 'bold'); doc.setFontSize(17); doc.setTextColor(...MARINHO)
  doc.text('Eliane Simões Cruz', CX, 422, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(11); doc.setTextColor(...DOURADO)
  doc.text('Criadora Certificada · Indez Terapia', CX, 440, { align: 'center' })

  doc.setFillColor(...MARINHO); doc.rect(0, PH - 70, PW, 70, 'F')
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(...AREIA)
  doc.text('Jornada vivida por  ' + nome, CX, PH - 42, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(10); doc.setTextColor(...CIANO)
  doc.text('Gerado em ' + hoje, CX, PH - 24, { align: 'center' })

  /* ------------------------------- DIAS ------------------------------- */
  DIAS.forEach((d, idx) => {
    doc.addPage(); fundo()
    const cf = CORFASE[d.fase]

    doc.setFillColor(...cf); doc.rect(0, 0, PW, 6, 'F')
    doc.setFont('times', 'bold'); doc.setFontSize(14); doc.setTextColor(...cf)
    doc.text('DIA ' + d.n, 40, 44)
    doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(...TINTASU)
    doc.text(NOMES_FASE[d.fase].toUpperCase(), PW - 40, 44, { align: 'right' })
    doc.setFont('times', 'bold'); doc.setFontSize(26); doc.setTextColor(...MARINHO)
    doc.text(d.titulo, 40, 80)
    doc.setDrawColor(...DOURADO); doc.setLineWidth(0.8); doc.line(40, 90, PW - 40, 90)

    let y = 110
    const img = ilustracoes[idx]
    if (img) {
      try {
        const larg = PW - 160
        const alt = larg * 0.62
        doc.addImage(img, 'WEBP', (PW - larg) / 2, y, larg, alt)
        y += alt + 24
      } catch { y += 10 }
    }

    doc.setFont('times', 'bold'); doc.setFontSize(10); doc.setTextColor(...DOURADO)
    doc.text('O QUE EU ESCREVI', 50, y); y += 6

    const escrito = (reflexoes?.[d.n] ?? '—').trim()
    doc.setFont('times', 'italic'); doc.setFontSize(15); doc.setTextColor(...MARINHO)
    const linhas = doc.splitTextToSize('“' + escrito + '”', PW - 150)
    const alturaBox = linhas.length * 20 + 24
    doc.setFillColor(240, 230, 204); doc.roundedRect(45, y, PW - 90, alturaBox, 8, 8, 'F')
    doc.setFillColor(...cf); doc.rect(45, y, 4, alturaBox, 'F')
    doc.text(linhas, 62, y + 22)
    y += alturaBox + 26

    doc.setFont('times', 'bold'); doc.setFontSize(10); doc.setTextColor(...DOURADO)
    doc.text('A REFLEXÃO DO NINHO', 50, y); y += 16
    doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(...TINTA)
    doc.text(doc.splitTextToSize(d.indez, PW - 100), 50, y)

    doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(...TINTASU)
    doc.text('INDOZE · O Efeito Chocadeira', CX, PH - 24, { align: 'center' })
    doc.text('— ' + d.n + ' —', PW - 40, PH - 24, { align: 'right' })
  })

  /* ----------------------------- FECHAMENTO ---------------------------- */
  doc.addPage()
  doc.setFillColor(...MARINHO); doc.rect(0, 0, PW, PH, 'F')
  doc.setDrawColor(...DOURADO); doc.setLineWidth(1.5)
  ;[[150, 70], [112, 50], [75, 34]].forEach(([rx, ry]) => doc.ellipse(CX, 230, rx, ry, 'S'))
  doc.setFillColor(127, 227, 240); doc.ellipse(CX, 215, 40, 54, 'F')

  doc.setFont('times', 'bolditalic'); doc.setFontSize(24); doc.setTextColor(...AREIA)
  doc.text('O ninho fica sempre aberto.', CX, 340, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(14); doc.setTextColor(...CIANO)
  doc.text('Você pode voltar a qualquer momento.', CX, 368, { align: 'center' })
  doc.setDrawColor(...DOURADO); doc.line(CX - 90, 398, CX + 90, 398)
  doc.setFont('times', 'bold'); doc.setFontSize(19); doc.setTextColor(227, 184, 98)
  doc.text('Indez Terapia', CX, 438, { align: 'center' })
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(...AREIA)
  doc.text('Eliane Simões Cruz', CX, 460, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(10); doc.setTextColor(159, 179, 200)
  doc.text('Jornada de ' + nome + ' · gerado em ' + hoje, CX, 480, { align: 'center' })
  if (logoAreia) { try { doc.addImage(logoAreia, 'WEBP', CX - 80, PH - 160, 160, 58) } catch { /* segue */ } }

  doc.save('INDOZE_meu_livro.pdf')
}
