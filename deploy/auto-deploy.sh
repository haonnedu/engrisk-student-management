#!/bin/bash

# Auto Deploy Script for EngRisk Student Management
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/engrisk-student-management"
REPO_URL="https://github.com/haonnedu/engrisk-student-management.git"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/var/backups/engrisk"

# Logging
LOG_FILE="/var/log/engrisk-deploy.log"
exec > >(tee -a $LOG_FILE)
exec 2>&1

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root (use sudo)"
        exit 1
    fi
}

# Install required packages
install_dependencies() {
    log "Installing required packages..."
    
    # Update package list
    apt-get update -y
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose if not present
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Install other dependencies
    apt-get install -y git curl wget jq
    
    success "Dependencies installed successfully"
}

# Setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create application directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone or update repository
    if [ -d ".git" ]; then
        log "Repository exists, pulling latest changes..."
        git fetch origin
        git reset --hard origin/main
    else
        log "Cloning repository..."
        git clone $REPO_URL .
    fi
    
    success "Application directory setup completed"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Create nginx config for certbot
    cat > /etc/nginx/sites-available/engrisk-certbot << EOF
server {
    listen 80;
    server_name msjenny.io.vn www.msjenny.io.vn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/engrisk-certbot /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    # Create certbot directory
    mkdir -p /var/www/certbot
    
    # Get SSL certificate
    if [ ! -f "/etc/letsencrypt/live/msjenny.io.vn/fullchain.pem" ]; then
        log "Obtaining SSL certificate..."
        certbot certonly --webroot -w /var/www/certbot -d msjenny.io.vn -d www.msjenny.io.vn --non-interactive --agree-tos --email admin@msjenny.io.vn
    else
        log "SSL certificate already exists, renewing..."
        certbot renew --quiet
    fi
    
    success "SSL setup completed"
}

# Backup existing data
backup_data() {
    log "Creating backup..."
    
    # Create backup directory
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if docker ps --format "table {{.Names}}" | grep -q "engrisk-postgres"; then
        log "Backing up database..."
        docker exec engrisk-postgres pg_dump -U engrisk_user student_management > $BACKUP_DIR/database_$(date +%Y%m%d_%H%M%S).sql
    fi
    
    # Backup application files
    if [ -d "$APP_DIR" ]; then
        log "Backing up application files..."
        tar -czf $BACKUP_DIR/app_$(date +%Y%m%d_%H%M%S).tar.gz -C $APP_DIR .
    fi
    
    success "Backup completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    cd $APP_DIR
    
    # Login to GitHub Container Registry
    log "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker pull ghcr.io/haonnedu/engrisk-student-management-backend:latest
    docker pull ghcr.io/haonnedu/engrisk-student-management-frontend:latest
    docker pull ghcr.io/haonnedu/engrisk-student-management-nginx:latest
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down || true
    
    # Create network if not exists
    docker network create engrisk-network || true
    
    # Start database if not running
    if ! docker ps --format "table {{.Names}}" | grep -q "engrisk-postgres"; then
        log "Starting database container..."
        docker-compose -f docker-compose.yml up -d postgres
        sleep 10
    fi
    
    # Run database migrations
    log "Running database migrations..."
    docker run --rm --network engrisk-network \
      -e DATABASE_URL="postgresql://engrisk_user:EngRisk2024!SecureDB#789@engrisk-postgres:5432/student_management" \
      ghcr.io/haonnedu/engrisk-student-management-backend:latest \
      npx prisma migrate deploy
    
    # Start application stack
    log "Starting application stack..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    success "Application deployed successfully"
}

# Health check
health_check() {
    log "Running health checks..."
    
    # Check backend
    if curl -f http://localhost/api/v1/health > /dev/null 2>&1; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    success "All health checks passed"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    docker image prune -f
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting EngRisk Student Management deployment..."
    
    check_root
    install_dependencies
    setup_app_directory
    setup_ssl
    backup_data
    deploy_application
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    log "Application is available at: https://msjenny.io.vn"
}

# Run main function
main "$@"
