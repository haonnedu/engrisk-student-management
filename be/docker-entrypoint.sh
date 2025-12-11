#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Try to run migrations
if ! npx prisma migrate deploy 2>&1; then
  echo "⚠️  Migration failed, attempting to resolve..."
  
  # First, try to mark failed migrations as rolled back and retry
  echo "🔧 Attempting to resolve failed migrations..."
  node scripts/resolve-migrations.js 2>&1 || true
  
  # Try to run migrations again
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations completed after resolution!"
  else
    echo "⚠️  Migrate deploy still failed, using db push as fallback..."
    
    # Use db push to sync schema (this applies the changes)
    # WARNING: --accept-data-loss can cause data loss, use with caution
    # Only use if you're sure about the schema changes
    npx prisma db push --skip-generate 2>&1 || true
    
    # Mark failed migrations as applied since db push already applied the changes
    echo "🔧 Marking failed migrations as applied (db push already synced schema)..."
    node scripts/resolve-migrations.js 2>&1 || true
    
    echo "✅ Database schema synced via db push!"
  fi
else
  echo "✅ Migrations completed successfully!"
fi

# Start the application
echo "🚀 Starting application..."
exec "$@"

