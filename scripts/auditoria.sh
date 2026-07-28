cd /home/claude/indoze-prod
echo "╔══════════════════════════════════════════════════════╗"
echo "║   AUDITORIA DE SEGURANÇA — INDOZE                    ║"
echo "╚══════════════════════════════════════════════════════╝"
falhas=0

# 1. Chave SECRETA real no código-fonte (padrão: sb_secret_ + 10+ chars)
echo ""
echo "1. Chave secreta real no código-fonte?"
if grep -rqE "sb_secret_[A-Za-z0-9_-]{10,}" src/ supabase/ *.json *.js 2>/dev/null; then
  echo "   ✗ ACHOU CHAVE SECRETA REAL!"; falhas=$((falhas+1))
else
  echo "   ✓ nenhuma"
fi

# 2. Chave secreta real no build
echo ""
echo "2. Chave secreta real no build (dist/)?"
if grep -rqE "sb_secret_[A-Za-z0-9_-]{10,}" dist/ 2>/dev/null; then
  echo "   ✗ VAZOU NO BUILD!"; falhas=$((falhas+1))
else
  echo "   ✓ nenhuma"
fi

# 3. Chave da Anthropic no código ou build
echo ""
echo "3. Chave da Anthropic (sk-ant-...) em algum lugar?"
if grep -rqE "sk-ant-[A-Za-z0-9_-]{10,}" src/ dist/ supabase/ 2>/dev/null; then
  echo "   ✗ CHAVE DA ANTHROPIC EXPOSTA!"; falhas=$((falhas+1))
else
  echo "   ✓ nenhuma (ela vive só na Edge Function)"
fi

# 4. .env fora do Git
echo ""
echo "4. Arquivos .env protegidos do Git?"
if grep -q "^\.env$" .gitignore && grep -q "\.env\.local" .gitignore; then
  echo "   ✓ .gitignore protege .env e .env.local"
else
  echo "   ✗ .env pode ir pro Git!"; falhas=$((falhas+1))
fi

# 5. A trava anti-vazamento existe?
echo ""
echo "5. Trava que impede subir com chave secreta?"
if grep -q "sb_secret_|service_role" src/lib/supabase.js; then
  echo "   ✓ o app se recusa a subir se colarem a chave secreta numa VITE_"
else
  echo "   ✗ sem trava"; falhas=$((falhas+1))
fi

# 6. Dependências
echo ""
echo "6. Vulnerabilidades nas dependências?"
n=$(npm audit --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['metadata']['vulnerabilities']['total'])" 2>/dev/null || echo "?")
if [ "$n" = "0" ]; then
  echo "   ✓ zero vulnerabilidades"
else
  echo "   ✗ $n vulnerabilidade(s)"; falhas=$((falhas+1))
fi

# 7. Headers
echo ""
echo "7. Cabeçalhos de segurança (vercel.json)?"
todos=1
for h in Content-Security-Policy X-Frame-Options Strict-Transport-Security X-Content-Type-Options Referrer-Policy Permissions-Policy; do
  grep -q "$h" vercel.json || { echo "   ✗ falta $h"; todos=0; falhas=$((falhas+1)); }
done
[ $todos -eq 1 ] && echo "   ✓ todos os 6 presentes"

# 8. RLS
echo ""
echo "8. Banco: RLS e memória imutável?"
rls=$(grep -c "enable row level security" supabase/migrations/001_schema_inicial.sql)
pol=$(grep -c "create policy" supabase/migrations/001_schema_inicial.sql)
echo "   ✓ RLS em $rls tabelas | $pol políticas"
if grep -qE "on public\.reflexoes for (update|delete)" supabase/migrations/001_schema_inicial.sql; then
  echo "   ✗ reflexoes permite update/delete!"; falhas=$((falhas+1))
else
  echo "   ✓ reflexoes sem update/delete (memória protegida no banco)"
fi
if grep -q "grant select, insert          on public.reflexoes" supabase/migrations/001_schema_inicial.sql; then
  echo "   ✓ GRANT de reflexoes também sem update/delete"
fi

# 9. sourcemap desligado
echo ""
echo "9. Código-fonte exposto em produção (sourcemap)?"
if ls dist/assets/*.map 2>/dev/null | head -1 | grep -q map; then
  echo "   ✗ sourcemaps no build!"; falhas=$((falhas+1))
else
  echo "   ✓ sem sourcemaps"
fi

echo ""
echo "══════════════════════════════════════════════════════"
if [ $falhas -eq 0 ]; then
  echo "  ✓ AUDITORIA PASSOU — $falhas falha(s)"
else
  echo "  ✗ $falhas FALHA(S) — corrigir antes de subir"
fi
echo "══════════════════════════════════════════════════════"
exit $falhas
