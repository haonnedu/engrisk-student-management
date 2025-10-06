#!/bin/bash

# Manual deployment script for msjenny.io.vn
# Server: 103.216.117.100:24700

set -e

echo "🚀 Deploying EngRisk Student Management to msjenny.io.vn..."

# Server details
HOST="103.216.117.100"
PORT="24700"
USER="root"
PASSWORD="tMlB5PJbeO7%rJpJE#Wc"
DOMAIN="msjenny.io.vn"

# Connect to server and deploy
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $USER@$HOST << 'EOF'
    echo "📁 Updating application directory..."
    cd /var/www/engrisk-student-management
    
    # Clone or pull latest code
    if [ -d ".git" ]; then
        echo "📥 Pulling latest code..."
        git pull origin main
    else
        echo "📥 Cloning repository..."
        git clone https://github.com/haonnedu/engrisk-student-management.git .
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    cd be
    npm ci --production
    
    cd ../fe
    npm ci --production
    
    # Build applications
    echo "🔨 Building applications..."
    npm run build
    
    cd ../be
    npm run build
    
    # Setup database
    echo "🌱 Setting up database..."
    npm run deploy:setup
    
    # Restart services
    echo "🔄 Restarting services..."
    systemctl restart engrisk-backend
    systemctl reload nginx
    
    echo "✅ Deployment completed successfully!"
    echo "🌐 Application available at: https://msjenny.io.vn"
    echo "🔑 Admin login: admin@engrisk.com / admin123"
EOF

echo "🎉 Deployment completed!"
echo "🌐 Visit: https://msjenny.io.vn"
echo "🔑 Login: admin@engrisk.com / admin123"
