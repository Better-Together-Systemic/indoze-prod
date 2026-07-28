import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Falha cedo e claro: melhor quebrar no build do que ter um app mudo em produção.
if (!url || !chavePublica) {
  throw new Error(
    'Faltam variáveis de ambiente do Supabase. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY ' +
    '(no .env.local para desenvolvimento, ou no painel do Vercel para produção).'
  )
}

// Trava de segurança: a chave secreta jamais pode chegar ao navegador.
// Se alguém colar a service_role por engano, o app se recusa a subir.
if (/^sb_secret_|service_role/i.test(chavePublica)) {
  throw new Error(
    'PERIGO: parece que a chave SECRETA do Supabase foi colocada numa variável VITE_. ' +
    'Tudo que começa com VITE_ vai para o navegador e fica visível para qualquer pessoa. ' +
    'Use apenas a chave publishable/anon aqui.'
  )
}

export const supabase = createClient(url, chavePublica, {
  auth: {
    persistSession: true,        // a pessoa continua logada ao voltar
    autoRefreshToken: true,
    detectSessionInUrl: true,    // confirma e-mail / magic link
  },
})
