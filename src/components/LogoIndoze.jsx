/**
 * O logo INDOZE: o "O" é um ovo dourado.
 * Vem em dois tamanhos — grande (entrada) e pequeno (topo do app).
 */

export function LogoIndoze({ variante = 'grande' }) {
  if (variante === 'topo') {
    return (
      <span className="marca-indoze" aria-label="INDOZE">
        IND
        <span className="ovo-topo" aria-hidden="true">
          <svg viewBox="0 0 60 80">
            <ellipse cx="30" cy="42" rx="26" ry="34" fill="#c8952a" />
            <ellipse cx="22" cy="30" rx="7" ry="10" fill="#f2ead6" opacity="0.5" />
          </svg>
        </span>
        ZE
      </span>
    )
  }

  return (
    <h1 className="indoze-logo">
      <span className="ind-txt">IND</span>
      <span className="ind-ovo" aria-hidden="true">
        <svg viewBox="0 0 60 80">
          <defs>
            <radialGradient id="ovoGrad" cx="42%" cy="38%" r="65%">
              <stop offset="0" stopColor="#e3b862" />
              <stop offset="55%" stopColor="#c8952a" />
              <stop offset="100%" stopColor="#a5761d" />
            </radialGradient>
          </defs>
          <ellipse cx="30" cy="42" rx="26" ry="34" fill="url(#ovoGrad)" />
          <ellipse cx="22" cy="30" rx="7" ry="10" fill="#f2ead6" opacity="0.55" />
        </svg>
      </span>
      <span className="ind-txt">ZE</span>
      <span className="visually-hidden">INDOZE</span>
    </h1>
  )
}
