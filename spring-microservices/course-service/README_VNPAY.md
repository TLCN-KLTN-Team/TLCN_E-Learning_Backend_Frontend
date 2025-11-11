# VNPay Payment Integration - Quick Start Guide

## 📋 Tổng Quan

Hệ thống thanh toán VNPay đã được tích hợp hoàn chỉnh với luồng:

1. **Frontend** → Tạo Order
2. **Frontend** → Request Payment URL
3. **Backend** → Tạo VNPay payment URL và lưu Payment (status=PENDING)
4. **Frontend** → Redirect user đến VNPay
5. **User** → Thanh toán trên VNPay
6. **VNPay** → Callback về Backend
7. **Backend** → Verify signature, update Payment status, update Order status
8. **Backend** → Redirect về Frontend với kết quả
9. **Frontend** → Hiển thị kết quả

---

## 🚀 Quick Start

### 1. Cấu Hình Backend

#### Step 1: Kiểm tra Environment Variables

File: `course-service/.env`

```bash
VNPAY_TMN_CODE=RT7TU5RL
VNPAY_HASH_SECRET=3GBUT8B5Y8VTFB2M0JX50G54TUQC52IT
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# ⚠️ QUAN TRỌNG: URL này phải trỏ về backend endpoint
VNPAY_SUCCESS_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
VNPAY_CANCEL_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
```

#### Step 2: Khởi động service

```bash
cd course-service
mvn spring-boot:run
```

Service sẽ chạy tại: `http://localhost:8088/course-management`

---

### 2. Test với Postman

#### Test 1: Create Payment

```bash
POST http://localhost:8088/course-management/payments/create
Content-Type: application/json

{
  "orderId": 1,
  "language": "vn",
  "bankCode": ""
}
```

**Response:**

```json
{
  "code": "SUCCESS",
  "message": "Payment URL created successfully",
  "result": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": "1",
    "txnRef": "ORDER1_1699999999999",
    "amount": 50000000
  }
}
```

#### Test 2: Copy `paymentUrl` và mở trong browser

Browser sẽ redirect đến trang thanh toán VNPay.

#### Test 3: Thanh toán với test card

**Thẻ NCB:**

- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mật khẩu OTP: `123456`

#### Test 4: Kiểm tra kết quả

```bash
GET http://localhost:8088/course-management/payments/order/1
```

**Response:**

```json
{
  "code": "SUCCESS",
  "result": {
    "id": 1,
    "status": "SUCCESS",
    "amount": 500000.0,
    "transactionId": "ORDER1_1699999999999",
    "processedAt": "2025-11-11T12:00:00"
  }
}
```

---

## 📱 Tích Hợp Frontend

### React Example

```javascript
// 1. Tạo payment và redirect
const handlePayment = async (orderId) => {
  const response = await fetch(
    "http://localhost:8088/course-management/payments/create",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, language: "vn" }),
    }
  );

  const data = await response.json();
  if (data.code === "SUCCESS") {
    window.location.href = data.result.paymentUrl;
  }
};

// 2. Trang kết quả thanh toán
const PaymentResult = () => {
  const [params] = useSearchParams();
  const status = params.get("status");

  return (
    <div>
      {status === "SUCCESS" ? (
        <h1>✅ Thanh toán thành công!</h1>
      ) : (
        <h1>❌ Thanh toán thất bại</h1>
      )}
    </div>
  );
};
```

Chi tiết đầy đủ: [VNPAY_FRONTEND_GUIDE.md](./VNPAY_FRONTEND_GUIDE.md)

---

## 🔧 Cấu Trúc Code

### Files Đã Tạo/Cập Nhật

```
course-service/
├── src/main/java/com/hoangphihiep/
│   ├── controller/user/
│   │   └── PaymentController.java          ✅ Cập nhật
│   ├── service/
│   │   └── PaymentService.java             ✅ Cập nhật hoàn toàn
│   ├── repository/
│   │   └── PaymentRepository.java          ✅ Thêm method findByTransactionId
│   ├── config/
│   │   └── VNPayConfig.java                ✅ Sửa tên biến
│   ├── dto/request/
│   │   └── CreatePaymentRequest.java       ✅ Mới
│   └── dto/response/
│       ├── PaymentResponse.java            ✅ Mới
│       └── VNPayCallbackResponse.java      ✅ Mới
├── .env                                     ✅ Cập nhật return URL
├── VNPAY_FRONTEND_GUIDE.md                 ✅ Mới - Hướng dẫn Frontend
├── VNPAY_BACKEND_DOCUMENTATION.md          ✅ Mới - Tài liệu Backend
└── README_VNPAY.md                         ✅ File này
```

