# Parent Portal Documentation

## Tổng quan

Parent Portal là giao diện dành riêng cho học sinh và phụ huynh, cho phép họ:
- Xem bảng điểm của học sinh
- Cập nhật thông tin cá nhân (số điện thoại, địa chỉ, liên hệ khẩn cấp, v.v.)

## Cách truy cập

### 1. Đăng nhập
- Truy cập trang đăng nhập: `/login`
- Sử dụng tài khoản student (role: `STUDENT`)
- Sau khi đăng nhập thành công, hệ thống sẽ tự động chuyển hướng đến Parent Portal

### 2. Routes

Parent Portal có các route sau:

- `/parent/grades` - Xem bảng điểm
- `/parent/profile` - Xem và cập nhật thông tin cá nhân

## Tính năng

### 1. Trang Bảng Điểm (`/parent/grades`)

Trang này hiển thị:
- **Thông tin học sinh**: Họ tên, mã học sinh
- **Điểm trung bình**: Tự động tính toán từ tất cả các điểm
- **Bảng điểm chi tiết**:
  - Tên khóa học
  - Loại điểm (Grade Type)
  - Điểm số
  - Trọng số (Weight)
  - Nhận xét
  - Ngày chấm điểm

**Tính năng**:
- Tìm kiếm điểm theo tên khóa học
- Sắp xếp theo cột (Course, Score, Date)
- Phân trang
- Màu sắc điểm số:
  - Xanh lá: ≥ 80
  - Vàng: 60-79
  - Đỏ: < 60

### 2. Trang Thông Tin Cá Nhân (`/parent/profile`)

Trang này hiển thị:
- **Thông tin cá nhân**:
  - Họ tên (không thể chỉnh sửa)
  - Tên tiếng Anh (không thể chỉnh sửa)
  - Số điện thoại (có thể cập nhật)
  - Email
  - Địa chỉ (có thể cập nhật)
  - Liên hệ khẩn cấp (có thể cập nhật)
  - Lớp/Trường (có thể cập nhật)
  - Ngày sinh

- **Trạng thái tài khoản**:
  - Mã học sinh
  - Trạng thái (ACTIVE/INACTIVE/...)
  - Ngày đăng ký
  - Số lượng khóa học đã đăng ký

- **Khóa học đã đăng ký**:
  - Danh sách các khóa học
  - Thông tin section
  - Trạng thái đăng ký

**Cập nhật thông tin**:
1. Click nút "Edit Profile"
2. Chỉnh sửa các trường có thể thay đổi
3. Click "Save Changes" để lưu
4. Click "Cancel" để hủy thay đổi

> **Lưu ý**: Khi cập nhật số điện thoại, hệ thống sẽ tự động cập nhật vào bảng `users` để đồng bộ dữ liệu.

## API Endpoints

### Backend (NestJS)

#### 1. Lấy thông tin profile
```
GET /api/v1/students/me/profile
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "student_id",
  "userId": "user_id",
  "studentId": "STU123456",
  "firstName": "John",
  "lastName": "Doe",
  "engName": "John",
  "dateOfBirth": "2000-01-01",
  "phone": "+84901234567",
  "address": "123 Main St",
  "emergencyContact": "Jane Doe - 0900000000",
  "classSchool": "12A1 - THPT Example",
  "status": "ACTIVE",
  "user": {
    "id": "user_id",
    "email": "student@example.com",
    "phone": "+84901234567",
    "role": "STUDENT"
  },
  "enrollments": [...],
  "grades": [
    {
      "id": "grade_id",
      "grade": 85.5,
      "gradedAt": "2024-01-15",
      "course": {
        "title": "English 101",
        "courseCode": "ENG101"
      },
      "gradeType": {
        "name": "Midterm Exam",
        "code": "TEST_1",
        "weight": 0.3
      }
    }
  ]
}
```

#### 2. Cập nhật profile
```
PATCH /api/v1/students/me/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+84901234567",
  "address": "New address",
  "emergencyContact": "New contact",
  "classSchool": "12A2 - THPT Example"
}
```

### Frontend (React Hooks)

#### Custom Hook: `useParent.ts`

