#!/bin/bash
set -euo pipefail

sed -e '/^\\restrict/d' \
    -e '/^\\unrestrict/d' \
    -e '/OWNER TO anton/d' \
    /seed/dump.sql | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"