---

## 📊 Database Schema

### Payment Table

```sql
CREATE TABLE payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_type VARCHAR(1000) NOT NULL,
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    amount DOUBLE NOT NULL,
    currency VARCHAR(10),
    status VARCHAR(50),
    created_at DATETIME,
    processed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Payment Status Flow

```
PENDING → SUCCESS (khi thanh toán thành công)
PENDING → FAILED  (khi thanh toán thất bại)
```

---

## 🛠️ API Endpoints

| Method | Endpoint                         | Mô tả                   |
| ------ | -------------------------------- | ----------------------- |
| POST   | `/payments/create`               | Tạo payment URL         |
| GET    | `/payments/vnpay-callback`       | VNPay callback endpoint |
| GET    | `/payments/order/{orderId}`      | Lấy payment theo order  |
| GET    | `/payments/transaction/{txnRef}` | Lấy payment theo txnRef |

Chi tiết: [VNPAY_BACKEND_DOCUMENTATION.md](./VNPAY_BACKEND_DOCUMENTATION.md)

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Return URL cho Development

**Vấn đề:** VNPay không thể redirect về `localhost`

**Giải pháp:** Sử dụng ngrok

```bash
# Download ngrok: https://ngrok.com/download

# Chạy ngrok
ngrok http 8088

# Cập nhật .env
VNPAY_SUCCESS_RETURN_URL=https://abc123.ngrok.io/course-management/payments/vnpay-callback
```

### 2. Return URL cho Production

Deploy backend lên server công khai và cập nhật:

```bash
VNPAY_SUCCESS_RETURN_URL=https://your-domain.com/course-management/payments/vnpay-callback
```

### 3. Đăng ký Return URL trên VNPay

- Login vào VNPay Merchant Portal
- Cấu hình Return URL phải khớp với URL trong code
- VNPay sẽ chỉ redirect về URL đã được đăng ký

---

## 🧪 Testing Checklist

- [ ] ✅ Tạo order thành công
- [ ] ✅ Tạo payment URL thành công
- [ ] ✅ Redirect đến VNPay thành công
- [ ] ✅ Thanh toán với test card thành công
- [ ] ✅ VNPay callback về backend thành công
- [ ] ✅ Payment status update thành công
- [ ] ✅ Order status update thành công
- [ ] ✅ Frontend nhận được kết quả đúng

---

## 🐛 Troubleshooting

### Lỗi: "Order not found"

- **Nguyên nhân:** OrderId không tồn tại
- **Giải pháp:** Tạo order trước khi tạo payment

### Lỗi: VNPay Error code=99

- **Nguyên nhân:** Return URL không accessible
- **Giải pháp:** Sử dụng ngrok hoặc domain công khai

### Lỗi: "Invalid signature"

- **Nguyên nhân:** Hash secret không đúng
- **Giải pháp:** Kiểm tra `VNPAY_HASH_SECRET` trong .env

### Lỗi: Payment status không update

- **Nguyên nhân:** Callback không được gọi
- **Giải pháp:** Check logs backend, đảm bảo return URL đúng

---

## 📚 Documentation

- **Frontend Guide:** [VNPAY_FRONTEND_GUIDE.md](./VNPAY_FRONTEND_GUIDE.md)
- **Backend Documentation:** [VNPAY_BACKEND_DOCUMENTATION.md](./VNPAY_BACKEND_DOCUMENTATION.md)
- **VNPay Official Docs:** https://sandbox.vnpayment.vn/apis/docs/

---

## 🎯 Next Steps

1. **Frontend Integration:** Đọc [VNPAY_FRONTEND_GUIDE.md](./VNPAY_FRONTEND_GUIDE.md)
2. **Setup Ngrok:** Để test callback locally
3. **Test End-to-End:** Từ tạo order → thanh toán → kiểm tra kết quả
4. **Deploy:** Deploy backend lên server và cập nhật return URL

---

## 💡 Tips

- Luôn kiểm tra logs khi có lỗi
- Test với VNPay sandbox trước khi production
- Backup database trước khi deploy
- Monitor payment success rate
- Setup alert cho failed payments

---

## 📞 Support

Nếu cần hỗ trợ:

1. Check logs: `logs/application.log`
2. Review documentation files
3. Check VNPay sandbox documentation
4. Contact VNPay support

---

**Happy Coding! 🚀**
