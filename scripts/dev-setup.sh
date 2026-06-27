#!/usr/bin/env bash
# =============================================================================
# Setup ambiente di sviluppo/repro locale (per Claude Code su web).
# Monta un MariaDB locale, applica lo schema Drizzle e scrive .env.
# Idempotente: si può rilanciare. Pensato per un container effimero.
#
#   bash scripts/dev-setup.sh
#   # poi:  set -a; source .env; set +a;  npx tsx scripts/repro-import.ts
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DATADIR=/tmp/mariadb-data
SOCK=/tmp/mariadb.sock
PORT=3399
DB=kitchen_management

echo "==> 1/4 MariaDB server"
if ! command -v mariadbd >/dev/null 2>&1; then
  sudo apt-get update -qq || true
  sudo apt-get install -y --no-install-recommends --fix-missing mariadb-server
fi

echo "==> 2/4 init datadir + avvio"
if [ ! -d "$DATADIR/mysql" ]; then
  rm -rf "$DATADIR"; mkdir -p "$DATADIR"
  mariadb-install-db --no-defaults --datadir="$DATADIR" \
    --auth-root-authentication-method=normal --basedir=/usr >/tmp/mariadb-init.log 2>&1
fi
if ! mariadb --no-defaults -uroot --socket="$SOCK" -e "SELECT 1" >/dev/null 2>&1; then
  nohup mariadbd --no-defaults --datadir="$DATADIR" --socket="$SOCK" \
    --port="$PORT" --bind-address=127.0.0.1 --user=root >/tmp/mariadbd.log 2>&1 &
  for i in $(seq 1 25); do
    mariadb --no-defaults -uroot --socket="$SOCK" -e "SELECT 1" >/dev/null 2>&1 && break
    sleep 1
  done
fi
mariadb --no-defaults -uroot --socket="$SOCK" -e "
  CREATE DATABASE IF NOT EXISTS $DB;
  CREATE USER IF NOT EXISTS 'kuser'@'127.0.0.1' IDENTIFIED BY 'kpass';
  GRANT ALL ON $DB.* TO 'kuser'@'127.0.0.1'; FLUSH PRIVILEGES;"
echo "    MariaDB UP su 127.0.0.1:$PORT (db=$DB)"

echo "==> 3/4 .env"
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL=mysql://kuser:kpass@127.0.0.1:$PORT/$DB
JWT_SECRET=local-dev-secret-at-least-32-characters-long-xx
AUTH_PROVIDER=local
VITE_AUTH_PROVIDER=local
PORT=3000
NODE_ENV=development
EOF
  echo "    .env creato"
else
  echo "    .env già presente (lascio com'è)"
fi

echo "==> 4/4 dipendenze + schema"
[ -d node_modules/drizzle-kit ] || npm install --legacy-peer-deps
set -a; source .env; set +a
npx drizzle-kit push --force >/tmp/drizzle-push.log 2>&1 && echo "    schema applicato" || { echo "    push schema FALLITO"; tail -5 /tmp/drizzle-push.log; }

echo "==> Pronto. Esegui:  set -a; source .env; set +a"
echo "    Repro import:    npx tsx scripts/repro-import.ts"
