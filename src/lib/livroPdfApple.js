import { jsPDF } from 'jspdf'
import { DIAS, FASES } from '../data/conteudo'

/**
 * A mesma jornada dos 12 dias, num segundo formato: uma edição enxuta,
 * inspirada no jeito Apple de apresentar produto — muito branco, uma ideia
 * por página, tipografia grande e hierárquica, cor só onde ela significa
 * algo. O conteúdo é o mesmo de gerarLivroPDF (livroPdf.js): capa, os 12
 * dias com a reflexão de quem escreveu, e um fechamento. Só a pele muda.
 */

const corHex = (h) => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const BRANCO = corHex('#ffffff')
const NEBLINA = corHex('#fbfbfd')
const TINTA = corHex('#1d1d1f')
const CINZA = corHex('#6e6e73')
const CINZACLARO = corHex('#86868b')
const LINHA = corHex('#d2d2d7')

// Paleta de acento por fase — próxima das cores de sistema da Apple, mas
// ainda ligada às cores originais do FASES em src/data/conteudo.js.
const ACENTO = {
  mente: corHex('#ff3b30'),
  sistema: corHex('#30d158'),
  corpo: corHex('#0071e3'),
  manifesto: corHex('#c8952a'),
}

const INSTAGRAM_URL = 'https://instagram.com/elianesimoescruz'
const WHATSAPP_URL = 'https://wa.me/13214294517'

/** Espaça as letras manualmente — jsPDF não suporta letter-spacing nativo,
 *  e o kicker maiúsculo em caixa alta precisa desse respiro pra parecer Apple. */
const espacado = (s) => s.toUpperCase().split('').join('  ')

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

function limparTexto(textoBruto) {
  return (textoBruto ?? '').trim()
}

