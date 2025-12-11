# Homework Feature Setup Guide

## Tổng quan

Tính năng Homework cho phép phụ huynh xem và nộp bài tập được tạo bởi giáo viên, với khả năng upload videos và files lên Google Drive.

## Các bước setup

### 1. Backend Setup

#### a. Cài đặt dependencies (nếu chưa có)

```bash
cd be
npm install
```

Dependencies cần thiết:
- `googleapis` - Đã có trong package.json
- `multer` - Đã có trong package.json
- `@nestjs/platform-express` - Đã có trong package.json

#### b. Chạy Prisma Migration

```bash
cd be
npx prisma migrate dev --name add_homework_submissions
```

Migration này sẽ tạo các bảng mới:
- `homework_submissions` - Lưu submissions từ phụ huynh
- `homework_files` - Lưu thông tin files đã upload
- `google_drives` - Quản lý các Google Drive accounts

#### c. Generate Prisma Client

```bash
cd be
npx prisma generate
```

**QUAN TRỌNG**: Bước này cần thiết để TypeScript nhận diện các models mới. Nếu không chạy, sẽ có lỗi TypeScript về `homeworkSubmission`, `homeworkFile`, và `googleDrive`.

### 2. Google Drive Configuration

#### a. Tạo Google Cloud Project và Enable Google Drive API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. **QUAN TRỌNG: Enable Google Drive API**
   - Vào **APIs & Services** > **Library**
   - Tìm kiếm "Google Drive API"
   - Click vào "Google Drive API"
   - Click nút **Enable**
   - Hoặc truy cập trực tiếp: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=YOUR_PROJECT_ID`
   - Thay `YOUR_PROJECT_ID` bằng Project ID của bạn (có thể tìm trong credentials JSON: `project_id` field)
   
   **Lưu ý**: 
   - Nếu bạn thấy lỗi "Google Drive API has not been used in project X before or it is disabled", bạn cần enable API cho project đó
   - Project ID trong credentials JSON (`project_id`) có thể khác với Project Number (số như 215397141772)
   - Đảm bảo enable API cho đúng project mà service account thuộc về
   - Sau khi enable, đợi vài phút để Google cập nhật hệ thống

#### b. Tạo Service Account

1. Vào **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Điền thông tin và tạo
4. Vào service account vừa tạo, tab **Keys**
5. Click **Add Key** > **Create new key** > Chọn **JSON**
6. Download file JSON credentials

#### c. Cấu hình Google Drive trong Database

Cần insert record vào bảng `google_drives`:

```sql
INSERT INTO google_drives (id, email, name, is_active, is_full, folder_id, credentials, created_at, updated_at)
VALUES (
  'cuid_here',
  'service-account@project-id.iam.gserviceaccount.com',
  'Drive Account 1',
  true,
  false,
  'folder_id_here', -- Optional: Google Drive folder ID
  '{"type":"service_account",...}', -- JSON credentials từ file đã download
  NOW(),
  NOW()
);
```

**QUAN TRỌNG - Định dạng Credentials JSON:**

File JSON credentials từ Google Cloud phải chứa các trường bắt buộc sau:
- `type`: Phải là `"service_account"`
- `project_id`: ID của Google Cloud project
- `private_key_id`: ID của private key
- `private_key`: Private key (bắt đầu với `"-----BEGIN PRIVATE KEY-----"`)
- `client_email`: Email của service account (ví dụ: `service-account@project-id.iam.gserviceaccount.com`)
- `client_id`: Client ID
- `auth_uri`: Auth URI
- `token_uri`: Token URI
- `auth_provider_x509_cert_url`: Auth provider cert URL
- `client_x509_cert_url`: Client cert URL

**Ví dụ cấu trúc credentials JSON hợp lệ:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Lưu ý**:
- `credentials` phải là JSON string hợp lệ chứa đầy đủ các trường trên
- `client_email` và `private_key` là bắt buộc - nếu thiếu sẽ có lỗi "The incoming JSON object does not contain a client_email field"
- `credentials` nên được encrypt trước khi lưu vào database
- `folder_id` là optional, nếu không có thì files sẽ upload vào root
- Có thể tạo nhiều drive accounts để xử lý khi drive đầy

#### d. Cấu hình Shared Drive hoặc Folder (Recommended)

**QUAN TRỌNG**: Service Accounts không có storage quota riêng. Bạn cần sử dụng một trong hai cách:

**Cách 1: Sử dụng Shared Drive (Team Drive) - KHUYẾN NGHỊ**

1. Tạo Shared Drive trong Google Workspace:
   - Vào Google Drive
   - Click **New** > **Shared drive**
   - Đặt tên (ví dụ: "Homework Files")
   - Thêm service account email (`storage@ms-jenny.iam.gserviceaccount.com`) với quyền **Content Manager** hoặc **Manager**

2. Lấy Shared Drive ID:
   - Mở Shared Drive
   - URL sẽ có dạng: `https://drive.google.com/drive/folders/DRIVE_ID`
   - Copy `DRIVE_ID`

