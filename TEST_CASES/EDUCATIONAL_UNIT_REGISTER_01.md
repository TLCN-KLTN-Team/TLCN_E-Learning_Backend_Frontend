# TEST CASE: Đăng ký Đơn vị Đào tạo

| Test case ID | EDUCATIONAL_UNIT_REGISTER_01 | Description | Đăng ký tài khoản Đơn vị Đào tạo | Đăng ký tài khoản |
|---|---|---|---|---|

## Test Data

### Thông tin Đơn vị Đào tạo:
- **Tên đơn vị đào tạo**: Đại học Công Nghệ Thông Tin
- **Loại hình đào tạo**: Đại học
- **Địa chỉ**: 123 Đường Lê Lợi, Quận 1, TP HCM
- **Số điện thoại**: 0283824866
- **Email**: dhcntt@university.edu.vn
- **Website**: https://dhcntt.edu.vn
- **Năm thành lập**: 2005
- **Mô tả**: Đơn vị đào tạo chuyên về Công Nghệ Thông Tin, đạo tạo hơn 5000 sinh viên mỗi năm
- **Logo**: file image (JPG, PNG, GIF)
- **Giấy phép hoạt động**: file PDF/JPG/PNG

### Thông tin Tài khoản Quản trị viên:
- **Tên đăng nhập**: admin_dhcntt
- **Mật khẩu**: Admin@123456
- **Xác nhận Mật khẩu**: Admin@123456

### Thông tin Người đại diện:
- **Họ và tên**: Trần Văn A
- **Chức vụ**: Hiệu trưởng
- **Số điện thoại**: 0987654321
- **Email**: tran.van.a@dhcntt.edu.vn

## Prerequisites

- Truy cập vào trang đăng ký Đơn vị Đào tạo: `http://localhost:3000/register/educational-unit`
- Hệ thống ở trạng thái sẵn sàng
- Có các file logo và giấy phép hoạt động để upload

## Step Details

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Điền thông tin **Tài khoản quản trị viên**: Tên đăng nhập: `admin_dhcntt`, Mật khẩu: `Admin@123456`, Xác nhận mật khẩu: `Admin@123456` | Các trường được điền đầy đủ, có thể nhìn/ẩn mật khẩu được, không có lỗi xác thực | | |
| 2 | Điền thông tin **Người đại diện**: Họ và tên: `Trần Văn A`, Chức vụ: `Hiệu trưởng`, Số điện thoại: `0987654321`, Email: `tran.van.a@dhcntt.edu.vn` | Tất cả các trường được điền đầy đủ, email format hợp lệ | | |
| 3 | Điền thông tin **Đơn vị đào tạo**: Tên: `Đại học Công Nghệ Thông Tin`, Loại hình: `Đại học`, Địa chỉ: `123 Đường Lê Lợi, Quận 1, TP HCM`, Số điện thoại: `0283824866`, Email: `dhcntt@university.edu.vn`, Website: `https://dhcntt.edu.vn`, Năm thành lập: `2005` | Tất cả các trường được điền đầy đủ, select dropdown hoạt động đúng | | |
| 4 | Nhập thông tin mô tả: `Đơn vị đào tạo chuyên về Công Nghệ Thông Tin, đạo tạo hơn 5000 sinh viên mỗi năm` | Textarea chấp nhận văn bản dài, hiển thị đúng | | |
| 5 | Upload **Logo đơn vị**: Chọn file hình ảnh (JPG hoặc PNG) | File được chọn, preview ảnh hiển thị, có nút xóa file | | |
| 6 | Upload **Giấy phép hoạt động**: Chọn file PDF hoặc hình ảnh | File được chọn, hiển thị tên file hoặc preview, có nút xóa file | | |
| 7 | Ấn nút **"Đăng ký đơn vị"** | Thông báo "Đăng ký đơn vị đào tạo thành công!" hiển thị, Chuyển hướng đến trang chủ (`/`) | | |
| 8 | Kiểm tra email quản trị viên `tran.van.a@dhcntt.edu.vn` | Email xác minh được gửi với link kích hoạt tài khoản | | |
| 9 | Ấn link xác minh trong email | Tài khoản quản trị viên được kích hoạt, có thể đăng nhập bằng email `tran.van.a@dhcntt.edu.vn` | | |
| 10 | Đăng nhập bằng tên đăng nhập: `admin_dhcntt` hoặc email: `tran.van.a@dhcntt.edu.vn`, Mật khẩu: `Admin@123456` | Đăng nhập thành công, Chuyển hướng đến Dashboard quản trị viên của Đơn vị Đào tạo | | |

