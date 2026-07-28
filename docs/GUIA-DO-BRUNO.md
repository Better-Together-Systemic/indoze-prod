# Guia de produção — INDOZE

**Para:** Bruno (infraestrutura)
**De:** Eliane / Better Together Systemic
**O que é isto:** o passo a passo para colocar o INDOZE no ar com segurança.

---

## ⛔ PASSO 0 — ANTES DE QUALQUER COISA: trocar a chave secreta

A chave secreta do Supabase (`sb_secret_F8deE...`) foi exposta num screenshot durante o
desenvolvimento. **Ela precisa ser rotacionada antes de o site ir ao ar.**

Por que isso é sério: a chave secreta (`service_role`) **passa por cima de todas as regras
de segurança (RLS)**. Quem tiver ela em mãos lê e escreve qualquer coisa de qualquer pessoa —
todos os diários, todas as conversas. As trancas que montamos não valem nada contra ela.

**O que fazer:**

1. Supabase → **Settings → API Keys**
2. Revogue / rotacione a chave secreta antiga (`sb_secret_F8deE...`)
3. Gere uma nova
4. Atualize a nova chave **apenas** onde ela realmente vive:
   - na Edge Function `anthropic-proxy` (variáveis de ambiente do Supabase)
   - em nenhum outro lugar
5. Confirme que ela **não** está: no código, no Git, no Vercel como `VITE_*`, em prints

> **Regra de ouro:** tudo que começa com `VITE_` vai junto para o navegador e é
> **público**. Qualquer pessoa vê com F12. Só entram ali chaves `publishable`/`anon`.

O código tem uma trava: se alguém colar uma `sb_secret_` numa variável `VITE_`,
o app se recusa a subir (veja `src/lib/supabase.js`).

---

## PASSO 1 — Criar as tabelas no banco

1. Supabase → **SQL Editor** → **New query**
2. Cole o conteúdo inteiro de `supabase/migrations/001_schema_inicial.sql`
3. **Run**

Isso cria:

| Tabela | O que guarda |
|---|---|
| `perfis` | nome, instagram, tratamento (m/f/n) |
| `reflexoes` | o que a pessoa escreveu em cada um dos 12 dias |
| `conversas` | os encontros com o Indez, por dia |
| `meu_progresso` (view) | quantos dias já chocaram |

**Como conferir que deu certo:**

```sql
-- deve devolver as 3 tabelas, todas com rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname='public' order by tablename;

-- deve devolver 9 políticas
select tablename, policyname, cmd from pg_policies
where schemaname='public' order by tablename, cmd;
```

> Este SQL já foi testado num PostgreSQL real (PGlite) antes de chegar aqui:
> migração roda limpa, RLS ligado nas 3 tabelas, 9 políticas ativas.

### Uma decisão de produto que virou regra de banco

`reflexoes` **não tem** policy de `UPDATE` nem `DELETE`, e o `GRANT` também não os concede.
Isso é de propósito: **reflexão guardada vira memória e não se altera** — nem pela tela,
nem por alguém mexendo no console do navegador. A regra está no banco, não só no visual.

Se um dia a Eliane quiser permitir edição, tem que ser uma decisão consciente aqui.

---

## PASSO 2 — Configurar a autenticação

Supabase → **Authentication → Providers → Email**:

- ✅ Enable Email provider
- ✅ **Confirm email** (importante: evita cadastro com e-mail de outra pessoa)
- Minimum password length: **8**

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://SEU-DOMINIO.com.br`
- **Redirect URLs** (adicione todas):
  - `https://SEU-DOMINIO.com.br/entrar`
  - `https://SEU-DOMINIO.com.br/nova-senha`
  - `http://localhost:5173/entrar` *(só para desenvolvimento)*
  - `http://localhost:5173/nova-senha` *(só para desenvolvimento)*

**Rate limiting** (Authentication → Rate Limits): deixe os padrões ligados.
Protege contra alguém tentando adivinhar senhas na força bruta.

