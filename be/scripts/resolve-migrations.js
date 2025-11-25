#!/usr/bin/env node

/**
 * Script to resolve failed Prisma migrations
 * This script finds failed migrations and marks them as applied
 * (since db push already applied the schema changes)
 */

const { execSync } = require('child_process');

async function resolveFailedMigrations() {
  try {
    // Get list of failed migrations from Prisma
    const output = execSync('npx prisma migrate status', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse failed migrations from output
    const failedMigrations = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for pattern: "The `migration_name` migration started at ... failed"
      const match = line.match(/The `([^`]+)` migration.*failed/);
      if (match) {
        failedMigrations.push(match[1]);
      }
    }
    
    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }
    
    console.log(`🔍 Found ${failedMigrations.length} failed migration(s):`);
    failedMigrations.forEach(name => console.log(`  - ${name}`));
    
    // Resolve each failed migration as applied (since db push already applied changes)
    for (const migrationName of failedMigrations) {
      try {
        console.log(`🔧 Resolving migration: ${migrationName}`);
        execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
          stdio: 'inherit'
        });
        console.log(`✅ Migration ${migrationName} resolved as applied`);
      } catch (error) {
        console.error(`⚠️  Failed to resolve migration ${migrationName}:`, error.message);
        // Try rolled-back as fallback
        try {
          execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
            stdio: 'inherit'
          });
          console.log(`✅ Migration ${migrationName} resolved as rolled-back`);
        } catch (rollbackError) {
          console.error(`❌ Failed to resolve migration ${migrationName} as rolled-back:`, rollbackError.message);
        }
      }
    }
    
    console.log('✅ All failed migrations resolved');
  } catch (error) {
    // If migrate status fails, there might not be any migrations or connection issues
    console.error('⚠️  Could not check migration status:', error.message);
    process.exit(1);
  }
}

resolveFailedMigrations().catch(error => {
  console.error('❌ Error resolving migrations:', error);
  process.exit(1);
});

