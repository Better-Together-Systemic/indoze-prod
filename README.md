# INDOZE — O Efeito Chocadeira

Uma jornada de 12 dias de incubação. Um ninho seguro onde cada pessoa choca as
próprias descobertas, guiada pelo Indez.

Uma criação de **Eliane Simões Cruz** · Better Together Systemic · Indez Terapia.

---

## Como rodar aqui na sua máquina

```bash
npm install
cp .env.example .env.local     # e preencha as chaves
npm run dev
```

Abre em `http://localhost:5173`.

> Sem o `.env.local` preenchido, o app avisa e não sobe. É de propósito:
> melhor quebrar cedo do que ter um site mudo no ar.

## Para colocar no ar

Leia **`docs/GUIA-DO-BRUNO.md`**. Começa com a troca da chave secreta — isso é o passo zero.

---

## Como o ninho é feito por dentro

```
src/
  data/conteudo.js      Os 12 dias, as 4 fases, os depoimentos, o jeito do Indez.
                        É o coração do método — mexer aqui muda a experiência.
  lib/
    supabase.js         Conexão com o banco (+ trava contra chave secreta vazar)
    auth.js             Entrar, cadastrar, senha nova
    dados.js            Ler e guardar reflexões e conversas
    linguagem.js        Fala no gênero certo + regra do "um ovo de cada vez"
    indez.js            Conversa com a IA (via proxy — a chave nunca vem pro navegador)
    pagamento.js        Fala com as Edge Functions da cobrança (InfinitePay)
    livroPdf.js         O livro que nasce dos 12 dias
    NinhoContext.jsx    Quem está dentro e o que já chocou
  components/           Sala, DozeDias, ChatIndez, MeuNinho, Historias, LogoIndoze
  pages/                Entrada, Cadastro, Login, NovaSenha, Ninho, Pagamento, PagamentoRetorno
  styles/global.css     A cara da marca

supabase/migrations/    O SQL que cria o banco (rodar no SQL Editor)
supabase/functions/     Edge Functions: proxy da IA + cobrança da InfinitePay
public/                 Logos e as 12 ilustrações
```

## As três ideias que sustentam tudo

**1. O ninho é de quem entrou.** Cada pessoa só enxerga o próprio ninho. Quem garante
isso é o RLS no banco — não o código da tela. Mesmo que alguém mexa no navegador,
não alcança o diário de outra pessoa.

**2. Memória não se apaga.** Reflexão guardada vira memória: dá pra reler, não dá pra mudar.
Isso não é só uma tela travada — a tabela `reflexoes` **não tem permissão de UPDATE nem
DELETE**. A regra do produto virou regra de banco.

**3. Um ovo de cada vez.** O Dia 2 só abre quando o Dia 1 é guardado. Sem pular a fila,
sem correria. O tempo de incubação é sagrado.

## Segredos: onde cada chave vive

| Chave | Onde vive | Pode ir pro navegador? |
|---|---|---|
| `publishable` / `anon` | Vercel, como `VITE_*` | ✅ sim, é pública |
| `service_role` / `sb_secret_` | **só** na Edge Function | ❌ **nunca** |
| `ANTHROPIC_API_KEY` | **só** na Edge Function | ❌ **nunca** |

Tudo que começa com `VITE_` é empacotado no site e qualquer pessoa vê com F12.

## Comandos

```bash
npm run dev       # desenvolvimento
npm run build     # gera o dist/
npm run preview   # olha o build pronto antes de subir
npm audit         # confere se alguma dependência ficou vulnerável
```
# indoze-prod
