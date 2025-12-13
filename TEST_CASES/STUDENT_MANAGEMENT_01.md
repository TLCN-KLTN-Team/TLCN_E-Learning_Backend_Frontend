# TEST CASE: Quản Lý Học Viên

| Test case ID | Title | Description | Module | Screen |
|---|---|---|---|---|
| STUDENT_MANAGEMENT_01 | Quản lý học viên | CRUD, khóa/mở khóa, tìm kiếm, phân trang, thống kê trên StudentListPage | Admin | StudentListPage |

## Test Data

### Thông tin Cơ sở Giáo dục:
- **Tên cơ sở**: Đại học Công Nghệ Thông Tin
- **ID Cơ sở**: 1

### Dữ liệu Tạo Học Viên (Create):
- **Tên đăng nhập**: sv_001
- **Mật khẩu**: Password@123
- **Email**: sv001@university.edu.vn
- **Tên**: Nguyễn
- **Họ**: Văn A
- **Ngày sinh**: 05/01/2005
- **Mã sinh viên**: SV001
- **Tên lớp**: CNTT2023A
- **Khoa**: Công Nghệ Thông Tin
- **Mô tả**: Sinh viên giỏi, tham gia nhiều hoạt động
- **Liên kết mạng xã hội**: https://facebook.com/sv001

### Dữ liệu Chỉnh Sửa (Update):
- **Tên**: Trần
- **Họ**: Văn B
- **Tên lớp (mới)**: CNTT2023B
- **Mô tả (mới)**: Sinh viên giỏi, tham gia cuộc thi lập trình

### Dữ liệu Tìm Kiếm:
- **Tìm theo tên**: Nguyễn
- **Tìm theo email**: sv001@university
- **Tìm theo username**: sv_001
- **Tìm theo mã SV**: SV001
- **Tìm theo lớp**: CNTT2023A

### Danh sách Học Viên Kiểm Thử:
| STT | Username | Email | Tên | Họ | Mã SV | Lớp | Khoa | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| 1 | sv_001 | sv001@university.edu.vn | Nguyễn | Văn A | SV001 | CNTT2023A | CNTT | ACTIVE |
| 2 | sv_002 | sv002@university.edu.vn | Trần | Văn B | SV002 | CNTT2023A | CNTT | ACTIVE |
| 3 | sv_003 | sv003@university.edu.vn | Phạm | Thị C | SV003 | CNTT2023B | CNTT | ACTIVE |
| 4 | sv_004 | sv004@university.edu.vn | Hoàng | Văn D | SV004 | CNTT2023B | CNTT | INACTIVE |
| 5 | sv_005 | sv005@university.edu.vn | Lê | Thị E | SV005 | QTKD2023A | Quản Trị | ACTIVE |

## Prerequisites

- Đăng nhập thành công vào hệ thống với tài khoản Admin của đúng cơ sở giáo dục
- Truy cập trang quản lý học viên: `/admin/students`
- Cơ sở giáo dục đã được tạo và ở trạng thái Active
- Danh sách khoa/phòng ban đã tồn tại (ví dụ: CNTT, Quản Trị)
- Dữ liệu học viên mẫu đã được seed theo bảng "Danh sách Học Viên Kiểm Thử" để kiểm thử update/delete/lock

