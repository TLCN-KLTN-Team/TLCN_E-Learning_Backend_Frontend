# TEST CASE: Quản Lý Giảng Viên

| Test case ID | Title | Description | Module | Screen |
|---|---|---|---|---|
| TEACHER_MANAGEMENT_01 | Quản lý giảng viên | CRUD, khóa/mở khóa, tìm kiếm, phân trang, thống kê trên TeacherListPage | Admin | TeacherListPage |

## Test Data

### Thông tin Cơ sở Giáo dục:
- **Tên cơ sở**: Đại học Công Nghệ Thông Tin
- **ID Cơ sở**: 1

### Dữ liệu Tạo Giảng Viên (Create):
- **Tên đăng nhập**: gv_001
- **Mật khẩu**: Password@123
- **Email**: gv001@university.edu.vn
- **Tên**: Nguyễn
- **Họ**: Văn A
- **Ngày sinh**: 05/01/1985
- **Mã giảng viên**: GV001
- **Khoa**: Công Nghệ Thông Tin
- **Chuyên môn**: Lập trình Web, Hệ thống thông tin
- **Mô tả**: Giảng viên xuất sắc, nhiều năm kinh nghiệm giảng dạy
- **Liên kết mạng xã hội**: https://linkedin.com/in/gv001

### Dữ liệu Chỉnh Sửa (Update):
- **Tên**: Trần
- **Họ**: Văn B
- **Khoa (mới)**: Khoa Hệ Thống Thông Tin
- **Chuyên môn (mới)**: Phân tích dữ liệu, Kiến trúc phần mềm
- **Mô tả (mới)**: Tham gia hướng dẫn đề tài nghiên cứu

### Dữ liệu Tìm Kiếm:
- **Tìm theo tên**: Nguyễn
- **Tìm theo email**: gv001@university
- **Tìm theo username**: gv_001
- **Tìm theo mã GV**: GV001
- **Tìm theo khoa**: Công Nghệ Thông Tin
- **Tìm theo chuyên môn**: Lập trình Web

### Danh sách Giảng Viên Kiểm Thử:
| STT | Username | Email | Tên | Họ | Mã GV | Khoa | Chuyên môn | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| 1 | gv_001 | gv001@university.edu.vn | Nguyễn | Văn A | GV001 | CNTT | Lập trình Web | ACTIVE |
| 2 | gv_002 | gv002@university.edu.vn | Trần | Văn B | GV002 | CNTT | Hệ thống thông tin | ACTIVE |
| 3 | gv_003 | gv003@university.edu.vn | Phạm | Thị C | GV003 | HTTT | Phân tích dữ liệu | ACTIVE |
| 4 | gv_004 | gv004@university.edu.vn | Hoàng | Văn D | GV004 | HTTT | Kiến trúc phần mềm | INACTIVE |
| 5 | gv_005 | gv005@university.edu.vn | Lê | Thị E | GV005 | QTKD | Quản trị dự án | ACTIVE |

## Prerequisites

- Đăng nhập thành công vào hệ thống với tài khoản Admin của đúng cơ sở giáo dục
- Truy cập trang quản lý giảng viên: `/admin/teachers`
- Cơ sở giáo dục đã được tạo và ở trạng thái Active
- Danh sách khoa/phòng ban đã tồn tại (ví dụ: CNTT, HTTT, QTKD)
- Dữ liệu giảng viên mẫu đã được seed theo bảng "Danh sách Giảng Viên Kiểm Thử" để kiểm thử update/delete/lock

## Step Details - Tạo Giảng Viên Mới

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ TeacherListPage, ấn nút **"Tạo Giảng Viên Mới"** | Modal "Tạo Giảng Viên Mới" hiển thị với form rỗng | | |
| 2 | Điền **Cá nhân**: Tên: `Nguyễn`, Họ: `Văn A`, Ngày sinh: `05/01/1985` | Các trường được điền đầy đủ, không có lỗi xác thực | | |
| 3 | Điền **Tài khoản**: Username: `gv_001`, Email: `gv001@university.edu.vn`, Mật khẩu: `Password@123` | Tất cả trường được điền, mật khẩu có thể ẩn/hiện | | |
| 4 | Điền **Thông tin nghề nghiệp**: Mã GV: `GV001`, Khoa: `Công Nghệ Thông Tin`, Chuyên môn: `Lập trình Web, Hệ thống thông tin` | Trường được điền đầy đủ, dropdown khoa hoạt động | | |
| 5 | Điền **Bổ sung**: Mô tả, Liên kết mạng xã hội | Textarea và URL hợp lệ | | |
| 6 | Ấn **"Tạo Giảng Viên"** | Thông báo thành công, modal đóng, danh sách cập nhật | | |
| 7 | Kiểm tra giảng viên mới trong danh sách | Hiển thị đầy đủ thông tin | | |
| 8 | Ấn vào tên giảng viên để xem chi tiết | StudentDetailModal/TeacherDetailModal hiển thị thông tin | | |

