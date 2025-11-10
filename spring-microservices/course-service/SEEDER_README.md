# Course Data Seeder

Hướng dẫn tạo 100 published courses cho hệ thống e-learning.

## Phương pháp 1: Sử dụng API Endpoint (Khuyến nghị)

### Bước 1: Khởi động course-service

```powershell
# Chạy script PowerShell
.\start-service.ps1

# Hoặc chạy thủ công
.\mvnw.cmd spring-boot:run
```

### Bước 2: Gọi API để tạo dữ liệu

```powershell
# Chạy script PowerShell
.\seed-data.ps1

# Hoặc gọi API thủ công
Invoke-RestMethod -Uri "http://localhost:8088/course-management/api/data-seeder/seed-courses" -Method POST
```

### Bước 3: Kiểm tra kết quả

API sẽ trả về thông báo "Successfully created 100 published courses!" nếu thành công.

## Phương pháp 2: Sử dụng SQL Script (Thay thế)

### Bước 1: Kết nối database MySQL

```bash
mysql -u your_username -p your_database_name
```

### Bước 2: Chạy script SQL

```sql
source seed_courses.sql;
```

## Dữ liệu được tạo

Mỗi published course bao gồm:

- **Course**: Thông tin cơ bản về khóa học
- **CourseDetail**: Chi tiết mô tả, hình ảnh, video
- **PublishedCourse**: Thông tin xuất bản và giá

### Teacher IDs được sử dụng:

- `baf701dc-eb2a-4560-9102-cf41ff91d833`
- `bee87ec2-5fee-4600-92b4-e7d762e162d4`

### Course Types:

- ID 1: Lập trình căn bản
- ID 2: Phát triển Web
- ID 3: Khoa học dữ liệu

### Educational Unit:

- ID 1: Trường Đại học Sư phạm Kỹ thuật TP.HCM

## Cấu trúc dữ liệu

```
Course (100 records)
├── id: auto-generated
├── course_name: "Tên khóa học - Lớp X"
├── description: Mô tả ngẫu nhiên
├── credits: 1-4 tín chỉ
├── max_students: 20-70 sinh viên
├── current_students: 0-14 sinh viên hiện tại
├── teacher_id: Random giữa 2 giáo viên
└── educational_unit_id: 1

CourseDetail (100 records)
├── id: auto-generated
├── description: Mô tả chi tiết
├── course_introduction: Giới thiệu khóa học
├── course_image: Tên file hình ảnh
├── course_video: Tên file video
├── learner_achievements: Thành tựu học viên
└── course_learner: Số lượng học viên (50-250)

PublishedCourse (100 records)
├── id: auto-generated
├── course_id: Liên kết đến Course
├── course_detail_id: Liên kết đến CourseDetail
├── course_type_id: Random 1-3
├── course_price: 200,000 - 1,000,000 VND
├── status: 1 (Published)
├── created_at: Thời gian hiện tại
└── updated_at: Thời gian hiện tại
```

## Troubleshooting

### Lỗi "Educational Unit not found"

- Đảm bảo có record với id=1 trong bảng `educational_units`
- Script sẽ tự động tạo nếu không tồn tại

### Lỗi "Course Type not found"

- Đảm bảo có records với id=1,2,3 trong bảng `course_type`
- Script sẽ tự động tạo Course Type mặc định nếu cần

### Lỗi Database Connection

- Kiểm tra cấu hình database trong `application.properties`
- Đảm bảo database đang chạy và có thể kết nối được

## Xóa dữ liệu test (nếu cần)

```sql
DELETE FROM PublishedCourse;
DELETE FROM course_detail;
DELETE FROM course;
```

Hoặc sử dụng API:

```bash
curl -X DELETE http://localhost:8088/course-management/api/data-seeder/clear-courses
```
