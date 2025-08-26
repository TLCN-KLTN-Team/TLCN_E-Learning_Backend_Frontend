# 🚀 Hệ Thống Error Codes Mới - Hướng Dẫn Frontend

## 📋 Tổng Quan

Hệ thống error codes mới được thiết kế với cấu trúc rõ ràng, thông báo tiếng Việt và dễ dàng phân loại để frontend xử lý hiệu quả.

## 🎯 Cấu Trúc Mã Lỗi

### Format: `PREFIX_XXXX`

| Prefix     | Mô Tả                 | Màn Hình Ảnh Hưởng      | Hành Động Đề Xuất                      |
| ---------- | --------------------- | ----------------------- | -------------------------------------- |
| `SYS_`     | Lỗi hệ thống          | Tất cả                  | Hiển thị thông báo lỗi chung, ghi log  |
| `AUTH_`    | Xác thực & phân quyền | Login, Protected routes | Redirect đến login hoặc hiển thị quyền |
| `USER_`    | Quản lý người dùng    | Registration, Profile   | Hiển thị lỗi tại form tương ứng        |
| `VALID_`   | Validation dữ liệu    | Forms                   | Focus field và hiển thị lỗi inline     |
| `BIZ_`     | Logic nghiệp vụ       | Business operations     | Hiển thị thông báo nghiệp vụ           |
| `FILE_`    | Xử lý file            | Upload, Download        | Hiển thị lỗi upload/download           |
| `TEACHER_` | Quản lý giảng viên    | Teacher management      | Hiển thị lỗi tại teacher forms         |
| `ROLE_`    | Quản lý vai trò       | Role management         | Hiển thị lỗi tại role forms            |

## 📚 Chi Tiết Mã Lỗi

### 🔧 System Errors (SYS_xxxx)

```javascript
{
  "SYS_0000": { // Success
    "message": "Yêu cầu thành công",
    "action": "continue_normal_flow"
  },
  "SYS_9999": { // System Error
    "message": "Lỗi hệ thống không xác định",
    "action": "show_error_toast"
  },
  "SYS_1001": { // Invalid Request
    "message": "Yêu cầu không hợp lệ",
    "action": "validate_input"
  }
}
```

### 🔐 Authentication Errors (AUTH_xxxx)

```javascript
{
  "AUTH_1001": { // Invalid Credentials
    "message": "Tên đăng nhập hoặc mật khẩu không chính xác",
    "action": "focus_login_form"
  },
  "AUTH_1002": { // Authentication Required
    "message": "Vui lòng đăng nhập để tiếp tục",
    "action": "redirect_to_login"
  },
  "AUTH_1003": { // Invalid Token
    "message": "Token không hợp lệ hoặc đã hết hạn",
    "action": "clear_token_and_redirect"
  },
  "AUTH_1004": { // Token Expired
    "message": "Phiên đăng nhập đã hết hạn",
    "action": "refresh_token_or_login"
  },
  "AUTH_1005": { // Permission Denied
    "message": "Bạn không có quyền truy cập chức năng này",
    "action": "show_permission_error"
  }
}
```

### 👤 User Management Errors (USER_xxxx)

```javascript
{
  "USER_2001": { // User Already Exists
    "message": "Người dùng đã tồn tại trong hệ thống",
    "action": "suggest_different_username"
  },
  "USER_2002": { // User Not Found
    "message": "Không tìm thấy người dùng",
    "action": "show_user_not_found"
  },
  "USER_2003": { // Email Existed
    "message": "Email đã được sử dụng bởi tài khoản khác",
    "action": "focus_email_field"
  },
  "USER_2004": { // Username Existed
    "message": "Tên đăng nhập đã được sử dụng",
    "action": "suggest_username_alternatives"
  }
}
```

### ✅ Validation Errors (VALID_xxxx)

```javascript
{
  "VALID_3001": { // Username Required
    "message": "Tên đăng nhập không được để trống",
    "action": "focus_username_field"
  },
  "VALID_3002": { // Username Min Length
    "message": "Tên đăng nhập phải có ít nhất {min} ký tự",
    "action": "highlight_username_requirements"
  },
  "VALID_3004": { // Password Min Length
    "message": "Mật khẩu phải có ít nhất {min} ký tự",
    "action": "show_password_strength_meter"
  },
  "VALID_3006": { // Invalid Email
    "message": "Định dạng email không hợp lệ",
    "action": "show_email_format_hint"
  },
  "VALID_3010": { // Password Mismatch
    "message": "Mật khẩu và xác nhận mật khẩu không khớp",
    "action": "highlight_confirm_password"
  }
}
```

