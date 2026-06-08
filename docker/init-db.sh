#!/bin/bash
# Seeds wedding_bot_db from dump.sql on first Docker start (empty postgres_data volume).
# Requires docker-compose mount: ./seed/dump.sql -> /seed/dump.sql

set -euo pipefail

readonly DUMP_FILE=/seed/dump.sql
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
readonly DB_USER="$POSTGRES_USER"
readonly DB_NAME="$POSTGRES_DB"

if [[ ! -s "$DUMP_FILE" ]]; then
  echo "init-db: $DUMP_FILE is missing or empty, skip seed" >&2
  exit 0
fi

echo "init-db: loading $DUMP_FILE into database $DB_NAME"

# pg_dump from local PostgreSQL 18 may include settings incompatible with postgres:16-alpine.
sed -e '/^\\restrict/d' \
    -e '/^\\unrestrict/d' \
    -e '/OWNER TO /d' \
    -e '/SET transaction_timeout/d' \
    "$DUMP_FILE" | psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"