export async function gerarLivroPDFApple({ nome, reflexoes }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const CX = PW / 2
  const MARGEM = 64
  const LARG = PW - MARGEM * 2

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const [logoMarinho, ...ilustracoes] = await Promise.all([
    carregarImagem('/logo-bt-marinho.webp'),
    ...DIAS.map((d) => carregarImagem(`/ilustracoes/${d.img}.webp`)),
  ])

  const fundo = (cor = NEBLINA) => { doc.setFillColor(...cor); doc.rect(0, 0, PW, PH, 'F') }

  const linkCentro = (texto, x, y, url) => {
    const w = doc.getTextWidth(texto)
    doc.textWithLink(texto, x - w / 2, y, { url })
  }

  /** Rodapé minimalista: marca discreta à esquerda, número de página à direita. */
  const rodape = () => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...CINZACLARO)
    doc.text('INDOZE', MARGEM, PH - 34)
    doc.text(String(doc.internal.getNumberOfPages()), PW - MARGEM, PH - 34, { align: 'right' })
  }

  const kicker = (texto, cor, x, y, alinhamento = 'left') => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...cor)
    doc.text(espacado(texto), x, y, { align: alinhamento })
  }

  /* ============================== CAPA ============================== */
  fundo(BRANCO)
  if (logoMarinho) { try { doc.addImage(logoMarinho, 'PNG', CX - 46, 90, 92, 34) } catch { /* segue sem logo */ } }

  kicker('Better Together Systemic', CINZA, CX, 168, 'center')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(42); doc.setTextColor(...TINTA)
  let yCapa = 240
  ;['Doze dias.', 'Uma transformação.'].forEach((linha) => {
    doc.text(linha, CX, yCapa, { align: 'center' })
    yCapa += 50
  })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(14); doc.setTextColor(...CINZA)
  doc.text(nome ? `A jornada de ${nome}` : 'Uma jornada pessoal', CX, yCapa + 18, { align: 'center' })
  doc.setFontSize(11.5); doc.setTextColor(...CINZACLARO)
  doc.text(`Edição encerrada em ${hoje}`, CX, yCapa + 40, { align: 'center' })

  const yBarra = PH - 150
  doc.setDrawColor(...LINHA); doc.setLineWidth(1)
  doc.line(MARGEM, yBarra, PW - MARGEM, yBarra)
  const larguraFase = LARG / 4
  Object.values(FASES).forEach((f, i) => {
    const cor = corHex(f.cor)
    const x0 = MARGEM + i * larguraFase
    doc.setFillColor(...cor); doc.rect(x0, yBarra - 3, larguraFase - 6, 3, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...cor)
    doc.text(espacado(f.nome), x0, yBarra + 20)
  })

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...CINZACLARO)
  doc.text('Eliane Simões Cruz · Indez Terapia', CX, PH - 60, { align: 'center' })
  rodape()

  /* ======================= UM DIA POR PÁGINA ======================= */
  let faseAnterior = null
  DIAS.forEach((d, idx) => {
    const cor = ACENTO[d.fase]
    const f = FASES[d.fase]
    const texto = limparTexto(reflexoes?.[d.n])
    const img = ilustracoes[idx]

    /* Divisor de capítulo: uma página cheia de cor sempre que a fase muda —
       o jeito Apple de separar "capítulos" de produto dentro de um evento. */
    if (d.fase !== faseAnterior) {
      faseAnterior = d.fase
      doc.addPage(); fundo(cor)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BRANCO)
      doc.text(espacado(`Parte ${Object.keys(FASES).indexOf(d.fase) + 1} de 4`), CX, PH / 2 - 34, { align: 'center' })
      doc.setFontSize(38)
      doc.text(f.nome, CX, PH / 2 + 8, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12.5)
      const linhasSub = doc.splitTextToSize(subtituloFase(d.fase), 360)
      doc.text(linhasSub, CX, PH / 2 + 34, { align: 'center' })
    }

    doc.addPage(); fundo(BRANCO)
    let yy = 96

    kicker(`Dia ${String(d.n).padStart(2, '0')} · ${f.nome}`, cor, MARGEM, yy)
    yy += 30

    doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(...TINTA)
    const linhasTitulo = doc.splitTextToSize(d.titulo, LARG)
    doc.text(linhasTitulo, MARGEM, yy)
    yy += linhasTitulo.length * 34 + 6

    doc.setDrawColor(...cor); doc.setLineWidth(2.5)
    doc.line(MARGEM, yy, MARGEM + 46, yy)
    yy += 30

    if (img) {
      const larg = 150, alt = 150
      try {
        doc.setFillColor(...NEBLINA)
        doc.roundedRect(PW - MARGEM - larg, 96, larg, alt, 14, 14, 'F')
        doc.addImage(img, 'PNG', PW - MARGEM - larg + 8, 104, larg - 16, alt - 16)
      } catch { /* segue sem a ilustração */ }
    }

    const largTexto = img ? LARG - 170 : LARG

    doc.setFont('helvetica', 'italic'); doc.setFontSize(10.5); doc.setTextColor(...CINZA)
    const linhasTema = doc.splitTextToSize(d.tema, largTexto)
    doc.text(linhasTema, MARGEM, yy)
    yy += linhasTema.length * 14 + 24

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...CINZACLARO)
    doc.text(espacado('O que foi escrito'), MARGEM, yy)
    yy += 22

    if (texto) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(15); doc.setTextColor(...TINTA)
      const linhasCorpo = doc.splitTextToSize(texto, largTexto)
      const alturaLinha = 21
      const limiteY = PH - 100
      linhasCorpo.forEach((linha) => {
        if (yy + alturaLinha > limiteY) {
          rodape()
          doc.addPage(); fundo(BRANCO)
          yy = 96
          kicker(`Dia ${String(d.n).padStart(2, '0')} · continuação`, cor, MARGEM, yy)
          yy += 34
          doc.setFont('helvetica', 'normal'); doc.setFontSize(15); doc.setTextColor(...TINTA)
        }
        doc.text(linha, MARGEM, yy)
        yy += alturaLinha
      })
    } else {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(13); doc.setTextColor(...CINZACLARO)
      doc.text('Este espaço ainda está em branco.', MARGEM, yy)
    }

    rodape()
  })

  /* ============================ FECHAMENTO ============================ */
  doc.addPage(); fundo(TINTA)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(...BRANCO)
  doc.text('Isto não termina aqui.', CX, PH / 2 - 60, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(200, 200, 205)
  doc.text('Você pode reler esta jornada sempre que precisar.', CX, PH / 2 - 30, { align: 'center' })

  doc.setDrawColor(90, 90, 95); doc.setLineWidth(1)
  doc.line(CX - 90, PH / 2, CX + 90, PH / 2)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...BRANCO)
  doc.text('Eliane Simões Cruz', CX, PH / 2 + 40, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(180, 180, 186)
  doc.text('Indez Terapia · Better Together Systemic', CX, PH / 2 + 58, { align: 'center' })

  doc.setFontSize(10.5); doc.setTextColor(120, 200, 255)
  linkCentro('Instagram: @elianesimoescruz', CX, PH / 2 + 90, INSTAGRAM_URL)
  doc.setTextColor(...corHex('#c8952a'))
  linkCentro('WhatsApp — Fale com a Eli', CX, PH / 2 + 110, WHATSAPP_URL)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 126)
  doc.text('INDOZE', CX, PH - 40, { align: 'center' })

  doc.save('INDOZE_edicao_apple_12_dias.pdf')
}

function subtituloFase(fase) {
  const textos = {
    mente: 'Onde os pensamentos que doem começam a ser olhados de frente.',
    sistema: 'Onde as raízes da família encontram espaço para respirar.',
    corpo: 'Onde o corpo entra na conversa e a névoa começa a baixar.',
    manifesto: 'Onde a ideia sai do papel e vira gesto.',
  }
  return textos[fase] ?? ''
}
