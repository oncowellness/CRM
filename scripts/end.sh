#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Oncowellness CRM · end.sh — Cierre de sesión
#  Uso: ./scripts/end.sh
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

SESSION_FILE="/tmp/crm_session"

# ── Colores ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
OK="${GREEN}✓${NC}"; WARN="${YELLOW}⚠${NC}"; FAIL="${RED}✗${NC}"; INFO="${BLUE}→${NC}"

# ── Header ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Oncowellness CRM · Cierre de sesión              ║${NC}"
printf "${BOLD}║   %-51s║${NC}\n" "$(date '+%A, %d %b %Y · %H:%M')"
echo -e "${BOLD}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ══ 1. DURACIÓN ═══════════════════════════════════════════════
echo -e "${BOLD}── 1. Resumen de sesión ─────────────────────────────${NC}"

SESSION_START_COMMIT=""
if [ -f "$SESSION_FILE" ]; then
  SESSION_DATA=$(cat "$SESSION_FILE")
  SESSION_START=$(echo "$SESSION_DATA"        | cut -d'|' -f1)
  SESSION_START_COMMIT=$(echo "$SESSION_DATA" | cut -d'|' -f2)
  SESSION_MACHINE=$(echo "$SESSION_DATA"      | cut -d'|' -f3)

  NOW=$(date +%s)
  ELAPSED=$(( NOW - SESSION_START ))
  HH=$(( ELAPSED / 3600 ))
  MM=$(( (ELAPSED % 3600) / 60 ))

  echo -e "   ${INFO} Máquina  : $SESSION_MACHINE"
  if [ "$HH" -gt 0 ]; then
    echo -e "   ${INFO} Duración : ${BOLD}${HH}h ${MM}m${NC}"
  else
    echo -e "   ${INFO} Duración : ${BOLD}${MM} minutos${NC}"
  fi
else
  echo -e "   ${WARN} No se encontró sesión activa ${DIM}(¿ejecutaste ./scripts/start.sh?)${NC}"
fi

# Commits de esta sesión
NEW_COMMITS=0
if [ -n "$SESSION_START_COMMIT" ]; then
  NEW_COMMITS=$(git rev-list "${SESSION_START_COMMIT}..HEAD" --count 2>/dev/null || echo 0)
  if [ "$NEW_COMMITS" -gt 0 ]; then
    echo ""
    echo -e "   ${INFO} ${BOLD}$NEW_COMMITS commit(s)${NC} realizados en esta sesión:"
    git log "${SESSION_START_COMMIT}..HEAD" --oneline | sed 's/^/      /'
  fi
fi

DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 0)

if [ "$DIRTY" -gt 0 ]; then
  echo ""
  echo -e "   ${INFO} ${BOLD}$DIRTY archivo(s)${NC} con cambios sin commitear:"
  git status --short | sed 's/^/      /'
fi

if [ "$DIRTY" -eq 0 ] && [ "$AHEAD" -eq 0 ] && [ "$NEW_COMMITS" -eq 0 ]; then
  echo -e "   ${DIM}Sin cambios en esta sesión${NC}"
fi

echo ""

