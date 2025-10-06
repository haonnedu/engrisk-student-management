#!/bin/bash

# Quick deployment script for msjenny.io.vn
# This script will deploy the application to your server

set -e

echo "🚀 Quick Deploy to msjenny.io.vn"
echo "Server: 103.216.117.100:24700"
echo "Domain: msjenny.io.vn"
echo ""

# Server details
HOST="103.216.117.100"
PORT="24700"
USER="root"
PASSWORD="tMlB5PJbeO7%rJpJE#Wc"

echo "📋 This script will:"
echo "1. Connect to your server"
echo "2. Pull latest code from GitHub"
echo "3. Install dependencies"
echo "4. Build applications"
echo "5. Setup database with sample data"
echo "6. Restart services"
echo ""

read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔌 Connecting to server..."

# Connect and deploy
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $USER@$HOST << 'EOF'
    echo "📁 Updating application..."
    cd /var/www/engrisk-student-management
    
    # Pull latest code
    echo "📥 Pulling latest code..."
    git pull origin main
    
    # Install backend dependencies
    echo "📦 Installing backend dependencies..."
    cd be
    npm ci --production
    
    # Install frontend dependencies
    echo "📦 Installing frontend dependencies..."
    cd ../fe
    npm ci --production
    
    # Build frontend
    echo "🔨 Building frontend..."
    npm run build
    
    # Build backend
    echo "🔨 Building backend..."
    cd ../be
    npm run build
    
    # Setup database with sample data
    echo "🌱 Setting up database with sample data..."
    npm run deploy:setup
    
    # Restart services
    echo "🔄 Restarting services..."
    systemctl restart engrisk-backend
    systemctl reload nginx
    
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🌐 Application is now available at: https://msjenny.io.vn"
    echo "🔑 Admin login: admin@engrisk.com / admin123"
    echo ""
    echo "📊 Sample data includes:"
    echo "- 1 Super Admin user"
    echo "- 8 Grade Types (HW, SP, PP, Tests, Final)"
    echo "- 1 Sample Course (ENG101 - English Fundamentals)"
    echo "- 1 Sample Class (ENG101-A1)"
    echo "- 3 Sample Students with enrollments and grades"
    echo ""
    echo "🔍 Check logs: journalctl -u engrisk-backend -f"
EOF

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Visit: https://msjenny.io.vn"
echo "🔑 Login: admin@engrisk.com / admin123"
echo ""
echo "📝 Next steps:"
echo "1. Test the application at https://msjenny.io.vn"
echo "2. Change default passwords in production"
echo "3. Setup SSL certificate if not already done"
echo "4. Configure monitoring and backups"
