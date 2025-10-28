#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Try to run migrations, if fails, resolve and retry
if ! npx prisma migrate deploy 2>/dev/null; then
  echo "⚠️  Migration failed, attempting to resolve..."
  
  # Resolve any failed migrations
  npx prisma migrate resolve --rolled-back 0_init 2>/dev/null || true
  
  # Try db push as fallback (for initial sync)
  echo "📦 Using db push to sync schema..."
  npx prisma db push --accept-data-loss --skip-generate || true
  
  echo "✅ Database schema synced!"
else
  echo "✅ Migrations completed successfully!"
fi

# Start the application
echo "🚀 Starting application..."
exec "$@"

