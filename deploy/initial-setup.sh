#!/bin/bash

# Initial Server Setup Script for EngRisk Student Management
# Run this script once on a fresh server

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

# Logging
LOG_FILE="/var/log/engrisk-setup.log"
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

# Update system
update_system() {
    log "Updating system packages..."
    apt-get update -y
    apt-get upgrade -y
    success "System updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old Docker versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Install prerequisites
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Get latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
}

# Install other dependencies
install_dependencies() {
    log "Installing additional dependencies..."
    
    apt-get install -y \
        git \
        curl \
        wget \
        jq \
        htop \
        vim \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    success "Dependencies installed"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Install ufw if not present
    apt-get install -y ufw
    
    # Configure firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow custom port if needed
    ufw allow 24700/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create application directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone repository
    git clone $REPO_URL .
    
    # Set proper permissions
    chown -R www-data:www-data $APP_DIR
    chmod -R 755 $APP_DIR
    
    success "Application directory setup completed"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    # Create .env file for backend
    cat > $APP_DIR/be/.env << EOF
DATABASE_URL="postgresql://engrisk_user:EngRisk2024!SecureDB#789@engrisk-postgres:5432/student_management"
JWT_SECRET="EngRisk2024!JWTSecretKey#456!Production"
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://msjenny.io.vn"
API_PREFIX="api/v1"
EOF

    # Create .env file for frontend
    cat > $APP_DIR/fe/.env.local << EOF
NEXT_PUBLIC_API_URL=https://msjenny.io.vn/api/v1
NODE_ENV=production
EOF

    success "Environment variables configured"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Install certbot
    apt-get install -y certbot python3-certbot-nginx
    
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
    log "Obtaining SSL certificate..."
    certbot certonly --webroot -w /var/www/certbot -d msjenny.io.vn -d www.msjenny.io.vn --non-interactive --agree-tos --email admin@msjenny.io.vn
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    success "SSL certificates configured"
}

# Setup systemd services
setup_services() {
    log "Setting up systemd services..."
    
    # Create auto-deploy service
    cat > /etc/systemd/system/engrisk-auto-deploy.service << EOF
[Unit]
Description=EngRisk Auto Deploy Service
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/deploy/auto-deploy.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Create auto-deploy timer
    cat > /etc/systemd/system/engrisk-auto-deploy.timer << EOF
[Unit]
Description=Run EngRisk Auto Deploy every 6 hours
Requires=engrisk-auto-deploy.service

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Enable services
    systemctl daemon-reload
    systemctl enable engrisk-auto-deploy.timer
    systemctl start engrisk-auto-deploy.timer
    
    success "Systemd services configured"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create log rotation
    cat > /etc/logrotate.d/engrisk << EOF
/var/log/engrisk-*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

    # Create monitoring script
    cat > /usr/local/bin/engrisk-monitor.sh << 'EOF'
#!/bin/bash
# EngRisk Monitoring Script

LOG_FILE="/var/log/engrisk-monitor.log"
APP_DIR="/var/www/engrisk-student-management"

echo "$(date): Checking EngRisk services..." >> $LOG_FILE

# Check if containers are running
if ! docker ps --format "table {{.Names}}" | grep -q "engrisk-backend"; then
    echo "$(date): Backend container is not running!" >> $LOG_FILE
    cd $APP_DIR && docker-compose -f docker-compose.prod.yml up -d backend
fi

if ! docker ps --format "table {{.Names}}" | grep -q "engrisk-frontend"; then
    echo "$(date): Frontend container is not running!" >> $LOG_FILE
    cd $APP_DIR && docker-compose -f docker-compose.prod.yml up -d frontend
fi

if ! docker ps --format "table {{.Names}}" | grep -q "engrisk-nginx"; then
    echo "$(date): Nginx container is not running!" >> $LOG_FILE
    cd $APP_DIR && docker-compose -f docker-compose.prod.yml up -d nginx
fi

echo "$(date): Monitoring check completed" >> $LOG_FILE
EOF

    chmod +x /usr/local/bin/engrisk-monitor.sh
    
    # Add to crontab
    echo "*/5 * * * * /usr/local/bin/engrisk-monitor.sh" | crontab -
    
    success "Monitoring configured"
}

# Main setup function
main() {
    log "Starting EngRisk Student Management initial setup..."
    
    check_root
    update_system
    install_docker
    install_docker_compose
    install_dependencies
    setup_firewall
    setup_app_directory
    setup_environment
    setup_ssl
    setup_services
    setup_monitoring
    
    success "Initial setup completed successfully!"
    log "Next steps:"
    log "1. Configure GitHub secrets in your repository"
    log "2. Run the auto-deploy script: $APP_DIR/deploy/auto-deploy.sh"
    log "3. Your application will be available at: https://msjenny.io.vn"
}

# Run main function
main "$@"