## Validation Rules

### Tên đăng nhập (Admin):
- Không được để trống
- Độ dài từ 3-50 ký tự
- Chỉ chứa chữ cái, số, dấu gạch dưới
- Phải duy nhất trong hệ thống

### Mật khẩu (Admin):
- Độ dài tối thiểu 6 ký tự
- Khuyên dùng: chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số
- Mật khẩu xác nhận phải trùng khớp

### Thông tin Người đại diện:
- **Họ và tên**: Không được để trống, độ dài 5-100 ký tự
- **Chức vụ**: Không được để trống, độ dài 3-50 ký tự
- **Số điện thoại**: Phải là số hợp lệ, 10-11 chữ số
- **Email**: Định dạng email hợp lệ, phải duy nhất trong hệ thống

### Thông tin Đơn vị:
- **Tên đơn vị**: Không được để trống, độ dài 5-200 ký tự
- **Loại hình**: Phải chọn một giá trị (Đại học, Cao đẳng, Trung cấp, Trung tâm đào tạo, Khác)
- **Địa chỉ**: Không được để trống, độ dài 10-500 ký tự
- **Số điện thoại**: Phải là số hợp lệ, 10-11 chữ số
- **Email**: Định dạng email hợp lệ, có thể khác email người đại diện
- **Website**: Format URL hợp lệ (nếu nhập)
- **Năm thành lập**: Phải là số năm hợp lệ (1900 - hiện tại)
- **Mô tả**: Không được để trống, độ dài 20-1000 ký tự
- **Logo**: Optional, chấp nhận JPG, PNG, GIF
- **Giấy phép hoạt động**: Optional, chấp nhận PDF, JPG, PNG

## Error Scenarios

| Scenario | Test Data | Expected Error |
|---|---|---|
| Tên đăng nhập đã tồn tại | Sử dụng tên đăng nhập đã được đăng ký | "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên đăng nhập khác." |
| Email người đại diện đã tồn tại | Sử dụng email đã được đăng ký | "Email này đã được sử dụng. Vui lòng sử dụng email khác." |
| Mật khẩu không khớp | Nhập mật khẩu khác xác nhận | "Mật khẩu xác nhận không khớp!" |
| Thiếu thông tin bắt buộc | Bỏ trống bất kỳ trường bắt buộc nào | "Vui lòng điền đầy đủ thông tin bắt buộc!" |
| Email format sai | `invalid.email@` hoặc `test@domain` | "Định dạng email không hợp lệ." |
| Mật khẩu quá ngắn | `Admin1` | "Mật khẩu phải có ít nhất 6 ký tự." |

## Notes

- Test case này dành cho chức năng đăng ký Đơn vị Đào tạo trên giao diện `EducationUnitRegistration.tsx`
- Email xác minh sẽ được gửi đến email của **Người đại diện** (representativeEmail)
- Quản trị viên có thể đăng nhập bằng **tên đăng nhập** hoặc **email người đại diện**
- Sau khi xác minh thành công, quản trị viên có thể thêm giáo viên, sinh viên, và quản lý các khóa học
- Nếu email không được xác minh trong 24 giờ, link sẽ hết hạn