```typescript
import { useMyProfile, useUpdateMyProfile } from "@/hooks/useParent";

// Lấy profile
const { data: profile, isLoading, error } = useMyProfile();

// Cập nhật profile
const updateProfile = useUpdateMyProfile();
updateProfile.mutate({
  phone: "+84901234567",
  address: "New address"
});
```

## Kiến trúc

### Backend Structure
```
be/src/students/
├── students.controller.ts    # Added GET /me/profile, PATCH /me/profile
├── students.service.ts        # Added findByUserId(), updateByUserId()
└── dto/
    ├── create-student.dto.ts
    └── update-student.dto.ts
```

### Frontend Structure
```
fe/src/
├── app/
│   └── (parent)/              # Parent portal routes
│       ├── page.tsx           # Redirect to /parent/grades
│       ├── grades/
│       │   └── page.tsx       # Grades page
│       └── profile/
│           └── page.tsx       # Profile page
├── components/
│   └── layout/
│       ├── ParentSidebar.tsx  # Parent portal sidebar
│       └── ConditionalLayout.tsx  # Updated to handle role-based routing
└── hooks/
    └── useParent.ts           # Custom hooks for parent API calls
```

## Authentication & Authorization

### Role-based Routing

Hệ thống tự động chuyển hướng dựa trên role:
- **STUDENT**: Chuyển đến `/parent/grades`
- **ADMIN/SUPER_ADMIN**: Chuyển đến `/` (Admin Dashboard)

Được xử lý trong `ConditionalLayout.tsx`:
```typescript
if (user.role === "STUDENT" && !isParentRoute) {
  router.push("/parent/grades");
}
```

### Protected Routes

Tất cả routes trong parent portal đều được bảo vệ bởi:
- `ProtectedRoute` component
- JWT authentication
- Role validation

## Tích hợp với Database

### Cập nhật Phone Number

Khi cập nhật số điện thoại của student, hệ thống sẽ tự động cập nhật vào cả 2 bảng:
1. `students` table
2. `users` table

Đảm bảo dữ liệu đồng bộ giữa các bảng.

```typescript
// In students.service.ts
async updateByUserId(userId: string, updateStudentDto: UpdateStudentDto) {
  // Update user table
  if (updateStudentDto.phone !== undefined) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: updateStudentDto.phone },
    });
  }
  
  // Update student table
  return this.prisma.student.update({
    where: { id: student.id },
    data: updateStudentDto,
  });
}
```

## Styling & UI Components

Parent Portal sử dụng:
- **Tailwind CSS**: For styling
- **shadcn/ui**: UI components
  - Card, Table, Badge, Button, Input, etc.
- **Lucide React**: Icons
- **TanStack Table**: Advanced table features

## Testing

### Test Student Account

Để test parent portal, tạo một student account:
```sql
-- Create user with STUDENT role
INSERT INTO users (email, phone, password, role)
VALUES ('student@example.com', '+84901234567', '$hashed_password', 'STUDENT');

-- Create student record
INSERT INTO students (user_id, student_id, first_name, last_name, eng_name, date_of_birth)
VALUES ('user_id', 'STU123456', 'John', 'Doe', 'John', '2000-01-01');
```

### Test Flow

1. Đăng nhập với student account
2. Kiểm tra redirect đến `/parent/grades`
3. Xem bảng điểm
4. Chuyển đến `/parent/profile`
5. Cập nhật thông tin
6. Verify dữ liệu đã được cập nhật

## Troubleshooting

### Lỗi thường gặp

1. **"Student not found for user ID"**
   - Kiểm tra user có role STUDENT
   - Kiểm tra có student record tương ứng trong DB

2. **"Unauthorized"**
   - Kiểm tra JWT token có hợp lệ
   - Kiểm tra token chưa hết hạn

3. **Layout không hiển thị đúng**
   - Clear browser cache
   - Kiểm tra ConditionalLayout logic

## Future Enhancements

Các tính năng có thể mở rộng:
- [ ] Export grades to PDF
- [ ] Email notifications for new grades
- [ ] Attendance tracking
- [ ] Parent-teacher messaging
- [ ] Payment history
- [ ] Course registration
- [ ] Achievement badges
- [ ] Progress tracking charts

