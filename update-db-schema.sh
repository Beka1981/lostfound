#!/bin/bash
set -e

cd /var/www/myapi

sudo -u postgres pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  myapi_db \
  > docs/database/schema.sql

git add docs/database/schema.sql

if ! git diff --cached --quiet; then
  git commit -m "Auto update database schema"
  git push origin main
fi
