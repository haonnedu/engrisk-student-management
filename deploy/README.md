# 🚀 EngRisk Student Management - Deployment

## 📋 Server Information

- **IP**: 103.216.117.100
- **SSH Port**: 24700
- **Username**: root
- **Password**: tMlB5PJbeO7%rJpJE#Wc
- **Domain**: msjenny.io.vn

## 🚀 Quick Deploy

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x deploy/quick-deploy.sh

# Run deployment
./deploy/quick-deploy.sh
```

### Option 2: Manual Deploy

```bash
# Connect to server
ssh -p 24700 root@103.216.117.100

# Clone repository
git clone https://github.com/your-username/engrisk-student-management.git /var/www/engrisk-student-management
cd /var/www/engrisk-student-management

# Run setup
chmod +x deploy/setup.sh
./deploy/setup.sh
```

### Option 3: GitHub Actions (Automated)

1. Push code to main branch
2. GitHub Actions will automatically deploy
3. Monitor deployment in Actions tab

## 📊 Sample Data Included

After deployment, you'll have:

### 👤 Users

- **Super Admin**: admin@engrisk.com / admin123

### 📚 Courses

- **ENG101**: English Fundamentals (3 credits, 16 weeks, 30 max students)

### 🏫 Classes 

- **ENG101-A1**: English Fundamentals - Class A1
  - Teacher: Ms. Jenny
  - Schedule: Monday, Wednesday, Friday - 8:00 AM - 10:00 AM
  - Book: English Fundamentals Book 1

### 👥 Students

- **ST001**: Nguyen Van An (John) - 12A1 - THPT Nguyen Du
- **ST002**: Tran Thi Binh (Mary) - 12A2 - THPT Le Hong Phong
- **ST003**: Le Van Cuong (David) - 12B1 - THPT Marie Curie

### 📊 Grade Types

1. **Homework (HW)** - 20% weight
2. **Speaking Practice (SP)** - 15% weight
3. **Pronunciation Practice (PP)** - 10% weight
4. **Test 1 Listening (Test1L)** - 15% weight
5. **Test 1 Reading & Writing (Test1RW)** - 15% weight
6. **Test 2 Listening (Test2L)** - 15% weight
7. **Test 2 Reading & Writing (Test2RW)** - 15% weight
8. **Final Exam (Final)** - 25% weight

## 🔧 Management Commands

### Check Services

```bash
# Backend service
systemctl status engrisk-backend

# Nginx
systemctl status nginx

# Database
systemctl status postgresql
```

### View Logs

```bash
# Backend logs
journalctl -u engrisk-backend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart backend
systemctl restart engrisk-backend

# Reload nginx
systemctl reload nginx

# Restart database
systemctl restart postgresql
```

### Update Application

```bash
cd /var/www/engrisk-student-management
git pull origin main
cd be && npm ci --production && npm run build
cd ../fe && npm ci --production && npm run build
cd ../be && npm run deploy:setup
systemctl restart engrisk-backend
```

## 🔒 Security Notes

### Change Default Passwords

1. **Database**: Update password in `/var/www/engrisk-student-management/be/.env`
2. **Admin User**: Change password after first login
3. **JWT Secret**: Update in environment variables

### SSL Certificate

```bash
# Install Let's Encrypt
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d msjenny.io.vn -d www.msjenny.io.vn
```

### Firewall

```bash
# Allow necessary ports
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## 📱 Access URLs

- **Main Application**: https://msjenny.io.vn
- **API Endpoint**: https://msjenny.io.vn/api/v1
- **Health Check**: https://msjenny.io.vn/api/v1/health

## 🆘 Troubleshooting

### Common Issues

1. **Port 3001 already in use**

   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Database connection failed**

   ```bash
   systemctl restart postgresql
   sudo -u postgres psql -c "SELECT 1"
   ```

3. **Nginx configuration error**

   ```bash
   nginx -t
   systemctl reload nginx
   ```

4. **Permission denied**
   ```bash
   chown -R www-data:www-data /var/www/engrisk-student-management
   ```

### Reset Everything

```bash
# Stop services
systemctl stop engrisk-backend

# Reset database
sudo -u postgres psql -c "DROP DATABASE student_management;"
sudo -u postgres psql -c "CREATE DATABASE student_management;"

# Re-run setup
cd /var/www/engrisk-student-management
./deploy/setup.sh
```

## 📞 Support

If you encounter any issues:

1. Check logs: `journalctl -u engrisk-backend -f`
2. Verify services: `systemctl status engrisk-backend nginx postgresql`
3. Test connectivity: `curl https://msjenny.io.vn`
4. Check database: `sudo -u postgres psql -d student_management -c "SELECT COUNT(*) FROM users;"`
