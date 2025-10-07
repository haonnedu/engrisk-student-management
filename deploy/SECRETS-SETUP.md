# Cấu hình Secrets và Environment Variables

Hướng dẫn cấu hình các secrets và environment variables cho hệ thống deploy Docker.

## 🔐 GitHub Secrets

Cấu hình các secrets sau trong GitHub repository (Settings > Secrets and variables > Actions):

### 1. PROD_HOST

```
Tên: PROD_HOST
Giá trị: 103.216.117.100
Mô tả: IP address của production server
```

### 2. PROD_USER

```
Tên: PROD_USER
Giá trị: root
Mô tả: Username để SSH vào server
```

### 3. PROD_SSH_KEY

```
Tên: PROD_SSH_KEY
Giá trị: [Private SSH key content]
Mô tả: Private SSH key để kết nối server
```

**Cách tạo SSH key:**

```bash
# Trên máy local
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
# Lưu private key vào PROD_SSH_KEY
# Copy public key lên server
ssh-copy-id root@103.216.117.100
```

### 4. PROD_PORT

```
Tên: PROD_PORT
Giá trị: 24700
Mô tả: SSH port của server
```

### 5. GITHUB_TOKEN (Tự động)

```
Tên: GITHUB_TOKEN
Giá trị: [Tự động cung cấp bởi GitHub]
Mô tả: Token tự động được GitHub cung cấp cho GitHub Actions
```

**Lưu ý:** `GITHUB_TOKEN` được GitHub tự động cung cấp, không cần tạo thủ công!

## 🌍 Environment Variables

### Backend Environment (.env)

Tạo file `be/.env` trên server:

```env
# Database
DATABASE_URL="postgresql://${POSTGRES_USER:-engrisk_user}:${POSTGRES_PASSWORD}@engrisk-postgres:5432/student_management"

# JWT
JWT_SECRET="${JWT_SECRET}"

# Application
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://msjenny.io.vn"
API_PREFIX="api/v1"

# CORS
CORS_ORIGIN="https://msjenny.io.vn"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### Frontend Environment (.env.local)

Tạo file `fe/.env.local` trên server:

```env
# API Configuration
NEXT_PUBLIC_API_URL="https://msjenny.io.vn/api/v1"

# Application
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# Build Configuration
NEXT_PUBLIC_APP_NAME="EngRisk Student Management"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## 🐳 Docker Environment

### Docker Compose Environment

File `docker-compose.prod.yml` sử dụng các environment variables:

```yaml
environment:
  # Database
  POSTGRES_DB: student_management
  POSTGRES_USER: ${POSTGRES_USER:-engrisk_user}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  # Backend
  DATABASE_URL: postgresql://${POSTGRES_USER:-engrisk_user}:${POSTGRES_PASSWORD}@engrisk-postgres:5432/student_management
  JWT_SECRET: ${JWT_SECRET}
  NODE_ENV: production
  PORT: 3001
  FRONTEND_URL: https://msjenny.io.vn
  API_PREFIX: api/v1

  # Frontend
  NEXT_PUBLIC_API_URL: https://msjenny.io.vn/api/v1
```

## 🔒 Security Configuration

### Database Security

```env
# Strong password cho database
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# User riêng cho application
POSTGRES_USER="${POSTGRES_USER:-engrisk_user}"
```

### JWT Security

```env
# JWT secret mạnh (32+ ký tự)
JWT_SECRET="${JWT_SECRET}"
```

### SSL/TLS Configuration

```nginx
# Nginx SSL configuration
ssl_certificate /etc/letsencrypt/live/msjenny.io.vn/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/msjenny.io.vn/privkey.pem;
```

## 📋 Checklist Cấu hình

### Trên GitHub Repository

- [ ] Thêm `PROD_HOST` secret
- [ ] Thêm `PROD_USER` secret
- [ ] Thêm `PROD_SSH_KEY` secret
- [ ] Thêm `PROD_PORT` secret

**Lưu ý:** `GITHUB_TOKEN` được GitHub tự động cung cấp, không cần tạo thủ công!

### Trên Production Server

- [ ] Tạo file `be/.env` với database credentials
- [ ] Tạo file `fe/.env.local` với API URL
- [ ] Cấu hình SSL certificates
- [ ] Setup firewall rules
- [ ] Cấu hình monitoring

### Kiểm tra

- [ ] SSH connection hoạt động
- [ ] GitHub Actions có thể deploy
- [ ] Database connection thành công
- [ ] SSL certificates hợp lệ
- [ ] Health checks pass

## 🚨 Lưu ý Bảo mật

1. **Không commit secrets vào code**
2. **Sử dụng strong passwords**
3. **Rotate secrets định kỳ**
4. **Monitor access logs**
5. **Backup secrets an toàn**

## 🔄 Cập nhật Secrets

### Cập nhật GitHub Secrets

1. Vào GitHub repository Settings
2. Secrets and variables > Actions
3. Update secret cần thiết
4. Trigger deployment mới

### Cập nhật Environment Variables

1. SSH vào server
2. Edit file `.env` tương ứng
3. Restart containers:
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

## 📞 Troubleshooting

### Lỗi SSH Connection

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa -p 24700 root@103.216.117.100

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
```

### Lỗi GitHub Token

```bash
# Test GitHub token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### Lỗi Database Connection

```bash
# Test database connection
docker exec engrisk-postgres psql -U engrisk_user -d student_management -c "SELECT 1;"
```

## 📝 Template Files

### Environment Variables Template

A comprehensive environment variables template is available at `deploy/env.example`. This file contains all the necessary environment variables with descriptions and security notes.

### be/.env.template

```env
DATABASE_URL="postgresql://${POSTGRES_USER:-username}:${POSTGRES_PASSWORD}@host:port/database"
JWT_SECRET="${JWT_SECRET}"
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://your-domain.com"
API_PREFIX="api/v1"
```

### fe/.env.local.template

```env
NEXT_PUBLIC_API_URL="https://your-domain.com/api/v1"
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1
```

### Quick Setup

1. Copy the template: `cp deploy/env.example .env`
2. Edit the `.env` file with your actual values
3. Never commit the `.env` file to version control