3. Cập nhật trong database:
   ```sql
   UPDATE google_drives 
   SET "folderId" = 'DRIVE_ID_HERE' 
   WHERE id = 'drive_id_here';
   ```

**Cách 2: Sử dụng Regular Folder (Nếu không có Google Workspace)**

1. Tạo folder trong Google Drive của một user thường
2. Share folder với service account email (với quyền Editor)
3. Lấy Folder ID từ URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
4. Cập nhật `folderId` trong database

**Lưu ý về Storage Quota**:
- Service accounts không có storage quota riêng
- Nếu dùng Shared Drive: quota của Shared Drive sẽ được sử dụng
- Nếu dùng regular folder: quota của user sở hữu folder sẽ được sử dụng
- Hệ thống sẽ tự động skip space check cho service accounts

### 3. Frontend Setup

#### a. Cài đặt dependencies (nếu chưa có)

```bash
cd fe
npm install
```

Dependencies cần thiết:
- `react-dropzone` - Đã có trong package.json
- `date-fns` - Đã có trong package.json

### 4. Kiểm tra Authentication

Đảm bảo JWT token chứa thông tin student:

```typescript
// Trong auth service, khi tạo token cho student:
{
  id: user.id,
  email: user.email,
  role: user.role,
  student: {
    id: student.id,
    // ... other student info
  }
}
```

### 5. Test API Endpoints

#### a. Tạo Submission

```bash
POST /api/v1/homework/submissions
Content-Type: application/json
Authorization: Bearer <token>

{
  "homeworkId": "homework_id_here",
  "comment": "Optional comment"
}
```

#### b. Upload File

```bash
POST /api/v1/homework/submissions/:submissionId/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
```

#### c. Get Submissions

```bash
GET /api/v1/homework/submissions?homeworkId=xxx&studentId=xxx
Authorization: Bearer <token>
```

## Tính năng

### 1. Hiển thị Homework

- Parent portal hiển thị tất cả homework được tạo bởi teacher
- Hiển thị trạng thái: Pending, Submitted, Overdue
- Hiển thị thông tin: title, description, due date, points

### 2. Upload Files

- Hỗ trợ drag & drop
- Hỗ trợ upload videos, images, PDFs, documents
- Max file size: 500MB
- Files được upload lên Google Drive

### 3. Google Drive Management

- Tự động chọn drive account có sẵn
- Kiểm tra dung lượng trước khi upload
- Tự động chuyển sang drive khác nếu drive hiện tại đầy
- Lưu thông tin drive account cho mỗi file để truy xuất chính xác

### 4. File Management

- Xem danh sách files đã upload
- Xem/download files từ Google Drive
- Xóa files (cả trong database và Google Drive)

## Troubleshooting

### Lỗi: "Google Drive API has not been used in project X before or it is disabled"

**Nguyên nhân**: Google Drive API chưa được enable cho Google Cloud project.

