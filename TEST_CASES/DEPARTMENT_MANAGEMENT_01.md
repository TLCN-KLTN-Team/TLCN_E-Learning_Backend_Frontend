# TEST CASE: Quản Lý Khoa/Phòng Ban

| Test case ID | Title | Description | Module | Screen |
|---|---|---|---|---|
| DEPARTMENT_MANAGEMENT_01 | Quản lý khoa/phòng ban | CRUD, tìm kiếm, phân trang, trạng thái, thống kê trên DepartmentManagementPage | Admin | DepartmentManagementPage |

## Prerequisites

- Đăng nhập thành công hệ thống với tài khoản Admin của đúng cơ sở giáo dục
- Truy cập trang quản lý khoa/phòng ban: `/admin/departments`
- Cơ sở giáo dục đã được tạo và ở trạng thái Active
- Danh sách khoa/phòng ban đã có dữ liệu seed tối thiểu 10 bản ghi để kiểm thử phân trang
- Các ràng buộc: tên khoa duy nhất trong một cơ sở giáo dục; mã khoa nếu có cũng duy nhất

## Test Data

### Dữ liệu tạo Khoa (Create)
- **Tên khoa**: Công Nghệ Thông Tin
- **Mã khoa**: CNTT
- **Mô tả**: Phụ trách đào tạo các ngành về CNTT
- **Trạng thái**: Active

### Dữ liệu chỉnh sửa (Update)
- **Tên khoa (mới)**: Hệ Thống Thông Tin
- **Mã khoa (mới)**: HTTT
- **Mô tả (mới)**: Phụ trách các chuyên ngành HTTT
- **Trạng thái (mới)**: Active

### Dữ liệu tìm kiếm
- **Theo tên**: "Công Nghệ Thông Tin", "Hệ Thống Thông Tin"
- **Theo mã**: "CNTT", "HTTT"
- **Theo trạng thái**: Active/Inactive

### Danh sách Khoa kiểm thử
| STT | Tên khoa | Mã khoa | Trạng thái |
|---|---|---|---|
| 1 | Công Nghệ Thông Tin | CNTT | Active |
| 2 | Hệ Thống Thông Tin | HTTT | Active |
| 3 | Khoa Kinh Tế | KKT | Active |
| 4 | Khoa Điện Tử | KDT | Inactive |
| 5 | Khoa Ngoại Ngữ | KNN | Active |
| 6 | Khoa Toán | KTM | Active |
| 7 | Khoa Vật Lý | KVL | Active |
| 8 | Khoa Hóa | KHH | Inactive |
| 9 | Khoa Sinh | KSH | Active |
| 10 | Khoa Xã Hội | KXH | Active |

## Step Details - Tạo Khoa Mới

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Từ DepartmentManagementPage, ấn nút **"Tạo Khoa Mới"** | Modal "Tạo Khoa Mới" hiển thị với form rỗng | | |
| 2 | Điền **Tên khoa**: `Công Nghệ Thông Tin` | Không có lỗi xác thực, trường hợp bắt buộc | | |
| 3 | Điền **Mã khoa**: `CNTT` | Hợp lệ, không trùng | | |
| 4 | Điền **Mô tả**: `Phụ trách đào tạo các ngành về CNTT` | Textarea nhận nội dung dài | | |
| 5 | Chọn **Trạng thái**: `Active` | Dropdown/Toggle hiển thị trạng thái | | |
| 6 | Ấn **"Tạo Khoa"** | Thông báo thành công, modal đóng, danh sách cập nhật | | |
| 7 | Kiểm tra khoa mới trong danh sách | Hiển thị đầy đủ tên, mã, trạng thái | | |
| 8 | Ấn vào tên khoa để xem chi tiết | DepartmentDetailModal hiển thị thông tin | | |

## Step Details - Chỉnh Sửa Khoa

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn **Edit** (✏️) trên hàng `Công Nghệ Thông Tin` | Modal "Chỉnh Sửa Khoa" hiển thị với dữ liệu hiện tại | | |
| 2 | Sửa **Tên khoa** thành `Hệ Thống Thông Tin` | Trường cập nhật đúng | | |
| 3 | Sửa **Mã khoa** thành `HTTT` | Không trùng, cập nhật thành công | | |
| 4 | Sửa **Mô tả** | Nội dung cập nhật | | |
| 5 | Ấn **"Cập Nhật"** | Thông báo success, danh sách cập nhật | | |
| 6 | Kiểm tra danh sách | Tên/mã mới hiển thị | | |

## Step Details - Xóa Khoa

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn **Delete** (🗑️) trên hàng `Khoa Điện Tử` | Confirm dialog hiển thị nội dung đúng | | |
| 2 | Ấn **OK** để xác nhận | Thông báo "Xóa khoa thành công", danh sách cập nhật | | |
| 3 | Kiểm tra danh sách | Khoa `Khoa Điện Tử` không còn | | |
| 4 | Ấn **Cancel** trong confirm | Không bị xóa, modal đóng | | |