# ══ 2. COMMIT ═════════════════════════════════════════════════
if [ "$DIRTY" -gt 0 ]; then
  echo -e "${BOLD}── 2. Guardar cambios ───────────────────────────────${NC}"
  echo -e "   ${WARN} Tienes $DIRTY archivo(s) sin commitear"
  read -p "   ¿Hacer commit ahora? (S/n): " docommit

  if [[ ! "$docommit" =~ ^[nN]$ ]]; then
    echo ""

    # ── Mensaje automático ────────────────────────────────────
    CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)

    HAS_NEW=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
    HAS_COMPONENTS=$(echo "$CHANGED_FILES" | grep -c "src/components/" || true)
    HAS_STORE=$(echo "$CHANGED_FILES"      | grep -c "src/store/"      || true)
    HAS_TYPES=$(echo "$CHANGED_FILES"      | grep -c "src/types/"      || true)
    HAS_DATA=$(echo "$CHANGED_FILES"       | grep -c "src/data/"       || true)
    HAS_HOOKS=$(echo "$CHANGED_FILES"      | grep -c "src/hooks/"      || true)
    HAS_LIB=$(echo "$CHANGED_FILES"        | grep -c "src/lib/"        || true)
    HAS_CONFIG=$(echo "$CHANGED_FILES"     | grep -cE "(vite\.config|tsconfig|package\.json|eslint)" || true)

    AUTO_TYPE="update"
    [ "$HAS_NEW" -gt 0 ] && AUTO_TYPE="feat"

    PARTS=()
    [ "$HAS_COMPONENTS" -gt 0 ] && PARTS+=("componentes")
    [ "$HAS_STORE" -gt 0 ]      && PARTS+=("store")
    [ "$HAS_TYPES" -gt 0 ]      && PARTS+=("tipos")
    [ "$HAS_DATA" -gt 0 ]       && PARTS+=("datos")
    [ "$HAS_HOOKS" -gt 0 ]      && PARTS+=("hooks")
    [ "$HAS_LIB" -gt 0 ]        && PARTS+=("utils")
    [ "$HAS_CONFIG" -gt 0 ]     && PARTS+=("configuración")

    PARTS_STR=$(IFS=', '; echo "${PARTS[*]}")
    [ -z "$PARTS_STR" ] && PARTS_STR="varios archivos"

    TOP_FILES=$(echo "$CHANGED_FILES" | grep -v "^$" | head -4 | xargs -I{} basename {} | tr '\n' ', ' | sed 's/,$//')
    AUTO_MSG="${AUTO_TYPE}: ${PARTS_STR} — ${TOP_FILES}"

    echo -e "   ${INFO} Mensaje generado automáticamente:"
    echo -e "   ${BOLD}  \"${AUTO_MSG}\"${NC}"
    echo ""
    read -p "   Añade algo al mensaje (Enter para usar tal cual): " extra

    if [ -n "$extra" ]; then
      commit_msg="${AUTO_MSG} · ${extra}"
    else
      commit_msg="$AUTO_MSG"
    fi

    echo -e "   ${DIM}  → \"${commit_msg}\"${NC}"
    echo ""

    # ── Quality gates ─────────────────────────────────────────
    echo -e "   ${INFO} Verificando calidad del código..."
    QUALITY_OK=true

    if npm run lint --silent 2>/dev/null; then
      echo -e "   ${OK} ESLint — sin errores"
    else
      echo -e "   ${FAIL} ESLint encontró errores"
      QUALITY_OK=false
    fi

    if npx tsc --noEmit 2>/dev/null; then
      echo -e "   ${OK} TypeScript — sin errores"
    else
      echo -e "   ${FAIL} TypeScript encontró errores:"
      npx tsc --noEmit 2>&1 | grep " error TS" | head -8 | sed 's/^/      /'
      QUALITY_OK=false
    fi

    if [ "$QUALITY_OK" = false ]; then
      echo ""
      read -p "   ¿Commitear igualmente? (s/N): " force
      if [[ ! "$force" =~ ^[sS]$ ]]; then
        echo -e "   ${WARN} Commit cancelado — corrige los errores primero"
        commit_msg=""
      fi
    fi

    if [ -n "$commit_msg" ]; then
      git add -A
      git commit -m "$commit_msg"
      echo -e "   ${OK} Commit guardado"
      AHEAD=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 0)
      DIRTY=0
    fi
  fi
  echo ""
fi

# ══ 3. PUSH ═══════════════════════════════════════════════════
AHEAD=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 0)

if [ "$AHEAD" -gt 0 ]; then
  echo -e "${BOLD}── 3. Subir a GitHub ────────────────────────────────${NC}"

  BRANCH=$(git rev-parse --abbrev-ref HEAD)

  PUSH_OK=true
  if [ "$BRANCH" != "main" ]; then
    echo -e "   ${WARN} Estás en rama ${YELLOW}$BRANCH${NC} (no en main)"
    read -p "   ¿Pushear igualmente? (s/N): " push_branch
    [[ "$push_branch" =~ ^[sS]$ ]] || PUSH_OK=false
  fi

  if [ "$PUSH_OK" = true ]; then
    echo -e "   ${INFO} $AHEAD commit(s) pendiente(s):"
    git log origin/main..HEAD --oneline | sed 's/^/      /'
    echo ""
    read -p "   ¿Hacer push a GitHub? (S/n): " dopush

    if [[ ! "$dopush" =~ ^[nN]$ ]]; then
      if git push origin "$BRANCH"; then
        echo -e "   ${OK} Push completado → ${CYAN}github.com/oncowellness/CRM${NC}"
        AHEAD=0
      else
        echo -e "   ${FAIL} Push fallido — comprueba tu conexión o autenticación"
      fi
    else
      echo -e "   ${WARN} Push pospuesto — recuerda hacerlo antes del próximo deploy"
    fi
  fi
  echo ""
fi

# ══ 4. ESTADO FINAL ═══════════════════════════════════════════
echo -e "${BOLD}── Estado final del repo ────────────────────────────${NC}"

FINAL_COMMIT=$(git rev-parse --short HEAD 2>/dev/null)
FINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
FINAL_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
FINAL_AHEAD=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo 0)

echo -e "   ${INFO} Rama   : ${BOLD}$FINAL_BRANCH${NC} @ $FINAL_COMMIT"

if [ "$FINAL_DIRTY" -gt 0 ]; then
  echo -e "   ${WARN} $FINAL_DIRTY archivo(s) sin commitear"
fi
if [ "$FINAL_AHEAD" -gt 0 ]; then
  echo -e "   ${WARN} $FINAL_AHEAD commit(s) sin pushear"
fi
if [ "$FINAL_DIRTY" -eq 0 ] && [ "$FINAL_AHEAD" -eq 0 ]; then
  echo -e "   ${OK} Todo limpio y sincronizado con GitHub"
fi

echo ""
echo -e "${DIM}   Sesión cerrada.${NC}"
echo ""

# Limpiar archivo de sesión
rm -f "$SESSION_FILE"
