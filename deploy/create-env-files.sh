#!/bin/bash

# Script để tạo file .env trên server
# Chạy script này trên server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Creating .env files on server...${NC}"

# Tạo thư mục
mkdir -p /var/www/engrisk-student-management/be
mkdir -p /var/www/engrisk-student-management/fe

# Tạo file be/.env
cat > /var/www/engrisk-student-management/be/.env << 'EOF'
# Database
DATABASE_URL="postgresql://engrisk_user:EngRisk2024!SecureDB#789@engrisk-postgres:5432/student_management"

# JWT
JWT_SECRET="EngRisk2024!JWTSecretKey#456!Production"

# Application
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://msjenny.io.vn"
API_PREFIX="api/v1"

# CORS
CORS_ORIGIN="https://msjenny.io.vn"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
EOF

# Tạo file fe/.env.local
cat > /var/www/engrisk-student-management/fe/.env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL="https://msjenny.io.vn/api/v1"

# Application
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# Build Configuration
NEXT_PUBLIC_APP_NAME="EngRisk Student Management"
NEXT_PUBLIC_APP_VERSION="1.0.0"
EOF

# Set permissions
chmod 600 /var/www/engrisk-student-management/be/.env
chmod 600 /var/www/engrisk-student-management/fe/.env.local
chown -R www-data:www-data /var/www/engrisk-student-management

echo -e "${GREEN}✅ .env files created successfully!${NC}"
echo -e "${BLUE}Files created:${NC}"
echo "- /var/www/engrisk-student-management/be/.env"
echo "- /var/www/engrisk-student-management/fe/.env.local"
