#!/bin/bash

# Database setup script for production
set -e

echo "🗄️ Setting up database for production..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..60}; do
    if docker exec engrisk-postgres pg_isready -U engrisk_user -d student_management >/dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    echo "⏳ Waiting for database... ($i/60)"
    sleep 2
done

# Check if database is ready
if ! docker exec engrisk-postgres pg_isready -U engrisk_user -d student_management >/dev/null 2>&1; then
    echo "❌ Database is not ready after 2 minutes"
    exit 1
fi

# Run Prisma migration
echo "🔄 Running database migration..."
npx prisma migrate deploy

# Check if database is empty
echo "🔍 Checking if database needs seeding..."
USER_COUNT=$(docker exec engrisk-postgres psql -U engrisk_user -d student_management -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Database is empty, running seed script..."
    node scripts/seed-data.js
else
    echo "✅ Database already has $USER_COUNT users, skipping seed..."
fi

echo "🎉 Database setup completed successfully!"
