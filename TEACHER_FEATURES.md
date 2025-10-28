# Teacher Features Documentation

## Tổng quan

Hệ thống hỗ trợ 2 tính năng chính cho Teacher:

1. **Quản lý Chấm Công (Timesheet Management)**
2. **Quyền Quản Lý như Admin** - Teacher có thể truy cập các tính năng quản lý học sinh, điểm, lớp học, điểm danh

---

## 1. Timesheet Management (Quản lý Chấm Công)

### Backend

#### Schema (Prisma)

```prisma
enum TimesheetStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

model Timesheet {
  id                String          @id @default(cuid())
  teacherId         String
  date              DateTime
  hoursWorked       Float
  minutesWorked     Int             @default(0)
  description       String?
  status            TimesheetStatus @default(DRAFT)
  submittedAt       DateTime?
  approvedAt        DateTime?
  approvedBy        String?
  rejectedAt        DateTime?
  rejectionReason   String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  teacher           Teacher         @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  
  @@unique([teacherId, date])
  @@map("timesheets")
}
```

#### API Endpoints

**Teacher Endpoints:**
- `POST /timesheets` - Tạo timesheet mới (status: DRAFT)
- `GET /timesheets/my` - Lấy danh sách timesheets của teacher đang đăng nhập
- `PATCH /timesheets/:id` - Cập nhật timesheet (chỉ DRAFT)
- `POST /timesheets/:id/submit` - Submit timesheet để admin duyệt (DRAFT → SUBMITTED)
- `DELETE /timesheets/:id` - Xóa timesheet (chỉ DRAFT)

**Admin Endpoints:**
- `GET /timesheets` - Lấy tất cả timesheets (với filter: status, teacherId)
- `POST /timesheets/:id/approve` - Approve timesheet (SUBMITTED → APPROVED)
- `POST /timesheets/:id/reject` - Reject timesheet với lý do (SUBMITTED → REJECTED)

#### Flow

```
Teacher creates → DRAFT
       ↓
Teacher submits → SUBMITTED
       ↓
Admin reviews:
  - Approve → APPROVED (lưu approvedAt, approvedBy)
  - Reject → REJECTED (lưu rejectionReason, rejectedAt)
```

#### Validation Rules

- Teacher chỉ có thể edit/delete timesheets ở trạng thái DRAFT
- Mỗi teacher chỉ có thể có 1 timesheet cho mỗi ngày (unique constraint)
- Admin chỉ có thể approve/reject timesheets ở trạng thái SUBMITTED
- Rejection bắt buộc phải có lý do (rejectionReason)

### Frontend

#### Teacher Portal (`/teacher`)

**Dashboard (`/teacher/dashboard`)**
- Tổng quan thống kê timesheets:
  - Total timesheets
  - Draft timesheets
  - Pending approval
  - Approved timesheets
- Quick actions: View timesheets, Students, Grades
- Recent timesheets (5 gần nhất)

**Timesheets Page (`/teacher/timesheets`)**
- Tạo timesheet mới:
  - Chọn ngày
  - Nhập giờ (0-24)
  - Nhập phút (0-59)
  - Mô tả công việc (optional)
- Danh sách timesheets với pagination
- Actions:
  - Submit (icon Send) - DRAFT → SUBMITTED
  - Delete (icon Trash) - Chỉ DRAFT
- Hiển thị rejection reason nếu bị reject
- Badge màu theo status:
  - DRAFT: outline (gray)
  - SUBMITTED: secondary (blue)
  - APPROVED: green
  - REJECTED: destructive (red)

#### Admin Portal (`/timesheets`)

**Timesheet Management Page**
- Filter theo status (All/Draft/Submitted/Approved/Rejected)
- Danh sách tất cả timesheets của tất cả teachers
- Hiển thị:
  - Tên teacher (firstName + lastName)
  - Ngày làm việc
  - Số giờ/phút
  - Mô tả
  - Status
  - Submitted at
- Actions (chỉ cho SUBMITTED):
  - Approve (icon Check, green)
  - Reject (icon X, red) → Dialog nhập lý do
- Pagination

---

## 2. Admin Permissions (Quyền Quản Lý)

### Tính năng Teacher có thể truy cập

Teacher có **toàn quyền** truy cập các tính năng quản lý giống như Admin:

#### Quản lý Học sinh
- Xem danh sách students (`/students`)
- Thêm/sửa/xóa students
- Import students từ Excel
- Xem chi tiết student

#### Quản lý Khóa học
- Xem danh sách courses (`/courses`)
- Tạo/sửa/xóa courses
- Xem chi tiết course

#### Quản lý Lớp học
- Xem danh sách classes/sections (`/classes`)
- Tạo/sửa/xóa classes
- Quản lý students trong class

