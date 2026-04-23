#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Oncowellness CRM · start.sh — Inicio de sesión
#  Uso: ./scripts/start.sh
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

SESSION_FILE="/tmp/crm_session"
DEV_PORT=5173

# ── Colores ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
OK="${GREEN}✓${NC}"; WARN="${YELLOW}⚠${NC}"; FAIL="${RED}✗${NC}"; INFO="${BLUE}→${NC}"

ERRORS=0

# ── Header ────────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Oncowellness CRM · Inicio de sesión              ║${NC}"
printf "${BOLD}║   %-51s║${NC}\n" "$(date '+%A, %d %b %Y · %H:%M') · $(hostname)"
echo -e "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ══ 1. GIT ════════════════════════════════════════════════════
echo -e "${BOLD}── 1. Git ───────────────────────────────────────────${NC}"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
HEAD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "")

if [ -z "$BRANCH" ]; then
  echo -e "   ${FAIL} No es un repositorio git"
  ERRORS=$((ERRORS+1))
else
  if [ "$BRANCH" = "main" ]; then
    echo -e "   ${OK} Rama: ${GREEN}main${NC}  ($HEAD_COMMIT)"
  else
    echo -e "   ${WARN} Rama: ${YELLOW}$BRANCH${NC}  ($HEAD_COMMIT) — no es main"
  fi
fi

# Stashes olvidados
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
if [ "$STASH_COUNT" -gt 0 ]; then
  echo -e "   ${WARN} ${YELLOW}$STASH_COUNT stash(es)${NC} sin aplicar de sesiones anteriores:"
  git stash list | sed 's/^/      /'
fi

# Sync con remote
echo -e "   ${INFO} Sincronizando con origin..."
git fetch origin --quiet 2>/dev/null

AHEAD=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 0)
BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 0)
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Riesgo de conflicto
if [ "$BEHIND" -gt 0 ] && [ "$DIRTY" -gt 0 ]; then
  echo ""
  echo -e "   ${FAIL} ${RED}RIESGO DE CONFLICTO:${NC}"
  echo -e "      Estás ${YELLOW}$BEHIND commit(s) por detrás${NC} del remote"
  echo -e "      y tienes ${YELLOW}$DIRTY archivo(s)${NC} modificados localmente."
  echo -e "      Resuelve antes de continuar:"
  echo -e "      ${DIM}git stash && git pull && git stash pop${NC}"
  echo ""
  ERRORS=$((ERRORS+1))

elif [ "$BEHIND" -gt 0 ]; then
  echo -e "   ${WARN} Estás ${YELLOW}$BEHIND commit(s)${NC} por detrás de origin/main"
  read -p "      ¿Hacer pull ahora? (S/n): " dopull
  if [[ ! "$dopull" =~ ^[nN]$ ]]; then
    git pull --ff-only origin main
    HEAD_COMMIT=$(git rev-parse --short HEAD)
    echo -e "   ${OK} Pull completado → $HEAD_COMMIT"
  fi

elif [ "$AHEAD" -gt 0 ]; then
  echo -e "   ${WARN} Tienes ${YELLOW}$AHEAD commit(s)${NC} sin pushear"
fi

if [ "$DIRTY" -gt 0 ] && [ "$BEHIND" -eq 0 ]; then
  echo -e "   ${WARN} ${YELLOW}$DIRTY archivo(s)${NC} con cambios sin commitear"
fi

if [ "$BEHIND" -eq 0 ] && [ "$DIRTY" -eq 0 ] && [ "$AHEAD" -eq 0 ]; then
  echo -e "   ${OK} Sincronizado con origin/main"
fi

echo ""

# ══ 2. DEPENDENCIAS ═══════════════════════════════════════════
echo -e "${BOLD}── 2. Dependencias (node_modules) ───────────────────${NC}"

if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
  echo -e "   ${WARN} node_modules no encontrado — instalando..."
  npm install --silent
  echo -e "   ${OK} Dependencias instaladas"
else
  echo -e "   ${OK} node_modules presente"
fi

echo ""

# ══ 3. PUERTO 5173 ════════════════════════════════════════════
echo -e "${BOLD}── 3. Puerto $DEV_PORT ──────────────────────────────────────${NC}"

PID_DEV=$(lsof -ti:$DEV_PORT 2>/dev/null | head -1 || echo "")
if [ -n "$PID_DEV" ]; then
  PROC=$(ps -p "$PID_DEV" -o comm= 2>/dev/null || echo "proceso desconocido")
  echo -e "   ${WARN} Puerto $DEV_PORT ocupado por ${YELLOW}$PROC${NC} (PID $PID_DEV)"
  read -p "      ¿Matar el proceso y liberar el puerto? (S/n): " killproc
  if [[ ! "$killproc" =~ ^[nN]$ ]]; then
    kill "$PID_DEV" 2>/dev/null && sleep 1 && echo -e "   ${OK} Puerto liberado"
  else
    echo -e "   ${WARN} El servidor puede tener problemas para arrancar"
  fi
else
  echo -e "   ${OK} Puerto $DEV_PORT libre"
fi

echo ""

# ══ RESULTADO ═════════════════════════════════════════════════
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${BOLD}── Resultado ────────────────────────────────────────${NC}"
  echo -e "   ${FAIL} ${RED}$ERRORS problema(s) crítico(s) — resuélvelos antes de continuar${NC}"
  echo ""
  exit 1
fi

# Guardar sesión
printf "%s|%s|%s\n" "$(date +%s)" "$(git rev-parse HEAD 2>/dev/null)" "$(hostname)" > "$SESSION_FILE"

echo -e "${BOLD}── Listo para desarrollar ───────────────────────────${NC}"
LAST_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null)
echo -e "   ${INFO} Último commit : ${DIM}$LAST_MSG${NC}"
[ "$DIRTY" -gt 0 ] && echo -e "   ${WARN} Recuerda commitear los $DIRTY archivo(s) modificados"
[ "$AHEAD" -gt 0 ] && echo -e "   ${WARN} Recuerda pushear los $AHEAD commit(s) pendientes"
echo ""

# ══ SERVIDOR DE DESARROLLO ════════════════════════════════════
echo -e "${BOLD}── Servidor de desarrollo ───────────────────────────${NC}"
echo -e "   ${INFO} Arrancando en ${CYAN}http://localhost:$DEV_PORT${NC}"
echo -e "   ${DIM}Ctrl+C para detener — después ejecuta ./scripts/end.sh${NC}"
echo ""

npm run dev

# Cuando el usuario hace Ctrl+C llegamos aquí
echo ""
echo -e "${YELLOW}  Servidor detenido.${NC}"
echo -e "  Ejecuta ${BOLD}./scripts/end.sh${NC} para cerrar la sesión correctamente."
echo ""
