# 🚀 EngRisk Student Management - Deployment Guide

## 📋 Server Information

- **IP Address**: 103.216.117.100
- **SSH Port**: 24700
- **Username**: root
- **Password**: tMlB5PJbeO7%rJpJE#Wc
- **Domain**: msjenny.io.vn

## 🛠️ Prerequisites

### Local Machine

- Node.js 18+
- Git
- SSH client
- sshpass (for automated deployment)

### Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Root access
- Internet connection

## 🚀 Deployment Methods

### Method 1: Automated Setup (Recommended for first time)

1. **Connect to server**:

   ```bash
   ssh -p 24700 root@103.216.117.100
   ```

2. **Run setup script**:

   ```bash
   wget https://raw.githubusercontent.com/your-username/engrisk-student-management/main/deploy/setup.sh
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/engrisk-student-management.git /var/www/engrisk-student-management
   cd /var/www/engrisk-student-management
   ```

### Method 2: Manual Deployment

1. **Install dependencies locally**:

   ```bash
   # Install sshpass
   sudo apt install sshpass  # Ubuntu/Debian
   # or
   brew install sshpass      # macOS
   ```

2. **Run deployment script**:
   ```bash
   chmod +x deploy/deploy-manual.sh
   ./deploy/deploy-manual.sh
   ```

### Method 3: GitHub Actions (Automated)

1. **Setup GitHub Secrets**:

   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Add the following secrets:
     - `DATABASE_URL`: `postgresql://engrisk_user:your-secure-password@localhost:5432/student_management`

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

## 🔧 Manual Server Setup

### 1. Update System

```bash
apt update && apt upgrade -y
```

### 2. Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 3. Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 4. Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 5. Setup Database

```bash
sudo -u postgres psql
CREATE DATABASE student_management;
CREATE USER engrisk_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE student_management TO engrisk_user;
\q
```

### 6. Deploy Application

```bash
mkdir -p /var/www/engrisk-student-management
cd /var/www/engrisk-student-management
git clone https://github.com/your-username/engrisk-student-management.git .

# Backend
cd be
npm ci --production
npm run build
npm run deploy:setup

# Frontend
cd ../fe
npm ci --production
npm run build
```

### 7. Setup Services

**Backend Service**:

```bash
cp deploy/engrisk-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable engrisk-backend
systemctl start engrisk-backend
```

**Nginx Configuration**:

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/engrisk
ln -s /etc/nginx/sites-available/engrisk /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 8. Setup SSL

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d msjenny.io.vn -d www.msjenny.io.vn
```

## 🔍 Verification

### Check Services

```bash
# Backend service
systemctl status engrisk-backend

# Nginx
systemctl status nginx

# Database
systemctl status postgresql
```

### Check Logs

```bash
# Backend logs
journalctl -u engrisk-backend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Test Application

- Visit: https://msjenny.io.vn
- Login: admin@engrisk.com / admin123

## 🔄 Updates

### Manual Update

```bash
cd /var/www/engrisk-student-management
git pull origin main
cd be && npm ci --production && npm run build
cd ../fe && npm ci --production && npm run build
cd ../be && npm run deploy:setup
systemctl restart engrisk-backend
```

### Automated Update

Push to main branch - GitHub Actions will handle the deployment automatically.

## 🛡️ Security

### Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### Database Security

- Change default passwords
- Use strong passwords
- Enable SSL for database connections
- Regular backups

### Application Security

- Update JWT secret
- Use environment variables for sensitive data
- Regular security updates
- Monitor logs

## 📊 Monitoring

### Health Checks

- Backend: `curl http://localhost:3001/api/v1/health`
- Frontend: `curl https://msjenny.io.vn`

### Log Monitoring

```bash
# Real-time logs
journalctl -u engrisk-backend -f

# Error logs
journalctl -u engrisk-backend --since "1 hour ago" | grep ERROR
```

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**:

   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Database connection failed**:

   ```bash
   systemctl restart postgresql
   sudo -u postgres psql -c "SELECT 1"
   ```

3. **Nginx configuration error**:

   ```bash
   nginx -t
   systemctl reload nginx
   ```

4. **Permission denied**:
   ```bash
   chown -R www-data:www-data /var/www/engrisk-student-management
   ```

### Support

- Check logs: `journalctl -u engrisk-backend -f`
- Verify services: `systemctl status engrisk-backend nginx postgresql`
- Test connectivity: `curl https://msjenny.io.vn`

## 📝 Default Credentials

- **Admin Email**: admin@engrisk.com
- **Admin Password**: admin123
- **Database**: student_management
- **Database User**: engrisk_user
- **Database Password**: your-secure-password

## 🔗 URLs

- **Production**: https://msjenny.io.vn
- **API**: https://msjenny.io.vn/api/v1
- **Health Check**: https://msjenny.io.vn/api/v1/health