#### Quản lý Điểm
- Nhập điểm cho students (`/grades/classes`)
- Xem điểm theo class
- Bulk grade entry
- Xem chi tiết điểm của từng student

#### Điểm danh
- Điểm danh students (`/attendance`)
- Xem lịch sử điểm danh
- Export attendance reports

#### Enrollments
- Ghi danh students vào courses
- Xem/quản lý enrollments

### Routing Logic

**ConditionalLayout.tsx** xử lý routing:

```typescript
// Students → Parent Portal only
if (user.role === "STUDENT" && !isParentRoute) {
  router.push("/parent/grades");
}

// Teachers → Can access both /teacher and admin routes
// No redirect needed

// Admins/Super Admins → Full access
// No redirect needed
```

### Sidebar

**Teacher Sidebar** (`/teacher/*` routes):
- **Teacher Section:**
  - Dashboard (`/teacher/dashboard`)
  - My Timesheets (`/teacher/timesheets`)
  
- **Management Section:**
  - Students (`/students`)
  - Courses (`/courses`)
  - Classes (`/classes`)
  - Grades (`/grades/classes`)
  - Attendance (`/attendance`)

**Admin Sidebar** (other routes):
- Dashboard (`/`)
- Students
- Courses
- Classes
- Grades
- Attendance
- Enrollments
- Grade Types
- Teachers (`/teachers`)
- Timesheets (`/timesheets`) - Admin timesheet management

---

## User Roles & Permissions

| Feature | Student | Teacher | Admin | Super Admin |
|---------|---------|---------|-------|-------------|
| View own grades | ✅ | ❌ | ❌ | ❌ |
| Update own profile | ✅ | ❌ | ❌ | ❌ |
| Manage timesheets | ❌ | ✅ | ❌ | ❌ |
| View all timesheets | ❌ | ❌ | ✅ | ✅ |
| Approve/Reject timesheets | ❌ | ❌ | ✅ | ✅ |
| Manage students | ❌ | ✅ | ✅ | ✅ |
| Manage courses | ❌ | ✅ | ✅ | ✅ |
| Manage classes | ❌ | ✅ | ✅ | ✅ |
| Enter grades | ❌ | ✅ | ✅ | ✅ |
| Manage attendance | ❌ | ✅ | ✅ | ✅ |
| Manage teachers | ❌ | ❌ | ✅ | ✅ |

---

## Authentication & Authorization

### Backend

- JwtAuthGuard bảo vệ tất cả timesheet endpoints
- Role-based checks trong service layer
- Teachers chỉ có thể thao tác trên timesheets của mình
- Admins có thể xem/approve/reject tất cả timesheets

### Frontend

- React Context quản lý user state và role
- Conditional routing dựa trên role
- Conditional sidebar rendering
- Protected routes với authentication check

---

## Testing Guide

### Teacher Flow

1. **Login với tài khoản Teacher**
   - Username: teacher's phone number
   - Password: (default password from teacher creation)

2. **Access Dashboard**
   - Auto redirect to `/teacher/dashboard`
   - Xem tổng quan timesheets

3. **Tạo Timesheet**
   - Navigate to "My Timesheets"
   - Click "New Timesheet"
   - Chọn ngày, nhập giờ/phút, mô tả
   - Click "Create"

4. **Submit Timesheet**
   - Tìm timesheet vừa tạo (status: Draft)
   - Click icon Send
   - Confirm submission
   - Status → SUBMITTED

5. **Access Admin Features**
   - Click "Students" trong Management section
   - Thử thêm/sửa student
   - Navigate to "Grades" để nhập điểm
   - Navigate to "Attendance" để điểm danh

### Admin Flow

1. **Login với tài khoản Admin/Super Admin**

2. **Review Timesheets**
   - Navigate to "Timesheets" trong sidebar
   - Filter: Status = "Submitted"
   - Xem danh sách timesheets chờ duyệt

3. **Approve Timesheet**
   - Click icon Check (green)
   - Confirm approval
   - Status → APPROVED

4. **Reject Timesheet**
   - Click icon X (red)
   - Nhập lý do rejection
   - Click "Reject Timesheet"
   - Status → REJECTED

---

## Next Steps / Future Enhancements

- [ ] Timesheet Reports (theo tháng, quý, năm)
- [ ] Export timesheets to Excel/PDF
- [ ] Email notifications khi timesheet được approve/reject
- [ ] Calendar view cho timesheets
- [ ] Bulk approval cho nhiều timesheets
- [ ] Teacher performance analytics
- [ ] Overtime tracking
- [ ] Holiday/Leave management
- [ ] Integration với payroll system