## Step Details - Tạo Học Viên Mới

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ trang StudentListPage, ấn nút **"Tạo Học sinh Mới"** | Modal "Tạo Sinh Viên Mới" hiển thị với form rỗng | | |
| 2 | Điền thông tin **Cá nhân**: Tên: `Nguyễn`, Họ: `Văn A`, Ngày sinh: `05/01/2005` | Các trường được điền đầy đủ, không có lỗi xác thực | | |
| 3 | Điền thông tin **Tài khoản**: Tên đăng nhập: `sv_001`, Email: `sv001@university.edu.vn`, Mật khẩu: `Password@123` | Tất cả trường được điền, mật khẩu có thể ẩn/hiện bằng nút 👁️ | | |
| 4 | Điền thông tin **Học tập**: Mã sinh viên: `SV001`, Tên lớp: `CNTT2023A`, Khoa: `Công Nghệ Thông Tin` | Tất cả trường được điền đầy đủ, dropdown khoa hoạt động bình thường | | |
| 5 | Điền thông tin **Bổ sung**: Mô tả: `Sinh viên giỏi, tham gia nhiều hoạt động`, Mạng xã hội: `https://facebook.com/sv001` | Textarea và URL field được điền, không có lỗi | | |
| 6 | Ấn nút **"Tạo Sinh Viên"** | Thông báo success: "Tạo sinh viên thành công!", Modal đóng, Danh sách cập nhật với học viên mới | | |
| 7 | Kiểm tra học viên mới trong danh sách | Học viên `Nguyễn Văn A` hiển thị trong bảng với đầy đủ thông tin | | |
| 8 | Ấn vào tên học viên để xem chi tiết | Modal StudentDetailModal hiển thị tất cả thông tin của học viên | | |

## Step Details - Chỉnh Sửa Học Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ danh sách, ấn nút **Edit** (✏️) trên hàng học viên `Nguyễn Văn A` | Modal "Chỉnh Sửa Sinh Viên" hiển thị với dữ liệu hiện tại, header có màu cam | | |
| 2 | Sửa **Tên**: từ `Nguyễn` thành `Trần`, **Họ**: từ `Văn A` thành `Văn B` | Các trường được cập nhật đúng | | |
| 3 | Sửa **Tên lớp**: từ `CNTT2023A` thành `CNTT2023B` | Trường được cập nhật, không có validate error | | |
| 4 | Sửa **Mô tả**: thêm "tham gia cuộc thi lập trình" | Mô tả được cập nhật đầy đủ | | |
| 5 | Để trống **Mật khẩu** (giữ nguyên mật khẩu cũ) | Không có error, hệ thống sẽ giữ mật khẩu cũ | | |
| 6 | Ấn nút **"Cập Nhật Sinh Viên"** | Thông báo success: "Cập nhật sinh viên thành công!", Modal đóng, Danh sách cập nhật | | |
| 7 | Kiểm tra học viên trong danh sách | Học viên hiển thị tên mới: `Trần Văn B`, lớp mới: `CNTT2023B` | | |

## Step Details - Xóa Học Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ danh sách, ấn nút **Delete** (🗑️) trên hàng học viên `Lê Thị E` | Confirm dialog hiển thị: "Bạn có chắc chắn muốn xóa học sinh 'Lê Thị E'?" | | |
| 2 | Ấn **OK** để xác nhận xóa | Học viên bị xóa, thông báo "Xóa học sinh thành công!" hiển thị, danh sách cập nhật | | |
| 3 | Kiểm tra danh sách | Học viên `Lê Thị E` không còn trong danh sách | | |
| 4 | Ấn nút **Delete** và sau đó ấn **Cancel** | Học viên không bị xóa, modal đóng | | |

## Step Details - Khóa/Mở Khóa Tài Khoản

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ danh sách, tìm học viên `Hoàng Văn D` với trạng thái `INACTIVE` (❌) | Học viên hiển thị với badge "Không hoạt động" màu xám | | |
| 2 | Ấn nút **Lock/Unlock** (🔓) trên hàng này | Confirm dialog hiển thị: "Bạn có chắc chắn muốn mở khóa tài khoản của 'Hoàng Văn D'?" | | |
| 3 | Ấn **OK** để xác nhận | Thông báo "Mở khóa tài khoản thành công!", Trạng thái thay đổi thành `ACTIVE` (✅) | | |
| 4 | Ấn nút **Lock** (🔒) trên học viên vừa mở khóa | Confirm dialog hiển thị: "Bạn có chắc chắn muốn khóa tài khoản..." | | |
| 5 | Ấn **OK** để xác nhận | Thông báo "Khóa tài khoản thành công!", Trạng thái thay đổi thành `INACTIVE` | | |