---

## PASSO 3 — A Edge Function do Indez (`anthropic-proxy`)

A função já existe. Duas coisas a conferir:

**3.1 — CORS.** Precisa aceitar o domínio de produção:

```ts
const origensPermitidas = [
  'https://SEU-DOMINIO.com.br',
  'http://localhost:5173',
]
const origem = req.headers.get('origin') ?? ''
const cors = {
  'Access-Control-Allow-Origin': origensPermitidas.includes(origem) ? origem : '',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
```

**3.2 — Só gente logada usa o Indez.** Cada chamada da IA custa dinheiro. Sem essa
checagem, qualquer pessoa na internet pode usar a Anthropic na sua conta:

```ts
const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth)
if (error || !user) {
  return new Response(JSON.stringify({ error: 'não autorizado' }), { status: 401, headers: cors })
}
```

A chave da Anthropic (`ANTHROPIC_API_KEY`) fica **só aqui**, nas variáveis de ambiente
do Supabase. Nunca no front.

---

## PASSO 4 — Subir no Vercel

1. Suba este projeto num repositório Git (o `.gitignore` já protege o `.env`)
2. Vercel → **New Project** → importe o repositório
3. O Vercel detecta o Vite sozinho. Confirme:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** — adicione as três (Production + Preview):

```
VITE_SUPABASE_URL=https://xfniavcbswqapietgjbe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   ← a PÚBLICA, nunca a secreta
VITE_INDEZ_PROXY_URL=https://xfniavcbswqapietgjbe.supabase.co/functions/v1/anthropic-proxy
```

5. **Deploy**
6. Ligue o domínio em Settings → Domains

O `vercel.json` já vai com os cabeçalhos de segurança configurados (CSP, HSTS,
anti-clickjacking, etc.) e cache longo para as ilustrações.

---

## PASSO 5 — Conferir que está tudo certo

Depois do deploy, teste **nesta ordem**:

- [ ] A entrada abre e mostra o INDOZE com o ovo
- [ ] Criar conta → chega o e-mail de confirmação
- [ ] Confirmar o e-mail → consegue entrar
- [ ] O nome aparece no topo e a Sala fala no gênero certo
- [ ] Só o Dia 1 está aberto; os outros com cadeado
- [ ] Escrever e guardar o Dia 1 → vira memória, o Dia 2 abre
- [ ] Recarregar a página → a reflexão continua lá *(prova que o banco está gravando)*
- [ ] Conversar com o Indez → ele responde
- [ ] Guardar a conversa → aparece em Meu Ninho
- [ ] Sair e entrar de novo → tudo continua no lugar

**O teste de segurança que importa:** crie duas contas diferentes, escreva
uma reflexão em cada. Confirme que a conta A **não vê nada** da conta B.
(Isso já foi testado no banco, mas vale conferir no ar.)

---

## O que fica pendente / próximos passos

**Vale a pena logo:**
- Backup automático do banco (Supabase → Database → Backups)
- Um jeito de acompanhar erros em produção (Sentry, ou os logs do próprio Vercel)

**Quando crescer:**
- Limite de uso do Indez por pessoa (hoje, quem estiver logado pode conversar à vontade — e cada conversa custa)
- Página de "minha conta" (trocar nome, instagram, tratamento)
- LGPD: exportar e apagar os dados a pedido da pessoa

---

## Em caso de dúvida

| Sintoma | Provável causa |
|---|---|
| Tela branca no Vercel | Faltou variável de ambiente (veja o Console do navegador) |
| "O Indez está sem sinal" | CORS da Edge Function não aceita o domínio |
| "não reconheceu seu crachá" | A Edge Function não está validando o token direito |
| Login funciona mas o ninho vem vazio | RLS: confira se as 9 políticas existem |
| Cadastro cria login mas não cria perfil | O gatilho `trg_novo_usuario` não foi criado |
