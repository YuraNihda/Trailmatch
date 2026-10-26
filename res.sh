#!/usr/bin/env bash
# Реорганізація проєкту: усе Python-ве переїжджає в backend/, frontend/ не чіпаємо.
# Запуск з КОРЕНЯ проєкту (там, де лежить docker-compose.yml):
#   bash restructure.sh            # справжній запуск
#   bash restructure.sh --dry-run  # лише показати, що буде зроблено

set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# ── Перевірки ────────────────────────────────────────────
if [[ ! -f docker-compose.yml || ! -d app ]]; then
  echo "❌ Запускайте скрипт з кореня проєкту (де є docker-compose.yml і папка app/)."
  exit 1
fi

IS_GIT=0
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_GIT=1
  if [[ -n "$(git status --porcelain)" && $DRY_RUN -eq 0 ]]; then
    echo "⚠️  Є незакомічені зміни. Рекомендую спершу зробити commit/stash,"
    echo "   щоб за потреби легко відкотитися (git reset --hard)."
    read -r -p "Продовжити все одно? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || exit 1
  fi
fi

run() {
  if [[ $DRY_RUN -eq 1 ]]; then echo "[dry-run] $*"; else "$@"; fi
}

# ── Що переносимо ────────────────────────────────────────
BACKEND_ITEMS=(
  app
  migrations
  scripts
  tests
  alembic.ini
  pytest.ini
  Dockerfile
  requirements.txt
  requirements-dev.txt
)

run mkdir -p backend

move_item() {
  local item="$1"
  if [[ ! -e "$item" ]]; then
    echo "• пропуск: $item (не існує)"
    return
  fi
  if [[ -e "backend/$item" ]]; then
    echo "• пропуск: $item (backend/$item вже існує)"
    return
  fi
  # git mv зберігає історію, якщо файл відстежується
  if [[ $IS_GIT -eq 1 ]] && git ls-files --error-unmatch "$item" >/dev/null 2>&1; then
    echo "→ git mv $item backend/"
    run git mv "$item" backend/
  else
    echo "→ mv $item backend/"
    run mv "$item" backend/
  fi
}

for item in "${BACKEND_ITEMS[@]}"; do
  move_item "$item"
done

# Кеші та віртуальне середовище (не відстежуються git) — переносимо разом із кодом
for junk in .pytest_cache .ruff_cache .mypy_cache; do
  [[ -e "$junk" ]] && run mv "$junk" backend/ || true
done

# ── Автоматичні правки конфігів ──────────────────────────
patch_file() {
  local file="$1" expr="$2"
  [[ -f "$file" ]] || return 0
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] sed у $file: $expr"
  else
    # сумісно з macOS і Linux
    sed -i.bak -E "$expr" "$file" && rm -f "$file.bak"
    echo "✎ оновлено $file"
  fi
}

# docker-compose: build: .  ->  build: ./backend
patch_file docker-compose.yml 's#^([[:space:]]*build:[[:space:]]*)\.[[:space:]]*$#\1./backend#'

# ── Залишилось вручну: показуємо, де саме ────────────────
echo
echo "════════════════ Перевірте вручну ════════════════"
echo
echo "1) docker-compose.yml — build/context/volumes/dockerfile:"
grep -nE 'build|context|dockerfile|volumes|\./|\.:' docker-compose.yml 2>/dev/null || true
echo
echo "2) CI (.github) — кроки з pip/pytest/alembic потребують working-directory: backend:"
grep -rnE 'pip install|pytest|alembic|requirements|working-directory' .github 2>/dev/null || echo "   (нічого не знайдено)"
echo
echo "3) Згадки старих шляхів у README/docs:"
grep -rnE 'pytest|alembic|seed_dev|requirements|uvicorn' README.md docs 2>/dev/null || echo "   (нічого не знайдено)"
echo
echo "4) .env — залишається в корені. Якщо запускаєте backend локально з backend/,"
echo "   у налаштуваннях pydantic-settings вкажіть env_file='../.env'."
echo
if [[ $DRY_RUN -eq 1 ]]; then
  echo "✅ Dry-run завершено, нічого не змінено."
else
  echo "✅ Готово. Далі:"
  echo "   docker compose up --build"
  echo "   (cd backend && pytest)"
  [[ $IS_GIT -eq 1 ]] && echo "   git status   # перевірте перейменування"
fi