## 🛠️ Hướng Dẫn Implementation

### 1. Error Response Structure

```javascript
{
  "code": "AUTH_1001",
  "message": "Tên đăng nhập hoặc mật khẩu không chính xác",
  "status": 401,
  "errors": { // Optional - cho validation errors
    "username": "Tên đăng nhập không được để trống",
    "password": "Mật khẩu phải có ít nhất 8 ký tự"
  }
}
```

### 2. Frontend Handler Example

```javascript
// Error Handler Utility
const handleApiError = (error) => {
  const { code, message, errors } = error.response.data;

  switch (code.split("_")[0]) {
    case "AUTH":
      handleAuthError(code, message);
      break;
    case "VALID":
      handleValidationError(code, message, errors);
      break;
    case "USER":
      handleUserError(code, message);
      break;
    case "SYS":
      handleSystemError(code, message);
      break;
    default:
      showGenericError(message);
  }
};

// Authentication Error Handler
const handleAuthError = (code, message) => {
  switch (code) {
    case "AUTH_1001":
      toast.error(message);
      focusLoginForm();
      break;
    case "AUTH_1002":
    case "AUTH_1003":
    case "AUTH_1004":
      clearTokens();
      redirectToLogin();
      break;
    case "AUTH_1005":
      showPermissionModal(message);
      break;
  }
};

// Validation Error Handler
const handleValidationError = (code, message, fieldErrors) => {
  if (fieldErrors) {
    Object.entries(fieldErrors).forEach(([field, error]) => {
      showFieldError(field, error);
    });
  } else {
    showFormError(message);
  }

  // Focus specific field based on error code
  const focusMap = {
    VALID_3001: "username",
    VALID_3002: "username",
    VALID_3004: "password",
    VALID_3006: "email",
    VALID_3010: "confirmPassword",
  };

  if (focusMap[code]) {
    focusField(focusMap[code]);
  }
};
```

### 3. React Hook Example

```javascript
// useErrorHandler.js
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = useCallback(
    (error) => {
      const { code, message } = error.response?.data || {};

      if (code?.startsWith("AUTH_")) {
        if (["AUTH_1002", "AUTH_1003", "AUTH_1004"].includes(code)) {
          localStorage.removeItem("token");
          navigate("/login");
          toast.warn(message);
        } else if (code === "AUTH_1005") {
          toast.error(message);
        }
      } else {
        toast.error(message || "Có lỗi xảy ra");
      }
    },
    [navigate]
  );

  return { handleError };
};
```

## 🎨 UI/UX Recommendations

### 1. Toast Notifications

- **Success**: Green toast với icon ✅
- **Warning**: Yellow toast với icon ⚠️
- **Error**: Red toast với icon ❌
- **Info**: Blue toast với icon ℹ️

### 2. Form Validation

- Hiển thị error ngay dưới field bị lỗi
- Highlight field với border màu đỏ
- Scroll và focus vào field đầu tiên bị lỗi

### 3. Authentication Flows

- Redirect mượt mà đến login page
- Hiển thị loading state khi refresh token
- Clear form data khi logout

### 4. Permission Errors

- Modal hoặc page riêng cho lỗi phân quyền
- Button "Liên hệ admin" hoặc "Quay lại"

## 📱 Example Usage

```javascript
// API Call với Error Handling
const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    if (response.data.code === "SYS_0000") {
      toast.success(response.data.message);
      return response.data.result;
    }
  } catch (error) {
    handleApiError(error);
  }
};

// Form Validation với Real-time Error Display
const UserRegistrationForm = () => {
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    // Client-side validation...
    if (field === "email" && !isValidEmail(value)) {
      setErrors((prev) => ({
        ...prev,
        email: "Định dạng email không hợp lệ",
      }));
    }
  };

  return (
    <form>
      <input
        type="email"
        onChange={(e) => validateField("email", e.target.value)}
        className={errors.email ? "border-red-500" : ""}
      />
      {errors.email && (
        <span className="text-red-500 text-sm">{errors.email}</span>
      )}
    </form>
  );
};
```

## 🔍 Debugging Tips

1. **Logging**: Log tất cả error codes để phân tích
2. **Error Boundary**: Catch unexpected errors
3. **Network Retry**: Retry cho các lỗi network
4. **Offline Handling**: Xử lý trạng thái offline

---

**Lưu ý**: Tất cả error messages đã được dịch tiếng Việt và sẵn sàng hiển thị cho user cuối. Frontend team chỉ cần kiểm tra error code để thực hiện action tương ứng.
