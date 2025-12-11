# Hướng dẫn Setup OAuth 2.0 cho Google Drive (Không có Google Workspace)

## Vấn đề

Service Account **KHÔNG THỂ** upload files vào My Drive folders (kể cả khi đã share), vì:
- Service Accounts không có storage quota riêng
- Google chỉ cho phép Service Accounts upload vào **Shared Drives** (cần Google Workspace)

## Giải pháp: OAuth 2.0

Thay vì dùng Service Account, chúng ta sẽ dùng **OAuth 2.0** để upload files thay mặt cho một user thực (owner của folder).

---

## Bước 1: Tạo OAuth 2.0 Credentials

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. **Tạo OAuth consent screen** (nếu chưa có):
   - Vào **APIs & Services** > **OAuth consent screen**
   - Chọn **External** (nếu không có Google Workspace) > Click **Create**
   - Điền thông tin:
     - **App name**: "Student Management System" (hoặc tên khác)
     - **User support email**: Email của bạn
     - **Developer contact information**: Email của bạn
   - Click **Save and Continue**
   - **Scopes** (Bước 2): 
     - Click **Add or Remove Scopes**
     - Tìm và tick: `https://www.googleapis.com/auth/drive.file`
     - Click **Update** > **Save and Continue**
   - **Test users** (Bước 3) - **QUAN TRỌNG**:
     - Click **Add Users**
     - Nhập email của bạn (ví dụ: `your-email@gmail.com`)
     - Click **Add**
     - Click **Save and Continue**
   - **Summary** (Bước 4): Click **Back to Dashboard**
   
   **LƯU Ý QUAN TRỌNG**: 
   - OAuth consent screen sẽ ở trạng thái "Testing" (chưa publish)
   - Chỉ những email trong "Test users" mới có thể authorize
   - Nếu bạn authorize bằng email khác, sẽ bị lỗi "access_denied"
   - Nếu đã có OAuth consent screen, chỉ cần vào **APIs & Services** > **OAuth consent screen** để thêm Test users và Scopes

6. Tạo OAuth Client ID:
   - Application type: **Web application**
   - Name: "Student Management - Drive Upload"
   - **Authorized redirect URIs**: 
     - **QUAN TRỌNG**: Nếu dùng Google OAuth Playground, thêm:
       - `https://developers.google.com/oauthplayground`
     - Nếu dùng script Node.js, thêm:
       - `http://localhost:3000/api/auth/google/callback` (development)
       - `https://yourdomain.com/api/auth/google/callback` (production)
     - **Hoặc thêm cả hai** để linh hoạt
   - Click **Create**
   - **KHÔNG cần download JSON** - chỉ cần copy `Client ID` và `Client secret` từ màn hình

---

## Bước 2: Thêm Test Users và Scopes (Nếu chưa có)

**Nếu OAuth consent screen đã tồn tại**, bạn cần kiểm tra và thêm:

1. **Vào OAuth consent screen (Audience)**:
   - Trong Google Cloud Console, ở menu bên trái, click **Audience** (hoặc **APIs & Services** > **OAuth consent screen** trong giao diện cũ)
   - Nếu bạn đang ở trang "OAuth Overview", click **Audience** trong menu bên trái

2. **Kiểm tra Scopes**:
   - Trong trang Audience, tìm phần **Scopes** hoặc **API access**
   - Nếu chưa có `https://www.googleapis.com/auth/drive.file`:
     - Click **Add or Remove Scopes** hoặc **Edit app**
     - Tìm "Drive API" hoặc tìm scope: `https://www.googleapis.com/auth/drive.file`
     - Tick vào scope đó
     - Click **Update** hoặc **Save**

3. **Thêm Test users** (QUAN TRỌNG):
   - Trong trang Audience, scroll xuống tìm phần **Test users** hoặc **User access**
   - Click **Add Users** hoặc **+ Add**
   - Nhập email của bạn (email bạn sẽ dùng để authorize, ví dụ: `your-email@gmail.com`)
   - Click **Add** hoặc **Save**
   - Đảm bảo email đã xuất hiện trong danh sách Test users

**Lưu ý**: 
- Nếu app ở trạng thái "Testing", chỉ Test users mới có thể authorize
- Email trong Test users phải là email bạn sẽ đăng nhập khi authorize
- Nếu không thấy phần Test users, có thể app đã được publish - trong trường hợp đó không cần Test users

---

## Bước 3: Authorize và Lấy Refresh Token

### Cách 1: Dùng Google OAuth 2.0 Playground (KHUYẾN NGHỊ - Dễ nhất)

**Lưu ý**: Với cách này, bạn **PHẢI** thêm redirect URI `https://developers.google.com/oauthplayground` vào OAuth Client ID ở bước trên.

**QUAN TRỌNG**: Sau khi thêm redirect URI, đợi 1-2 phút để Google cập nhật trước khi thử lại.

