#!/bin/bash

# Setup Docker and PostgreSQL container before deployment
# Run this script on the server before running GitHub Actions

set -e

echo "🐳 Setting up Docker and PostgreSQL container..."

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional)
sudo usermod -aG docker $USER

# Check Docker status
echo "✅ Docker status:"
sudo systemctl status docker --no-pager

# Create application directory if not exists
if [ ! -d "/var/www/engrisk-student-management" ]; then
    echo "📁 Creating application directory..."
    sudo mkdir -p /var/www/engrisk-student-management
    sudo chown -R $USER:$USER /var/www/engrisk-student-management
fi

# Clone repository if not exists
if [ ! -d "/var/www/engrisk-student-management/.git" ]; then
    echo "📥 Cloning repository..."
    cd /var/www/engrisk-student-management
    git clone https://github.com/haonnedu/engrisk-student-management.git .
fi

# Copy Docker Compose file
echo "📋 Copying Docker Compose configuration..."
cp deploy/docker-compose.database.yml docker-compose.database.yml

# Start PostgreSQL container
echo "🗄️ Starting PostgreSQL container..."
sudo docker-compose -f docker-compose.database.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if sudo docker exec engrisk-postgres pg_isready -U engrisk_user -d student_management >/dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    echo "Waiting for database... ($i/30)"
    sleep 10
done

# Check container status
echo "📊 Container status:"
sudo docker ps -a | grep engrisk-postgres

# Test database connection
echo "🔍 Testing database connection..."
if sudo docker exec engrisk-postgres pg_isready -U engrisk_user -d student_management; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Container logs:"
    sudo docker logs engrisk-postgres
    exit 1
fi

echo "🎉 Docker setup completed successfully!"
echo "You can now run the GitHub Actions deployment."
