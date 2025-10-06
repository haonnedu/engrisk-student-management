# 🚀 Deployment Guide

## 📋 Prerequisites

- Linux server with root access
- Domain name pointing to server IP
- GitHub repository with code

## 🔧 Server Information

- **IP**: 103.216.117.100
- **Username**: root
- **Password**: tMlB5PJbeO7%rJpJE#Wc
- **SSH Port**: 24700
- **Domain**: msjenny.io.vn

## 🚀 Quick Start

### Option 1: Setup Docker First (Recommended)

1. **Docker already setup on server** ✅
2. **Push code to GitHub** (triggers automatic deployment)

### Option 2: Manual Deployment

1. **Quick deploy**:

   ```bash
   # Quick deploy
   chmod +x deploy/quick-deploy.sh
   ./deploy/quick-deploy.sh

   # Or manual deploy
   chmod +x deploy/deploy-manual.sh
   ./deploy/deploy-manual.sh
   ```

## 🐳 Docker Setup

The deployment uses Docker for PostgreSQL database with persistent storage.

### Manual Docker Setup

```bash
# SSH into server
ssh -p 24700 root@103.216.117.100

# Run setup script
chmod +x /tmp/setup-docker.sh
/tmp/setup-docker.sh
```

## 🔄 GitHub Actions

The deployment is automated via GitHub Actions:

1. **Triggers**: Push to `main` branch
2. **Steps**:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Build frontend and backend
   - Setup Docker and PostgreSQL
   - Deploy to server
   - Configure Nginx
   - Setup systemd services

## 🗄️ Database

- **Type**: PostgreSQL (Docker container)
- **Container**: engrisk-postgres
- **Database**: student_management
- **User**: engrisk_user
- **Password**: EngRisk2024!SecureDB#789
- **Port**: 5432

## 🌐 Services

- **Frontend**: Next.js (port 3000)
- **Backend**: NestJS (port 3001)
- **Database**: PostgreSQL (port 5432)
- **Web Server**: Nginx (port 80/443)

## 📁 File Structure

```
/var/www/engrisk-student-management/
├── fe/                 # Frontend (Next.js)
├── be/                 # Backend (NestJS)
├── deploy/             # Deployment scripts
└── docker-compose.database.yml
```

## 🔧 Troubleshooting

### Database Issues

```bash
# Check Docker container
sudo docker ps -a | grep engrisk-postgres

# Check container logs
sudo docker logs engrisk-postgres

# Restart container
sudo docker restart engrisk-postgres
```

### Service Issues

```bash
# Check service status
sudo systemctl status engrisk-backend
sudo systemctl status engrisk-frontend

# Restart services
sudo systemctl restart engrisk-backend
sudo systemctl restart engrisk-frontend
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

## 🔐 Security

- SSL certificates via Let's Encrypt
- Firewall configured (UFW)
- Secure passwords for database and JWT
- CORS configured for production domain

## 📊 Monitoring

- Check application logs: `journalctl -u engrisk-backend -f`
- Check frontend logs: `journalctl -u engrisk-frontend -f`
- Check Nginx logs: `sudo tail -f /var/log/nginx/access.log`

## 🆘 Support

If you encounter issues:

1. Check GitHub Actions logs
2. SSH into server and check service status
3. Check Docker container logs
4. Verify database connection
5. Check Nginx configuration

## 📝 Notes

- Database data persists between deployments (Docker volume)
- SSL certificates auto-renew via certbot
- Services auto-restart on failure
- All passwords are securely generated
