# GitHub Secrets Cần Thiết

## 🔐 Danh sách Secrets

Bạn cần tạo **4 secrets** sau trong GitHub repository:

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
Giá trị: [Nội dung file ssh-key]
Mô tả: Private SSH key để kết nối server
```

### 4. PROD_PORT

```
Tên: PROD_PORT
Giá trị: 24700
Mô tả: SSH port của server
```

## ⚠️ Lưu ý quan trọng

- **KHÔNG** tạo secret `GITHUB_TOKEN` - GitHub tự động cung cấp
- **KHÔNG** tạo secret có tên bắt đầu với `GITHUB_`
- Private key phải bao gồm cả `-----BEGIN` và `-----END`

## 📋 Cách tạo Secrets

1. Vào GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Nhập tên và giá trị
5. Click "Add secret"

## 🔑 Lấy Private Key

```bash
# Trong thư mục deploy
type ssh-key
```

Copy toàn bộ nội dung (bao gồm `-----BEGIN OPENSSH PRIVATE KEY-----` và `-----END OPENSSH PRIVATE KEY-----`)

## ✅ Kiểm tra

Sau khi tạo xong 4 secrets, GitHub Actions sẽ có thể:

- Kết nối SSH đến server
- Deploy Docker containers
- Chạy health checks
