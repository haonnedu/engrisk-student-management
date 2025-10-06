#!/bin/bash

# Database backup script for EngRisk Student Management
# This script creates a backup of the PostgreSQL database

set -e

BACKUP_DIR="/var/backups/engrisk"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="engrisk_backup_${DATE}.sql"

echo "🗄️ Creating database backup..."

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Create backup
sudo docker exec engrisk-postgres pg_dump -U engrisk_user -d student_management > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

echo "✅ Backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t engrisk_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "🧹 Cleaned up old backups (keeping last 7)"
