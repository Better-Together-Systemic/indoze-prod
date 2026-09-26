import { Routes, Route, Navigate } from 'react-router-dom'
import { useNinho } from './lib/NinhoContext'
import Entrada from './pages/Entrada'
import Cadastro from './pages/Cadastro'
import Login from './pages/Login'
import NovaSenha from './pages/NovaSenha'
import Ninho from './pages/Ninho'
import CompletarPerfil from './pages/CompletarPerfil'
import Pagamento from './pages/Pagamento'
import PagamentoRetorno from './pages/PagamentoRetorno'

/** Só entra no ninho quem tem crachá, já contou o WhatsApp — e já pagou. */
function Protegida({ children }) {
  const { logado, carregando, perfil } = useNinho()
  if (carregando) return <TelaCarregando />
  if (!logado) return <Navigate to="/" replace />
  if (perfil && !perfil.whatsapp) return <CompletarPerfil />
  if (perfil && !perfil.pago) return <Pagamento />
  return children
}

/** Só quem tem crachá chega até aqui — a InfinitePay traz de volta pra cá. */
function SoLogado({ children }) {
  const { logado, carregando } = useNinho()
  if (carregando) return <TelaCarregando />
  if (!logado) return <Navigate to="/" replace />
  return children
}

/** Quem já entrou não precisa ver o formulário de novo (ex: voltando do Google). */
function SoDeslogado({ children }) {
  const { logado, carregando } = useNinho()
  if (carregando) return <TelaCarregando />
  if (logado) return <Navigate to="/ninho" replace />
  return children
}

function TelaCarregando() {
  return (
    <div className="tela-carregando">
      <div className="ovo-pulsando" aria-hidden="true">🥚</div>
      <p>Abrindo seu ninho…</p>
    </div>
  )
}

export default function App() {
  const { logado, carregando } = useNinho()

  return (
    <Routes>
      <Route path="/" element={logado && !carregando ? <Navigate to="/ninho" replace /> : <Entrada />} />
      <Route path="/entrar" element={<SoDeslogado><Login /></SoDeslogado>} />
      <Route path="/criar-ninho" element={<SoDeslogado><Cadastro /></SoDeslogado>} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route path="/pagamento/retorno" element={<SoLogado><PagamentoRetorno /></SoLogado>} />
      <Route path="/ninho/*" element={<Protegida><Ninho /></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
