#!/bin/bash
# start.sh — Waits for the PostgreSQL database to be ready before
# running migrations, seeding, and starting the FastAPI server.
# This is necessary on PaaS platforms (Render, Railway) where the
# database and backend containers start simultaneously.

set -e

MAX_RETRIES=30
RETRY_INTERVAL=3

echo "⏳ Waiting for database to be ready..."
# Debug: show what DATABASE_URL host we are targeting (password masked)
echo "  → DATABASE_URL = $(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/\/\/***:***@/')"

for i in $(seq 1 $MAX_RETRIES); do
    python -c "
import asyncio, asyncpg, os, sys

async def check():
    url = os.environ.get('DATABASE_URL', '')
    if not url:
        print('ERROR: DATABASE_URL is not set!', file=sys.stderr)
        sys.exit(1)
    # Strip SQLAlchemy driver prefix and query params for asyncpg raw check
    base_url = url.split('?')[0]
    base_url = base_url.replace('postgresql+asyncpg://', 'postgresql://').replace('postgres://', 'postgresql://')
    # Try SSL first (required for Render external connections), then plain
    for ssl_mode in ('require', False):
        try:
            conn = await asyncpg.connect(dsn=base_url, ssl=ssl_mode)
            await conn.close()
            sys.exit(0)
        except Exception as e:
            last_err = e
    print(f'  Not ready: {last_err}', file=sys.stderr)
    sys.exit(1)

asyncio.run(check())
" && echo "✅ Database is ready!" && break

    echo "  Retrying in ${RETRY_INTERVAL}s... (attempt $i / $MAX_RETRIES)"
    sleep $RETRY_INTERVAL

    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "❌ Database did not become ready in time. Exiting."
        exit 1
    fi
done

echo "🔄 Running database migrations..."
alembic upgrade head

echo "🌱 Seeding database (skipped if already seeded)..."
python seed_data.py

echo "🚀 Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