1. Vào [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Click vào OAuth Client ID của bạn
3. Trong phần **Authorized redirect URIs**, đảm bảo có:
   ```
   https://developers.google.com/oauthplayground
   ```
   - Nếu chưa có, thêm vào và click **Save**
   - Đợi 1-2 phút
4. Vào [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
5. Ở góc phải, click icon **Settings** (⚙️)
6. Tick **Use your own OAuth credentials**
7. Nhập:
   - **OAuth Client ID**: Copy từ Google Cloud Console (dạng `xxxxx.apps.googleusercontent.com`)
   - **OAuth Client secret**: Copy từ Google Cloud Console
8. Click **Close** để đóng Settings
9. Ở bên trái, tìm **Drive API v3** (scroll xuống)
10. Tick scope: `https://www.googleapis.com/auth/drive.file`
11. Click **Authorize APIs** (nút xanh ở góc dưới)
12. Đăng nhập bằng tài khoản Google của bạn (owner của folder)
13. Click **Allow** để cấp quyền
14. Bạn sẽ thấy authorization code - click **Exchange authorization code for tokens**
15. Copy **Refresh token** từ phần "Refresh token" (quan trọng!)
    - Refresh token sẽ có dạng: `1//xxxxx...`

### Cách 2: Dùng Script Node.js (Nếu Playground không hoạt động)

**Lưu ý**: Với cách này, bạn **PHẢI** thêm redirect URI `http://localhost:3000/api/auth/google/callback` vào OAuth Client ID.

1. **Cài đặt dependencies** (nếu chưa có):
   ```bash
   cd be
   npm install googleapis
   ```

2. **Sửa file `be/get-oauth-token.js`**:
   - Mở file `be/get-oauth-token.js`
   - Thay `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET` bằng giá trị từ Google Cloud Console
   - Đảm bảo `REDIRECT_URI` là `http://localhost:3000/api/auth/google/callback`

3. **Thêm redirect URI vào Google Cloud Console**:
   - Vào Google Cloud Console > APIs & Services > Credentials
   - Click vào OAuth Client ID của bạn
   - Trong "Authorized redirect URIs", thêm:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - Click **Save**

4. **Thêm email vào Test users** (QUAN TRỌNG):
   - Vào Google Cloud Console > APIs & Services > OAuth consent screen
   - Scroll xuống phần **Test users**
   - Click **Add Users**
   - Nhập email bạn sẽ dùng để authorize (ví dụ: `your-email@gmail.com`)
   - Click **Add**
   - **Lưu ý**: Email này phải là email bạn sẽ đăng nhập khi authorize

5. **Đợi 1-2 phút** để Google cập nhật

4. **Chạy script**:
   ```bash
   cd be
   node get-oauth-token.js
   ```

5. **Làm theo hướng dẫn**:
   - Mở URL được hiển thị trong browser
   - Authorize và copy code từ URL redirect
   - Paste code vào terminal
   - Copy refresh token được hiển thị

---

## Bước 3: Cập nhật Database

Thay vì dùng Service Account credentials, lưu OAuth credentials:

```sql
UPDATE google_drives 
SET 
  email = 'your-email@gmail.com',  -- Email của user owner
  credentials = '{
    "type": "oauth2",
    "client_id": "your-client-id.apps.googleusercontent.com",
    "client_secret": "your-client-secret",
    "refresh_token": "your-refresh-token-from-step-2"
  }',
  "folderId" = '1VxXxU6yn_LW9uyzKFLOOHbTxBtvK_DDL'  -- Folder ID trong My Drive của bạn
WHERE id = 'your-drive-id';
```

**Lưu ý**: 
- `credentials` phải là JSON string hợp lệ
- `refresh_token` là bắt buộc để có thể refresh access token tự động
- `folderId` là folder trong My Drive của bạn (không cần share với service account nữa)

---

## Bước 6: Kiểm tra Code

Code đã được cập nhật để tự động detect loại credentials:
- Nếu `type: "service_account"` → Dùng Service Account (cần Shared Drive)
- Nếu `type: "oauth2"` → Dùng OAuth 2.0 (có thể dùng My Drive folders)

---

## Lưu ý

1. **Refresh Token**: 
   - Refresh token có thể expire nếu không dùng trong 6 tháng
   - Nếu expire, cần authorize lại và lấy refresh token mới

2. **Quota**:
   - OAuth uploads sẽ dùng quota của user owner (15GB free cho Gmail)
   - Nếu hết quota, cần mua thêm storage hoặc dùng account khác

3. **Security**:
   - Lưu `client_secret` và `refresh_token` an toàn (encrypt trong database)
   - Không commit credentials vào git

4. **Production**:
   - OAuth consent screen cần được verify nếu có nhiều users
   - Với external app, chỉ có thể thêm tối đa 100 test users

---

## Troubleshooting

### Lỗi: "Error 400: redirect_uri_mismatch"

**Nguyên nhân**: Redirect URI trong OAuth Client ID không khớp với redirect URI được sử dụng.

**Giải pháp**:

1. **Nếu dùng Google OAuth Playground**:
   - Vào Google Cloud Console > APIs & Services > Credentials
   - Click vào OAuth Client ID của bạn
   - Trong phần "Authorized redirect URIs", thêm:
     ```
     https://developers.google.com/oauthplayground
     ```
   - Click **Save**
   - Thử lại trên OAuth Playground

2. **Nếu dùng script Node.js**:
   - Đảm bảo redirect URI trong script khớp với redirect URI trong OAuth Client ID
   - Ví dụ: Nếu script dùng `http://localhost:3000/api/auth/google/callback`
   - Thì OAuth Client ID cũng phải có redirect URI: `http://localhost:3000/api/auth/google/callback`
   - **Lưu ý**: Không có trailing slash, phải khớp chính xác

### Lỗi: "Access blocked: This app's request is invalid"
- Kiểm tra OAuth consent screen đã được publish chưa
- Kiểm tra redirect URI đã được thêm vào OAuth Client ID chưa
- Kiểm tra user email đã được thêm vào "Test users" chưa (nếu app chưa được verify)

### Lỗi: "Invalid refresh token"
- Refresh token đã expire hoặc bị revoke
- Cần authorize lại và lấy refresh token mới

### Lỗi: "Insufficient Permission"
- Kiểm tra scope đã được thêm vào OAuth consent screen chưa
- Kiểm tra user đã authorize đúng scope chưa

