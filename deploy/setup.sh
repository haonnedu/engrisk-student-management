#!/bin/bash

# EngRisk Student Management - Cloud Linux Setup Script

set -e

echo "🚀 Setting up EngRisk Student Management on Cloud Linux..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install PM2 for process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/engrisk-student-management
sudo chown -R $USER:$USER /var/www/engrisk-student-management

# Clone repository
echo "📥 Cloning repository..."
cd /var/www/engrisk-student-management
git clone https://github.com/haonnedu/engrisk-student-management.git .

# Install dependencies
echo "📦 Installing dependencies..."
cd be
npm ci --production

cd ../fe
npm ci --production

# Build applications
echo "🔨 Building applications..."
cd ../fe
npm run build

cd ../be
npm run build

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE student_management;"
sudo -u postgres psql -c "CREATE USER engrisk_user WITH PASSWORD 'EngRisk2024!SecureDB#789';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE student_management TO engrisk_user;"

# Setup environment variables
echo "⚙️ Setting up environment variables..."
cat > /var/www/engrisk-student-management/be/.env << EOF
DATABASE_URL="postgresql://engrisk_user:EngRisk2024!SecureDB#789@localhost:5432/student_management"
JWT_SECRET="EngRisk2024!JWTSecretKey#456!Production"
NODE_ENV="production"
PORT=3001
EOF

# Run database migrations and seed data
echo "🌱 Setting up database..."
cd /var/www/engrisk-student-management/be
npm run deploy:setup

# Setup systemd service
echo "⚙️ Setting up systemd service..."
sudo cp /var/www/engrisk-student-management/deploy/engrisk-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable engrisk-backend
sudo systemctl start engrisk-backend

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo cp /var/www/engrisk-student-management/deploy/nginx.conf /etc/nginx/sites-available/engrisk
sudo ln -s /etc/nginx/sites-available/engrisk /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL with Let's Encrypt..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d msjenny.io.vn -d www.msjenny.io.vn

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/engrisk << EOF
/var/log/engrisk/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload engrisk-backend
    endscript
}
EOF

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the application at https://msjenny.io.vn"
echo "2. Setup GitHub secrets for automated deployment"
echo "3. Monitor logs: sudo journalctl -u engrisk-backend -f"
echo ""
echo "🔑 Default credentials:"
echo "Email: admin@engrisk.com"
echo "Password: admin123"
echo ""
echo "📊 Database:"
echo "Host: localhost"
echo "Database: student_management"
echo "User: engrisk_user"
echo "Password: your-secure-password"
