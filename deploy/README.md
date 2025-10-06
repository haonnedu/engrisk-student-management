# EngRisk Student Management - Docker Deployment

Hệ thống deploy tự động sử dụng Docker và GitHub Actions cho ứng dụng EngRisk Student Management.

## 🚀 Tính năng

- **Docker-based deployment**: Sử dụng Docker containers cho tất cả services
- **GitHub Actions CI/CD**: Tự động build và deploy khi push code
- **SSL/TLS**: Tự động cấu hình SSL certificates với Let's Encrypt
- **Health checks**: Kiểm tra sức khỏe của các services
- **Auto-scaling**: Tự động restart services khi cần thiết
- **Monitoring**: Giám sát và log tự động

## 📋 Yêu cầu hệ thống

- Ubuntu 20.04+ hoặc tương đương
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 2GB RAM tối thiểu
- 10GB disk space

## 🛠️ Cài đặt ban đầu

### 1. Chạy script setup trên server

```bash
# SSH vào server
ssh root@your-server-ip

# Tải và chạy script setup
wget https://raw.githubusercontent.com/haonnedu/engrisk-student-management/main/deploy/initial-setup.sh
chmod +x initial-setup.sh
./initial-setup.sh
```

### 2. Cấu hình GitHub Secrets

Thêm các secrets sau vào GitHub repository (Settings > Secrets and variables > Actions):

```
PROD_HOST=your-server-ip
PROD_USER=root
PROD_SSH_KEY=your-ssh-private-key
PROD_PORT=22
GITHUB_TOKEN=your-github-token
```

### 3. Cấu hình DNS

Trỏ domain `msjenny.io.vn` và `www.msjenny.io.vn` về IP server của bạn.

## 🔄 Quy trình Deploy

### Tự động (GitHub Actions)

1. Push code lên branch `main`
2. GitHub Actions sẽ tự động:
   - Build Docker images
   - Push images lên GitHub Container Registry
   - Deploy lên production server
   - Chạy health checks

### Thủ công

```bash
# SSH vào server
ssh root@your-server-ip

# Chạy script deploy
cd /var/www/engrisk-student-management
./deploy/auto-deploy.sh
```

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Frontend      │────│   Backend       │
│   (Port 80/443) │    │   (Next.js)     │    │   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   Database      │
                                               └─────────────────┘
```

## 📁 Cấu trúc thư mục

```
deploy/
├── nginx/                    # Nginx configuration
│   ├── Dockerfile
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── auto-deploy.sh            # Script deploy tự động
├── initial-setup.sh          # Script setup ban đầu
└── README.md                 # Tài liệu này
```

## 🔧 Cấu hình

### Environment Variables

#### Backend (.env)

```env
DATABASE_URL=postgresql://engrisk_user:password@engrisk-postgres:5432/student_management
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://msjenny.io.vn
API_PREFIX=api/v1
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://msjenny.io.vn/api/v1
NODE_ENV=production
```

### Docker Compose

File `docker-compose.prod.yml` chứa cấu hình production với:

- PostgreSQL database
- Backend API (NestJS)
- Frontend (Next.js)
- Nginx reverse proxy

## 📊 Monitoring

### Health Checks

- Backend: `https://msjenny.io.vn/api/v1/health`
- Frontend: `https://msjenny.io.vn/`

### Logs

```bash
# Xem logs của tất cả containers
docker-compose -f docker-compose.prod.yml logs -f

# Xem logs của service cụ thể
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Monitoring Script

Script monitoring tự động chạy mỗi 5 phút để kiểm tra và restart services nếu cần.

## 🔒 Bảo mật

- SSL/TLS encryption với Let's Encrypt
- Rate limiting cho API endpoints
- Security headers
- Firewall configuration
- Non-root containers

## 🚨 Troubleshooting

### Container không start

```bash
# Kiểm tra logs
docker-compose -f docker-compose.prod.yml logs

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

### Database connection issues

```bash
# Kiểm tra database container
docker ps | grep postgres

# Kiểm tra database logs
docker logs engrisk-postgres

# Test connection
docker exec engrisk-postgres pg_isready -U engrisk_user
```

### SSL certificate issues

```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra logs: `/var/log/engrisk-*.log`
2. Kiểm tra container status: `docker ps -a`
3. Tạo issue trên GitHub repository

## 🔄 Cập nhật

Để cập nhật hệ thống:

1. Push code mới lên branch `main`
2. GitHub Actions sẽ tự động deploy
3. Hoặc chạy thủ công: `./deploy/auto-deploy.sh`

## 📝 Changelog

- **v1.0.0**: Initial Docker-based deployment
- **v1.1.0**: Added GitHub Actions CI/CD
- **v1.2.0**: Added SSL/TLS support
- **v1.3.0**: Added monitoring and health checks