## Step Details - Chỉnh Sửa Giảng Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn **Edit** (✏️) trên hàng `Nguyễn Văn A` | Modal "Chỉnh Sửa Giảng Viên" hiển thị với dữ liệu hiện tại | | |
| 2 | Sửa **Tên/Họ** thành `Trần Văn B` | Trường cập nhật đúng | | |
| 3 | Sửa **Khoa** thành `Hệ Thống Thông Tin` | Dropdown cập nhật | | |
| 4 | Sửa **Chuyên môn** thành `Phân tích dữ liệu, Kiến trúc phần mềm` | Trường cập nhật | | |
| 5 | Để trống **Mật khẩu** (giữ mật khẩu cũ) | Không lỗi validate | | |
| 6 | Ấn **"Cập Nhật Giảng Viên"** | Thông báo success, danh sách cập nhật | | |
| 7 | Kiểm tra danh sách | Tên mới, khoa mới, chuyên môn mới hiển thị | | |

## Step Details - Xóa Giảng Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn **Delete** (🗑️) trên hàng `Lê Thị E` | Confirm dialog hiển thị nội dung đúng | | |
| 2 | Ấn **OK** để xác nhận | Thông báo "Xóa giảng viên thành công", danh sách cập nhật | | |
| 3 | Kiểm tra danh sách | Giảng viên `Lê Thị E` không còn | | |
| 4 | Ấn **Cancel** trong confirm | Không bị xóa, modal đóng | | |

## Step Details - Khóa/Mở Khóa Tài Khoản

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Tìm giảng viên `Hoàng Văn D` trạng thái `INACTIVE` (❌) | Badge "Không hoạt động" màu xám | | |
| 2 | Ấn **Lock/Unlock** (🔓) | Confirm hiển thị nội dung đúng | | |
| 3 | Ấn **OK** để mở khóa | Trạng thái thành `ACTIVE` (✅), thông báo success | | |
| 4 | Ấn **Lock** (🔒) lại | Trạng thái chuyển `INACTIVE`, thông báo success | | |

## Step Details - Xem Chi Tiết Giảng Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn vào tên **Nguyễn Văn A** | Modal chi tiết hiển thị đầy đủ | | |
| 2 | Kiểm tra **Thông tin liên hệ** | Email: `gv001@university.edu.vn` hiển thị đúng | | |
| 3 | Kiểm tra **Thông tin nghề nghiệp** | Mã GV: `GV001`, Khoa: `Công Nghệ Thông Tin`, Chuyên môn | | |
| 4 | Kiểm tra **Bổ sung** | Mô tả và Social URL hiển thị nếu có | | |
| 5 | Ấn **"Chỉnh Sửa"** từ detail modal | Chuyển chế độ edit | | |
| 6 | Ấn **"Khóa Tài Khoản"** từ detail modal | Confirm và cập nhật trạng thái | | |
| 7 | Ấn **"Đóng"** | Đóng modal, quay về danh sách | | |

## Step Details - Tìm Kiếm Giảng Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Nhập **"Nguyễn"** vào ô tìm kiếm | Danh sách hiển thị tên chứa "Nguyễn" | | |
| 2 | Xóa từ khóa | Danh sách trở lại đầy đủ | | |
| 3 | Nhập **"gv001@"** | Hiển thị email chứa "gv001@" | | |
| 4 | Nhập **"GV002"** | Hiển thị giảng viên có mã "GV002" | | |
| 5 | Nhập **"Công Nghệ Thông Tin"** | Hiển thị giảng viên thuộc khoa này | | |
| 6 | Nhập **"Lập trình Web"** | Hiển thị theo chuyên môn | | |
| 7 | Nhập **"XYZ123"** (không tồn tại) | Danh sách trống kèm thông báo phù hợp | | |