## Step Details - Khóa/Mở Khoá Khoa (Trạng thái Active/Inactive)

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Tìm khoa `Khoa Hóa` trạng thái `Inactive` (❌) | Badge "Không hoạt động" màu xám | | |
| 2 | Ấn **Activate/Deactivate** | Confirm hiển thị nội dung đúng | | |
| 3 | Ấn **Activate** | Trạng thái thành `Active` (✅), thông báo success | | |
| 4 | Ấn **Deactivate** lại | Trạng thái chuyển `Inactive`, thông báo success | | |

## Step Details - Xem Chi Tiết Khoa

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Ấn vào tên **Công Nghệ Thông Tin** | Modal chi tiết hiển thị đầy đủ | | |
| 2 | Kiểm tra **Mã khoa** | `CNTT` hiển thị đúng | | |
| 3 | Kiểm tra **Mô tả** | Hiển thị nội dung nếu có | | |
| 4 | Ấn **"Chỉnh Sửa"** từ detail modal | Chuyển chế độ edit | | |
| 5 | Ấn **"Đóng"** | Đóng modal, quay về danh sách | | |

## Step Details - Tìm Kiếm Khoa

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Nhập **"Công Nghệ Thông Tin"** vào ô tìm kiếm | Danh sách hiển thị khoa chứa cụm từ | | |
| 2 | Xóa từ khóa | Danh sách trở lại đầy đủ | | |
| 3 | Nhập **"CNTT"** | Hiển thị khoa có mã "CNTT" | | |
| 4 | Nhập **"Inactive"** | Hiển thị khoa có trạng thái Inactive (nếu hỗ trợ filter) | | |
| 5 | Nhập **"XYZ123"** (không tồn tại) | Danh sách trống kèm thông báo phù hợp | | |

## Step Details - Phân Trang

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Với ≥ 12 khoa | Mặc định 10 khoa/trang, có pagination controls | | |
| 2 | Ấn **Next page** (▶) | Trang 2 hiển thị phần còn lại | | |
| 3 | Ấn **Previous page** (◀) | Quay lại trang 1 | | |
| 4 | Ấn **Last page** (►►) | Chuyển trang cuối, số lượng đúng | | |
| 5 | Ấn **First page** (◄◄) | Quay về trang 1 | | |
| 6 | Đổi **Page size** 10 → 5 | Hiển thị 5 khoa trên trang 1 | | |
| 7 | Đổi **Page size** 20 | Hiển thị toàn bộ danh sách | | |
| 8 | Kiểm tra text pagination | Ví dụ: "Trang 1 / 2", "Hiển thị 10/12 khoa" | | |

## Thống Kê Khoa

| Step | Description | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Kiểm tra **Statistics Card** | Card "🏫 Tổng Khoa" hiển thị đúng (vd: 12) | | |
| 2 | Thêm khoa | Số liệu tổng tăng 1 | | |
| 3 | Xóa khoa | Số liệu tổng giảm 1 | | |

## Validation Rules

### Tên Khoa (DepartmentName)
- Bắt buộc, không được để trống
- Độ dài hợp lý (1–100 ký tự)
- Duy nhất trong cơ sở giáo dục

### Mã Khoa (DepartmentCode)
- Tùy chọn; nếu có phải duy nhất
- Chỉ chữ cái/số/gạch dưới; độ dài 2–10

### Mô Tả (Description)
- Tùy chọn; cho phép nội dung dài

### Trạng Thái (Status)
- Active/Inactive; mặc định Active khi tạo

## Error Scenarios

| Scenario | Test Data | Expected Error |
|---|---|---|
| Tên khoa đã tồn tại | `Công Nghệ Thông Tin` (đã tồn tại) | "Tên khoa này đã được sử dụng. Vui lòng chọn tên khác." |
| Mã khoa đã tồn tại | `CNTT` (đã tồn tại) | "Mã khoa này đã được sử dụng. Vui lòng dùng mã khác." |
| Tên khoa trống | `` | "Tên khoa là bắt buộc." |
| Mã khoa format sai | `C@NTT!` | "Mã khoa chỉ cho phép chữ/số/gạch dưới." |

## Notes

- Test case áp dụng cho giao diện `DepartmentManagementPage.tsx`
- Admin chỉ quản lý khoa thuộc cơ sở của mình
- Tìm kiếm hỗ trợ debounce 500ms để tối ưu
- Phân trang mặc định 10 khoa/trang, tối đa 50/trang

---

**Created:** December 13, 2025  
**Test Environment:** Development  
**Browser:** Chrome, Firefox, Edge  
**Status:** Ready for Testing  
