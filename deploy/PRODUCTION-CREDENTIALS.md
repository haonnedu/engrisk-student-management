# 🔐 EngRisk Production Credentials

## Database Credentials

- **Host**: localhost:5432
- **Database**: student_management
- **Username**: engrisk_user
- **Password**: `EngRisk2024!SecureDB#789`

## JWT Secret

- **Secret**: `EngRisk2024!JWTSecretKey#456!Production`

## Admin Account

- **Email**: admin@engrisk.com
- **Password**: admin123

## Server Information

- **IP**: 103.216.117.100
- **SSH Port**: 24700
- **Domain**: msjenny.io.vn

## Services

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:3001 (NestJS)
- **Database**: localhost:5432 (PostgreSQL)

## Security Notes

⚠️ **IMPORTANT**:

- Change admin password after first login
- Consider rotating JWT secret periodically
- Keep database credentials secure
- Monitor access logs regularly

## Backup Commands

```bash
# Database backup
sudo docker exec engrisk-postgres pg_dump -U engrisk_user -d student_management > backup_$(date +%Y%m%d).sql

# Application backup
sudo tar -czf engrisk_backup_$(date +%Y%m%d).tar.gz /var/www/engrisk-student-management/
```
