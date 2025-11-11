# Hướng Dẫn Tích Hợp VNPay Payment cho Frontend

## Tổng Quan Luồng Thanh Toán

```
User -> Frontend -> Backend (Create Payment) -> VNPay -> User Pay -> VNPay Callback -> Backend -> Frontend
```

## Chi Tiết Các Bước

### 1. Tạo Order (Đơn Hàng)

Trước khi thanh toán, frontend cần tạo order với các course items:

**Endpoint:** `POST /api/v1/course-management/orders`

**Request Body:**

```json
{
  "userId": "user123",
  "orderItems": [
    {
      "courseId": 1,
      "finishedFee": 500000
    }
  ]
}
```

**Response:**

```json
{
  "code": "SUCCESS",
  "status": 200,
  "message": "Order created successfully",
  "result": {
    "id": 1,
    "userId": "user123",
    "orderStatus": "PENDING",
    "orderDate": "2025-11-11",
    "orderItems": [...]
  }
}
```

---

### 2. Tạo Payment URL

Sau khi có orderId, gọi API để tạo payment URL:

**Endpoint:** `POST /api/v1/course-management/payments/create`

**Request Body:**

```json
{
  "orderId": 1,
  "language": "vn",
  "bankCode": "NCB"
}
```

**Tham số:**

- `orderId` (required): ID của order vừa tạo
- `language` (optional): "vn" hoặc "en" - ngôn ngữ hiển thị trên VNPay
- `bankCode` (optional): Mã ngân hàng (nếu muốn chọn sẵn ngân hàng)
  - Bỏ trống = hiển thị tất cả phương thức thanh toán
  - "NCB" = Ngân hàng NCB
  - "VNPAYQR" = Thanh toán qua QR
  - [Xem thêm mã ngân hàng](https://sandbox.vnpayment.vn/apis/docs/bang-ma-ngan-hang/)

**Response:**

```json
{
  "code": "SUCCESS",
  "status": 200,
  "message": "Payment URL created successfully",
  "result": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "orderId": "1",
    "txnRef": "ORDER1_1699999999999",
    "amount": 50000000
  }
}
```

---

### 3. Redirect User đến VNPay

**Code Frontend (React/Vue/Angular):**

```javascript
// React Example
const handlePayment = async (orderId) => {
  try {
    // Gọi API tạo payment
    const response = await fetch(
      "http://localhost:8088/course-management/payments/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          language: "vn",
          bankCode: "", // Để trống để hiển thị tất cả
        }),
      }
    );

    const data = await response.json();

    if (data.code === "SUCCESS") {
      // Redirect user đến VNPay
      window.location.href = data.result.paymentUrl;
    } else {
      alert("Lỗi tạo thanh toán: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Có lỗi xảy ra");
  }
};
```

**HTML Button:**

```html
<button onClick={() => handlePayment(orderId)}>
  Thanh Toán VNPay
</button>
```

---

### 4. Xử Lý Callback từ VNPay

Sau khi user thanh toán xong trên VNPay, VNPay sẽ redirect về backend:

**Backend Callback URL:** `http://localhost:8088/course-management/payments/vnpay-callback`

Backend sẽ xử lý và lưu kết quả vào database.

**Có 2 cách để Frontend biết kết quả:**

#### Cách 1: Polling (Kiểm tra định kỳ)

Sau khi redirect đến VNPay, frontend có thể polling để check payment status:

```javascript
// Sau khi redirect, user quay lại trang
const checkPaymentStatus = async (orderId) => {
  const response = await fetch(
    `http://localhost:8088/course-management/payments/order/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (data.code === "SUCCESS") {
    const payment = data.result;

    if (payment.status === "SUCCESS") {
      // Thanh toán thành công
      showSuccessMessage();
      redirectToCoursePage();
    } else if (payment.status === "FAILED") {
      // Thanh toán thất bại
      showErrorMessage(payment.transactionId);
    } else if (payment.status === "PENDING") {
      // Đang chờ xử lý, tiếp tục polling
      setTimeout(() => checkPaymentStatus(orderId), 2000);
    }
  }
};

// Gọi khi component mount (nếu có orderId trong URL)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  if (orderId) {
    checkPaymentStatus(orderId);
  }
}, []);
```

#### Cách 2: Backend Redirect về Frontend (Khuyến nghị)

**Cần cập nhật Backend để redirect về frontend sau khi xử lý:**

Thêm vào `PaymentController.java`:

```java
@GetMapping("/vnpay-callback")
public void handleVNPayCallback(
        @RequestParam Map<String, String> params,
        HttpServletResponse response) throws IOException {
    try {
        VNPayCallbackResponse result = paymentService.handleVNPayCallback(params);

        // Redirect về frontend với kết quả
        String frontendUrl = "http://localhost:3000/payment-result";
        String redirectUrl = String.format(
            "%s?status=%s&orderId=%s&message=%s&txnRef=%s",
            frontendUrl,
            result.getStatus(),
            extractOrderId(result.getTxnRef()),
            URLEncoder.encode(result.getMessage(), StandardCharsets.UTF_8),
            result.getTxnRef()
        );

        response.sendRedirect(redirectUrl);
    } catch (Exception e) {
        log.error("Error processing VNPay callback", e);
        response.sendRedirect("http://localhost:3000/payment-error");
    }
}
```

**Frontend Payment Result Page:**

```javascript
// PaymentResultPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const message = searchParams.get("message");
    const txnRef = searchParams.get("txnRef");

    setLoading(false);

    if (status === "SUCCESS") {
      // Hiển thị thành công
      setTimeout(() => {
        navigate(`/my-courses`); // Redirect đến trang khóa học của user
      }, 3000);
    }
  }, [searchParams, navigate]);

  const status = searchParams.get("status");
  const message = searchParams.get("message");

  if (loading) return <div>Đang xử lý...</div>;

  return (
    <div className="payment-result">
      {status === "SUCCESS" ? (
        <div className="success">
          <h1>✅ Thanh Toán Thành Công!</h1>
          <p>{message}</p>
          <p>Đang chuyển hướng đến khóa học của bạn...</p>
        </div>
      ) : (
        <div className="error">
          <h1>❌ Thanh Toán Thất Bại</h1>
          <p>{message}</p>
          <button onClick={() => navigate("/cart")}>Quay lại giỏ hàng</button>
        </div>
      )}
    </div>
  );
};