**Giải pháp**:
1. Xác định Project ID từ credentials JSON (field `project_id` trong file JSON đã download)
2. Truy cập [Google Cloud Console](https://console.cloud.google.com/) và chọn đúng project
3. Enable Google Drive API bằng một trong các cách:
   - **Cách 1**: Vào **APIs & Services** > **Library** > Tìm "Google Drive API" > Click **Enable**
   - **Cách 2**: Truy cập trực tiếp: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=YOUR_PROJECT_ID`
     - Thay `YOUR_PROJECT_ID` bằng Project ID từ credentials (ví dụ: `ms-jenny`)
4. Đợi 2-5 phút để Google cập nhật hệ thống
5. Thử lại upload file

**Lưu ý quan trọng**:
- **Project ID** (ví dụ: `ms-jenny`) khác với **Project Number** (ví dụ: `215397141772`)
- Đảm bảo enable API cho đúng project mà service account thuộc về
- Kiểm tra `project_id` trong credentials JSON để xác định project đúng
- Nếu credentials có `project_id: "ms-jenny"` nhưng lỗi hiển thị project number khác, có thể service account thuộc project khác

### Lỗi: "Service Accounts do not have storage quota"

**Nguyên nhân**: Service account không có storage quota riêng trong Google Drive.

**Giải pháp**:
1. **Sử dụng Shared Drive (Team Drive)** - Khuyến nghị:
   - Tạo Shared Drive trong Google Workspace
   - Thêm service account vào Shared Drive với quyền Content Manager
   - Cập nhật `folderId` trong database với Shared Drive ID
   - Shared Drive sẽ có quota riêng

2. **Hoặc sử dụng regular folder**:
   - Tạo folder trong Google Drive của user thường
   - Share folder với service account
   - Quota sẽ dùng của user sở hữu folder

3. **Hệ thống đã tự động xử lý**:
   - Nếu detect service account (không có quota), sẽ skip space check
   - Upload sẽ tiếp tục bình thường
   - Flag `isFull` sẽ không được set cho service accounts

**Xem thêm**: Phần "Cấu hình Shared Drive hoặc Folder" trong setup guide.

### Lỗi: "Property 'homeworkSubmission' does not exist on type 'PrismaService'"

**Giải pháp**: Chạy `npx prisma generate` trong thư mục `be/`

### Lỗi: "No available Google Drive account"

**Giải pháp**: 
1. Kiểm tra có record nào trong bảng `google_drives` với `is_active = true` và `is_full = false`
2. Đảm bảo `credentials` JSON hợp lệ và có đầy đủ các trường bắt buộc (`client_email`, `private_key`)
3. Kiểm tra service account có quyền truy cập Google Drive API (đã enable API)
4. Kiểm tra Google Drive API đã được enable cho project (xem lỗi trên)

### Lỗi: "Student ID not found in token"

**Giải pháp**: Kiểm tra JWT token có chứa `student.id` không. Cập nhật auth service nếu cần.

### Lỗi: Drive bị đánh dấu "full" (isFull = true)

**Nguyên nhân**: 
- Drive thực sự đã đầy (< 100MB còn lại)
- Lỗi khi check space (API chưa enable, network issue)
- Flag bị set nhầm

**Giải pháp**:

1. **Kiểm tra space thực tế**:
   - Vào Google Drive của service account
   - Kiểm tra dung lượng còn lại

2. **Reset flag trong database** (nếu drive thực sự còn chỗ):
   ```sql
   UPDATE google_drives 
   SET "isFull" = false 
   WHERE id = 'drive_id_here';
   ```

3. **Enable Google Drive API** (nếu chưa enable):
   - Xem phần troubleshooting về "Google Drive API has not been used"

4. **Hệ thống sẽ tự động re-check** khi upload file:
   - Nếu check space thất bại (API issue), hệ thống vẫn sẽ thử upload
   - Nếu drive thực sự đầy, sẽ tự động chuyển sang drive khác (nếu có)

### Files không upload được

**Giải pháp**:
1. Kiểm tra file size không vượt quá 500MB
2. Kiểm tra file type được hỗ trợ
3. Kiểm tra Google Drive credentials
4. Kiểm tra Google Drive API đã được enable
5. Kiểm tra drive không bị đánh dấu "full" (xem lỗi trên)
6. Kiểm tra network connection

## API Documentation

Xem chi tiết API tại: `http://localhost:3001/api/docs`

## Notes

- Google Drive credentials nên được encrypt trước khi lưu vào database
- Có thể cấu hình nhiều drive accounts để xử lý khi drive đầy
- Files được lưu tạm trong `uploads/temp` trước khi upload lên Google Drive
- Thư mục `uploads/temp` sẽ được tự động xóa sau khi upload thành công

## ⚠️ Deployment Notes

**QUAN TRỌNG**: Trước khi deploy lên server, xem file `DEPLOYMENT_CHECKLIST.md` để biết các bước cần thiết.

Các điểm cần lưu ý:
1. Migration baseline có thể cần được xử lý đặc biệt
2. Thư mục uploads cần có quyền ghi
3. Google Drive credentials cần được cấu hình trong database
4. Prisma Client cần được generate sau khi deploy

