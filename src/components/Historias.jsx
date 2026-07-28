import { DEPOIMENTOS } from '../data/conteudo'

export default function Historias() {
  return (
    <div className="painel ativa container">
      <h2 className="titulo-painel">Histórias</h2>
      <p className="intro">
        Pessoas que já atravessaram os doze dias. Quem chega no ninho vê que outros já voaram daqui.
      </p>
      <div className="grade-depoimentos">
        {DEPOIMENTOS.map((d, i) => (
          <div className="depoimento" key={i}>
            <p>{d.texto}</p>
            <div className="autor">{d.autor}</div>
            <div className="relacao">{d.relacao}</div>
            {d.selo && <div className="selo-depoimento">🥚 {d.selo}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