export default PaymentResultPage;
```

---

## Cấu Hình Quan Trọng

### 1. Update Backend .env

```bash
# VNPay sẽ redirect về backend sau khi thanh toán
VNPAY_SUCCESS_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
VNPAY_CANCEL_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
```

### 2. Cấu Hình CORS cho Backend

Thêm vào `application.properties` hoặc tạo CORS config:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

---

## Test với Localhost

**Vấn đề:** VNPay không thể redirect về `localhost` của bạn.

**Giải pháp:**

### Option 1: Sử dụng Ngrok (Khuyến nghị cho dev)

```bash
# Install ngrok
# Download từ https://ngrok.com/download

# Chạy ngrok cho backend
ngrok http 8088
```

Sau đó cập nhật `.env`:

```bash
VNPAY_SUCCESS_RETURN_URL=https://abc123.ngrok.io/course-management/payments/vnpay-callback
```

### Option 2: Deploy Backend lên Server

Deploy backend lên Heroku, Railway, hoặc VPS và cập nhật URL tương ứng.

---

## API Endpoints Summary

| Method | Endpoint                         | Mô tả                                |
| ------ | -------------------------------- | ------------------------------------ |
| POST   | `/payments/create`               | Tạo payment URL                      |
| GET    | `/payments/vnpay-callback`       | VNPay callback (tự động)             |
| GET    | `/payments/order/{orderId}`      | Kiểm tra payment status theo orderId |
| GET    | `/payments/transaction/{txnRef}` | Kiểm tra payment status theo txnRef  |

---

## Payment Status Flow

```
PENDING -> (User thanh toán) -> SUCCESS/FAILED
```

- **PENDING**: Payment vừa được tạo, đang chờ user thanh toán
- **SUCCESS**: Thanh toán thành công
- **FAILED**: Thanh toán thất bại

---

## Mã Ngân Hàng Phổ Biến

| Mã          | Ngân hàng                                |
| ----------- | ---------------------------------------- |
| VNPAYQR     | QR Pay qua VNPay                         |
| VNBANK      | Thanh toán qua thẻ ATM/Tài khoản nội địa |
| INTCARD     | Thanh toán qua thẻ quốc tế               |
| NCB         | Ngân hàng NCB                            |
| VIETCOMBANK | Vietcombank                              |
| TECHCOMBANK | Techcombank                              |
| MBBANK      | MB Bank                                  |

[Xem đầy đủ tại đây](https://sandbox.vnpayment.vn/apis/docs/bang-ma-ngan-hang/)

---

## Example: Complete Payment Flow

```javascript
// 1. Component hiển thị danh sách courses
const CoursePage = () => {
  const [selectedCourses, setSelectedCourses] = useState([]);

  const handleCheckout = async () => {
    try {
      // Step 1: Tạo order
      const orderResponse = await createOrder(selectedCourses);
      const orderId = orderResponse.result.id;

      // Step 2: Tạo payment
      const paymentResponse = await createPayment(orderId);

      // Step 3: Redirect đến VNPay
      window.location.href = paymentResponse.result.paymentUrl;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      <button onClick={handleCheckout}>Thanh Toán VNPay</button>
    </div>
  );
};

// 2. Trang kết quả thanh toán
const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  return (
    <div>
      {status === "SUCCESS" ? (
        <SuccessMessage message={message} />
      ) : (
        <ErrorMessage message={message} />
      )}
    </div>
  );
};
```

---

## Lưu Ý Quan Trọng

1. **Return URL phải đúng**: VNPay sẽ redirect về URL được cấu hình trong backend
2. **Không dùng localhost trong production**: Phải dùng domain công khai
3. **Bảo mật**: Không để lộ `VNPAY_HASH_SECRET` ra frontend
4. **Timeout**: Payment có thời gian hết hạn 15 phút
5. **Kiểm tra status**: Luôn kiểm tra payment status từ database, không tin tưởng 100% params từ URL

---

## Troubleshooting

### Lỗi code=99 từ VNPay

- **Nguyên nhân**: Return URL không accessible
- **Giải pháp**: Sử dụng ngrok hoặc deploy lên server công khai

### Payment status không update

- **Nguyên nhân**: Callback không được gọi
- **Giải pháp**: Kiểm tra logs backend, đảm bảo return URL đúng

### CORS error

- **Nguyên nhân**: Frontend gọi API bị CORS block
- **Giải pháp**: Cấu hình CORS trong backend

---

## Support

Nếu cần hỗ trợ thêm, tham khảo:

- [VNPay Sandbox Documentation](https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/)
- [VNPay Response Codes](https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/)
