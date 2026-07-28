import { useNinho } from '../lib/NinhoContext'
import { textoAcolhida } from '../lib/linguagem'

export default function Sala() {
  const { genero } = useNinho()
  const acolhida = textoAcolhida(genero)

  return (
    <div className="painel ativa container">
      <h2 className="titulo-painel">A Sala</h2>
      <p className="intro">
        Aqui é onde tudo começa. Pense nesta sala como a entrada de um ninho quentinho:
        antes de chocar seus próprios ovos, você conhece o que vai te acompanhar nos doze dias.
      </p>
      <div className="grade-cards">
        <div className="card">
          <div className="icone">🥚</div>
          <h3>O Ninho e o Indez</h3>
          <p>O ninho é esta plataforma: um lugar seguro. O Indez é o ovinho que mostra o caminho — aqui, ele é a inteligência que conversa com você e te ajuda a chocar suas próprias descobertas.</p>
        </div>
        <div className="card">
          <div className="icone">❓</div>
          <h3>As 4 Perguntas</h3>
          <p>Como uma lanterninha que ilumina o escuro, o Indez faz quatro perguntas simples que ajudam a desatar os nós dos pensamentos que doem.</p>
        </div>
        <div className="card">
          <div className="icone">🌱</div>
          <h3>O Dedo Verde</h3>
          <p>Igual ao menino Tistu, que fazia flores nascerem onde tocava, você vai descobrir o dom escondido dentro das suas próprias dores.</p>
        </div>
        <div className="card">
          <div className="icone">📖</div>
          <h3>O Livro Final</h3>
          <p>No último dia, tudo o que você escreveu vira um livro só seu — feito com as suas próprias palavras. Um ovo que virou vida.</p>
        </div>
        <div className="card">
          <div className="icone">🫂</div>
          <h3>Encontros ao Vivo</h3>
          <p>Três momentos junto com outras pessoas: "Limpando a Lente" (após o Dia 4), "A Força da Raiz" (após o Dia 8) e "O INDOZE que Nasceu" (no Dia 12).</p>
        </div>
        <div className="card">
          <div className="icone">🕊️</div>
          <h3>{acolhida.titulo}</h3>
          <p>{acolhida.texto}</p>
        </div>
      </div>
    </div>
  )
}