## Step Details - Xem Chi Tiết Học Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ danh sách, ấn vào tên học viên **Nguyễn Văn A** | Modal StudentDetailModal hiển thị với đầy đủ thông tin | | |
| 2 | Kiểm tra **Thông tin Liên hệ** | Hiển thị đúng Email: `sv001@university.edu.vn` | | |
| 3 | Kiểm tra **Thông tin Học tập** | Hiển thị Mã SV: `SV001`, Lớp: `CNTT2023A`, Khoa: `Công Nghệ Thông Tin` | | |
| 4 | Kiểm tra **Thông tin Bổ sung** | Hiển thị Mô tả và Liên kết Mạng xã hội nếu có | | |
| 5 | Ấn nút **"Chỉnh Sửa"** từ detail modal | Modal chuyển sang chế độ edit (header cam) | | |
| 6 | Ấn nút **"Khóa Tài Khoản"** từ detail modal | Confirm dialog hiển thị, sau khi xác nhận trạng thái cập nhật | | |
| 7 | Ấn nút **"Đóng"** | Detail modal đóng, quay về danh sách | | |

## Step Details - Tìm Kiếm Học Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ trang StudentListPage, nhập **"Nguyễn"** vào ô tìm kiếm | Danh sách cập nhật (debounce 500ms), hiển thị học viên có tên chứa "Nguyễn" | | |
| 2 | Xóa từ khóa tìm kiếm | Danh sách trở lại đầy đủ tất cả học viên | | |
| 3 | Nhập **"sv001@"** vào ô tìm kiếm | Danh sách cập nhật, hiển thị học viên có email chứa "sv001@" | | |
| 4 | Nhập **"SV002"** vào ô tìm kiếm | Danh sách hiển thị học viên có mã SV là "SV002" | | |
| 5 | Nhập **"CNTT2023A"** vào ô tìm kiếm | Danh sách hiển thị học viên thuộc lớp "CNTT2023A" | | |
| 6 | Nhập từ khóa không tồn tại **"XYZ123"** | Danh sách trống với thông báo "Không có học sinh nào phù hợp với tìm kiếm" | | |

## Step Details - Phân Trang

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ trang StudentListPage với 15 học viên trong cơ sở | Mặc định hiển thị 10 học viên trên trang 1, có pagination controls | | |
| 2 | Ấn nút **Next page** (▶) | Trang chuyển sang trang 2, hiển thị 5 học viên còn lại | | |
| 3 | Ấn nút **Previous page** (◀) | Trang chuyển về trang 1, hiển thị 10 học viên đầu | | |
| 4 | Ấn nút **Last page** (►►) | Trang chuyển sang trang cuối (trang 2), hiển thị đúng số học viên | | |
| 5 | Ấn nút **First page** (◄◄) | Trang chuyển về trang 1 | | |
| 6 | Thay đổi **Page size** từ 10 thành 5 | Danh sách cập nhật, hiển thị 5 học viên trên trang 1 | | |
| 7 | Thay đổi **Page size** thành 20 | Tất cả 15 học viên hiển thị trên trang 1 | | |
| 8 | Kiểm tra text pagination | Hiển thị đúng: "Trang 1 / 3", "Hiển thị 5 trên tổng số 15 học sinh" | | |

## Step Details - Thống Kê Học Viên

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ trang StudentListPage, kiểm tra **Statistics Card** | Card hiển thị "👨‍🎓 Tổng Học sinh" với số liệu đúng (ví dụ: 15) | | |
| 2 | Thêm học viên mới | Số liệu tổng học sinh tăng lên 1 | | |
| 3 | Xóa một học viên | Số liệu tổng học sinh giảm đi 1 | | |

## Validation Rules

