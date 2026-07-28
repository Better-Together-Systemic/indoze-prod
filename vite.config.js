import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Confere as chaves ANTES de gerar o build.
 *
 * Melhor o deploy falhar aqui, com um aviso claro, do que subir um site
 * bonito e mudo — que só quebra quando alguém tenta entrar.
 */
function conferirChaves(env, modo) {
  const problemas = []

  if (!env.VITE_SUPABASE_URL) problemas.push('VITE_SUPABASE_URL não foi definida.')
  if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) problemas.push('VITE_SUPABASE_PUBLISHABLE_KEY não foi definida.')
  if (!env.VITE_INDEZ_PROXY_URL) problemas.push('VITE_INDEZ_PROXY_URL não foi definida (o Indez ficará mudo).')

  // ainda com o texto de exemplo?
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY?.includes('COLE_A_CHAVE')) {
    problemas.push('VITE_SUPABASE_PUBLISHABLE_KEY ainda está com o texto de exemplo do .env.example.')
  }

  // A trava mais importante: chave secreta jamais vai para o navegador.
  for (const [nome, valor] of Object.entries(env)) {
    if (!nome.startsWith('VITE_')) continue
    if (/sb_secret_[A-Za-z0-9_-]{6,}|service_role|sk-ant-/i.test(valor ?? '')) {
      problemas.push(
        `PERIGO: ${nome} parece conter uma CHAVE SECRETA. ` +
        'Tudo que começa com VITE_ é empacotado no site e fica visível para qualquer pessoa. ' +
        'Chaves secretas vivem só na Edge Function do Supabase.'
      )
    }
  }

  if (problemas.length) {
    const onde = modo === 'production'
      ? 'Configure-as no painel do Vercel (Settings → Environment Variables).'
      : 'Copie .env.example para .env.local e preencha.'
    throw new Error(
      '\n\n╔═══════════════════════════════════════════════════════╗\n' +
      '║  BUILD INTERROMPIDO — problema nas chaves             ║\n' +
      '╚═══════════════════════════════════════════════════════╝\n\n' +
      problemas.map((p) => '  • ' + p).join('\n') +
      `\n\n  ${onde}\n`
    )
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  conferirChaves(env, mode)

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false, // não expor o código-fonte em produção
      rollupOptions: {
        output: {
          manualChunks: {
            // o gerador de PDF só é baixado quando alguém vai gerar o livro
            pdf: ['jspdf'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