## Step Details - Phân Trang

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Với 15 giảng viên trong cơ sở | Mặc định 10 giảng viên/trang, có pagination controls | | |
| 2 | Ấn **Next page** (▶) | Trang 2 hiển thị 5 giảng viên còn lại | | |
| 3 | Ấn **Previous page** (◀) | Quay lại trang 1 | | |
| 4 | Ấn **Last page** (►►) | Chuyển trang cuối, số lượng đúng | | |
| 5 | Ấn **First page** (◄◄) | Quay về trang 1 | | |
| 6 | Đổi **Page size** 10 → 5 | Hiển thị 5 giảng viên trên trang 1 | | |
| 7 | Đổi **Page size** 20 | Hiển thị toàn bộ 15 giảng viên | | |
| 8 | Kiểm tra text pagination | Ví dụ: "Trang 1 / 3", "Hiển thị 5/15 giảng viên" | | |

## Step Details - Thống Kê Giảng Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Kiểm tra **Statistics Card** | Card "👨‍🏫 Tổng Giảng viên" hiển thị đúng (vd: 15) | | |
| 2 | Thêm giảng viên | Số liệu tổng tăng 1 | | |
| 3 | Xóa giảng viên | Số liệu tổng giảm 1 | | |

## Validation Rules

### Tên Đăng Nhập (Username):
- Không được để trống
- Tối thiểu 3 ký tự
- Phải duy nhất trong cơ sở giáo dục
- Chỉ chứa chữ cái, số, dấu gạch dưới

### Mật Khẩu (Password):
- Tối thiểu 6 ký tự
- Bắt buộc khi tạo mới
- Tùy chọn khi chỉnh sửa (để trống giữ mật khẩu cũ)

### Email:
- Định dạng hợp lệ (vd: user@example.com)
- Không được để trống
- Phải duy nhất trong cơ sở giáo dục

### Tên & Họ:
- Không được để trống
- Có ít nhất một ký tự

### Mã Giảng Viên (TeacherId):
- Không được để trống
- Phải duy nhất trong cơ sở giáo dục
- Ví dụ: GV001, GV002, ...

### Ngày Sinh (Date of Birth):
- Tùy chọn
- Nếu nhập: ≥ 22 tuổi (giảng viên)
- Format: YYYY-MM-DD hoặc DD/MM/YYYY

### Khoa (Department):
- Tùy chọn
- Chọn từ dropdown danh sách khoa đã tạo

### Chuyên Môn (Expertise):
- Tùy chọn
- Cho phép danh sách kỹ năng/chuyên môn dạng text

### Mô Tả (Description):
- Tùy chọn
- Cho phép nội dung dài

### Liên Kết Mạng Xã Hội (Social URL):
- Tùy chọn
- Format: URL hợp lệ (vd: https://linkedin.com/in/username)

## Error Scenarios

| Scenario | Test Data | Expected Error |
|---|---|---|
| Username đã tồn tại | `gv_001` (đã tồn tại) | "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác." |
| Email đã tồn tại | `gv001@university.edu.vn` (đã tồn tại) | "Email này đã được đăng ký. Vui lòng sử dụng email khác." |
| Mã giảng viên đã tồn tại | `GV001` (đã tồn tại) | "Mã giảng viên này đã được sử dụng. Vui lòng dùng mã khác." |
| Username quá ngắn | `gv` | "Tên đăng nhập phải có ít nhất 3 ký tự." |
| Email format sai | `invalid.email@` | "Định dạng email không hợp lệ." |
| Password quá ngắn | `Pass1` | "Mật khẩu phải có ít nhất 6 ký tự." |
| Ngày sinh < 22 tuổi | `15/05/2010` | "Giảng viên phải đủ 22 tuổi trở lên." |
| Thiếu tên bắt buộc | Bỏ trống "Tên" | "Tên là bắt buộc." |
| Thiếu mã GV | Bỏ trống "Mã giảng viên" | "Mã giảng viên là bắt buộc." |
| URL format sai | `not a url` | Yêu cầu format URL hợp lệ hoặc từ chối lưu |

## Notes

- Test case áp dụng cho giao diện `TeacherListPage.tsx`
- Admin chỉ quản lý giảng viên thuộc cơ sở của mình
- Mật khẩu bắt buộc khi tạo mới; tùy chọn khi chỉnh sửa
- Xóa giảng viên không thể hoàn tác, cần xác nhận
- Khóa/Mở khóa tài khoản có thể từ danh sách hoặc detail modal
- Tìm kiếm hỗ trợ debounce 500ms để tối ưu
- Phân trang mặc định 10 giảng viên/trang, tối đa 50/trang

---

**Created:** December 12, 2025  
**Test Environment:** Development  
**Browser:** Chrome, Firefox, Edge  
**Status:** Ready for Testing