### Tên Đăng Nhập (Username):
- Không được để trống
- Độ dài tối thiểu 3 ký tự
- Phải duy nhất trong cơ sở giáo dục
- Chỉ chứa chữ cái, số, dấu gạch dưới

### Mật Khẩu (Password):
- Độ dài tối thiểu 6 ký tự
- Bắt buộc khi tạo mới
- Tùy chọn khi chỉnh sửa (nếu để trống sẽ giữ mật khẩu cũ)

### Email:
- Định dạng email hợp lệ (ví dụ: user@example.com)
- Không được để trống
- Phải duy nhất trong cơ sở giáo dục

### Tên & Họ:
- Không được để trống
- Bắt buộc phải có ít nhất một ký tự

### Mã Sinh Viên (StudentId):
- Không được để trống
- Phải duy nhất trong cơ sở giáo dục
- Ví dụ: SV001, SV002, v.v.

### Ngày Sinh (Date of Birth):
- Tùy chọn
- Nếu nhập phải từ 18 tuổi trở lên
- Format: YYYY-MM-DD hoặc DD/MM/YYYY

### Tên Lớp (ClassName):
- Tùy chọn
- Ví dụ: CNTT2023A, QTKD2023B

### Khoa (Department):
- Tùy chọn
- Chọn từ dropdown danh sách khoa đã tạo

### Mô Tả (Description):
- Tùy chọn
- Có thể chứa văn bản dài

### Liên Kết Mạng Xã Hội (Social URL):
- Tùy chọn
- Format: URL hợp lệ (ví dụ: https://facebook.com/username)

## Error Scenarios

| Scenario | Test Data | Expected Error |
|---|---|---|
| Username đã tồn tại | Sử dụng username `sv_001` (đã tồn tại) | "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên đăng nhập khác." |
| Email đã tồn tại | Sử dụng email `sv001@university.edu.vn` (đã tồn tại) | "Email này đã được đăng ký. Vui lòng sử dụng email khác." |
| Mã sinh viên đã tồn tại | Sử dụng mã SV `SV001` (đã tồn tại) | "Mã sinh viên này đã được sử dụng. Vui lòng sử dụng mã khác." |
| Username quá ngắn | Username: `sv` | "Tên đăng nhập phải có ít nhất 3 ký tự." |
| Email format sai | Email: `invalid.email@` | "Định dạng email không hợp lệ." |
| Password quá ngắn | Password: `Pass1` | "Mật khẩu phải có ít nhất 6 ký tự." |
| Ngày sinh < 18 tuổi | Ngày sinh: `15/05/2010` (14 tuổi) | "Sinh viên phải từ 18 tuổi trở lên." |
| Thiếu trường bắt buộc | Bỏ trống "Tên" | "Tên là bắt buộc." |
| Thiếu mã sinh viên | Bỏ trống "Mã sinh viên" | "Mã sinh viên là bắt buộc." |
| URL format sai | Social URL: `not a url` | Hệ thống có thể chấp nhận hoặc yêu cầu format hợp lệ |

## Notes

- Test case này dành cho chức năng quản lý học viên trên giao diện `StudentListPage.tsx`
- Admin chỉ có thể quản lý học viên của cơ sở giáo dục của mình
- Khi tạo mới, mật khẩu được yêu cầu bắt buộc
- Khi chỉnh sửa, mật khẩu tùy chọn (để trống để giữ mật khẩu cũ)
- Xóa học viên không thể hoàn tác, cần xác nhận
- Khóa/Mở khóa tài khoản có thể thực hiện từ danh sách hoặc detail modal
- Tìm kiếm hỗ trợ debounce 500ms để tối ưu hóa hiệu suất
- Phân trang mặc định 10 học viên/trang
- Có thể hiển thị tối đa 50 học viên/trang

---

**Created:** December 12, 2025  
**Test Environment:** Development  
**Browser:** Chrome, Firefox, Edge  
**Status:** Ready for Testing
