#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/opt/it-quanlytaisan/.env"
BACKUP_ROOT="/var/backups/it-quanlytaisan"
UPLOAD_ROOT="/var/lib/it-quanlytaisan/uploads"

if [[ ! -f "$ENV_FILE" ]]; then echo "Missing $ENV_FILE" >&2; exit 1; fi
source "$ENV_FILE"
mkdir -p "$BACKUP_ROOT"
STAMP="$(date +%Y%m%d-%H%M%S)"

DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
DB_HOST="$(printf '%s' "$DB_URL" | sed -E 's#mysql://[^:]+:[^@]+@([^:/]+)(:[0-9]+)?/.*#\1#')"
DB_PORT="$(printf '%s' "$DB_URL" | sed -nE 's#mysql://[^:]+:[^@]+@[^:/]+:([0-9]+)/.*#\1#p')"
DB_PORT="${DB_PORT:-3306}"
DB_USER="$(printf '%s' "$DB_URL" | sed -E 's#mysql://([^:]+):.*#\1#')"
DB_PASS="$(printf '%s' "$DB_URL" | sed -E 's#mysql://[^:]+:([^@]+)@.*#\1#')"
DB_NAME="$(printf '%s' "$DB_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')"

mysqldump --single-transaction --quick --routines --triggers \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  | gzip > "$BACKUP_ROOT/db-$STAMP.sql.gz"

if [[ -d "$UPLOAD_ROOT" ]]; then
  tar -C "$(dirname "$UPLOAD_ROOT")" -czf "$BACKUP_ROOT/uploads-$STAMP.tar.gz" "$(basename "$UPLOAD_ROOT")"
fi

find "$BACKUP_ROOT" -type f -mtime +14 -delete
printf 'Backup completed: %s\n' "$STAMP"
