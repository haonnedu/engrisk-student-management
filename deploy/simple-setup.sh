#!/bin/bash

# Simple Docker setup script
# Copy this entire script and paste into your server terminal

echo "🐳 Setting up Docker and PostgreSQL..."

# Update system
echo "📦 Updating system..."
sudo apt update

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Check Docker status
echo "✅ Docker status:"
sudo systemctl status docker --no-pager

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/engrisk-student-management
sudo chown -R root:root /var/www/engrisk-student-management
cd /var/www/engrisk-student-management

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/haonnedu/engrisk-student-management.git .

# Create Docker Compose file
echo "📋 Creating Docker Compose file..."
cat > docker-compose.database.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: engrisk-postgres
    environment:
      POSTGRES_DB: student_management
      POSTGRES_USER: engrisk_user
      POSTGRES_PASSWORD: EngRisk2024!SecureDB#789
    ports:
      - "5432:5432"
    volumes:
      - engrisk_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  engrisk_postgres_data:
EOF

# Start PostgreSQL container
echo "🗄️ Starting PostgreSQL container..."
sudo docker-compose -f docker-compose.database.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if sudo docker exec engrisk-postgres pg_isready -U engrisk_user -d student_management >/dev/null 2>&1; then
        echo "✅ Database is ready! (attempt $i/30)"
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
fi

echo "🎉 Setup completed!"
echo "You can now run GitHub Actions deployment."
