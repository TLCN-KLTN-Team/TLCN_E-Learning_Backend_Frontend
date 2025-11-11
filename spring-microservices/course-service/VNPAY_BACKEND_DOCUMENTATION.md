# VNPay Payment Integration - Backend Documentation

## Tổng Quan Kiến Trúc

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────┐
│  Frontend   │─────>│PaymentController│─────>│PaymentService│─────>│ VNPay   │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────┘
                            │                      │
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │   Database   │      │VNPayConfig  │
                     └──────────────┘      └─────────────┘
```

## Luồng Xử Lý

### 1. Tạo Payment Request

```
Client Request ──> PaymentController.createPayment()
                         │
                         ▼
                  PaymentService.createPayment()
                         │
                         ├─> Kiểm tra Order exists
                         ├─> Kiểm tra Order chưa paid
                         ├─> Tính tổng tiền
                         ├─> Tạo VNPay params
                         ├─> Tính HMAC-SHA512 signature
                         ├─> Lưu Payment với status=PENDING
                         └─> Trả về Payment URL
```

### 2. Xử Lý VNPay Callback

```
VNPay Redirect ──> PaymentController.handleVNPayCallback()
                         │
                         ▼
                  PaymentService.handleVNPayCallback()
                         │
                         ├─> Verify HMAC signature
                         ├─> Tìm Payment record
                         ├─> Check payment đã xử lý chưa
                         ├─> Update Payment status
                         ├─> Update Order status
                         └─> Trả về kết quả
```

## Cấu Trúc Database

### Table: `payment`

| Column          | Type          | Description                  |
| --------------- | ------------- | ---------------------------- |
| id              | INTEGER       | Primary key                  |
| order_id        | INTEGER       | Foreign key đến orders table |
| payment_type    | VARCHAR(1000) | Loại thanh toán (ONLINE)     |
| payment_method  | VARCHAR(50)   | Phương thức (VNPAY)          |
| payment_gateway | VARCHAR(50)   | Cổng thanh toán (VNPAY)      |
| transaction_id  | VARCHAR(255)  | VNPay transaction reference  |
| amount          | DOUBLE        | Số tiền thanh toán           |
| currency        | VARCHAR(10)   | Đơn vị tiền tệ (VND)         |
| status          | VARCHAR(50)   | PENDING, SUCCESS, FAILED     |
| created_at      | DATETIME      | Thời gian tạo                |
| processed_at    | DATETIME      | Thời gian xử lý              |

### Table: `orders`

| Column       | Type         | Description              |
| ------------ | ------------ | ------------------------ |
| id           | INTEGER      | Primary key              |
| user_id      | VARCHAR(255) | ID của user              |
| order_date   | DATE         | Ngày đặt hàng            |
| order_status | VARCHAR(50)  | PENDING, PAID, CANCELLED |

## API Endpoints

### 1. Create Payment

**Endpoint:** `POST /api/v1/course-management/payments/create`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "orderId": 1,
  "language": "vn",
  "bankCode": "NCB"
}
```

**Response (Success):**

```json
{
  "code": "SUCCESS",
  "status": 200,
  "message": "Payment URL created successfully",
  "result": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&...",
    "orderId": "1",
    "txnRef": "ORDER1_1699999999999",
    "amount": 50000000
  }
}
```

**Response (Error):**

```json
{
  "code": "PAYMENT_ERROR",
  "status": 400,
  "message": "Order not found with id: 1"
}
```

---

### 2. VNPay Callback (Internal)

**Endpoint:** `GET /api/v1/course-management/payments/vnpay-callback`

**Query Parameters:** (Tự động từ VNPay)

```
vnp_Amount=50000000
vnp_BankCode=NCB
vnp_BankTranNo=VNP123456
vnp_CardType=ATM
vnp_OrderInfo=Payment for Order #1
vnp_PayDate=20251111120000
vnp_ResponseCode=00
vnp_TmnCode=RT7TU5RL
vnp_TransactionNo=14123456
vnp_TransactionStatus=00
vnp_TxnRef=ORDER1_1699999999999
vnp_SecureHash=abc123...
```

**Response:**

```json
{
  "code": "SUCCESS",
  "status": 200,
  "message": "Payment processed successfully",
  "result": {
    "status": "SUCCESS",
    "message": "Giao dịch thành công",
    "transactionId": "14123456",
    "txnRef": "ORDER1_1699999999999",
    "amount": 50000000,
    "bankCode": "NCB",
    "orderInfo": "Payment for Order #1",
    "paymentTime": "2025-11-11T12:00:00",
    "responseCode": "00"
  }
}
```

---

### 3. Get Payment by Order ID

**Endpoint:** `GET /api/v1/course-management/payments/order/{orderId}`

**Response:**

```json
{
  "code": "SUCCESS",
  "status": 200,
  "message": "Payment retrieved successfully",
  "result": {
    "id": 1,
    "order": {
      "id": 1,
      "orderStatus": "PAID"
    },
    "paymentType": "ONLINE",
    "paymentMethod": "VNPAY",
    "paymentGateway": "VNPAY",
    "transactionId": "ORDER1_1699999999999",
    "amount": 500000.0,
    "currency": "VND",
    "status": "SUCCESS",
    "createdAt": "2025-11-11T11:45:00",
    "processedAt": "2025-11-11T12:00:00"
  }
}
```

---

### 4. Get Payment by Transaction ID

**Endpoint:** `GET /api/v1/course-management/payments/transaction/{txnRef}`

**Response:** (Same as above)

---

## Configuration Files

### 1. application.properties

```properties
# VNPay Configuration
vnpay.tmnCode=${VNPAY_TMN_CODE}
vnpay.hashSecret=${VNPAY_HASH_SECRET}
vnpay.payUrl=${VNPAY_PAY_URL}
vnpay.successReturnUrl=${VNPAY_SUCCESS_RETURN_URL}
vnpay.cancelReturnUrl=${VNPAY_CANCEL_RETURN_URL}
vnpay.apiUrl=${VNPAY_API_URL}
```

### 2. .env

```bash
# VNPay Sandbox Credentials
VNPAY_TMN_CODE=RT7TU5RL
VNPAY_HASH_SECRET=3GBUT8B5Y8VTFB2M0JX50G54TUQC52IT
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# Return URL - VNPay sẽ redirect về đây sau khi thanh toán
VNPAY_SUCCESS_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
VNPAY_CANCEL_RETURN_URL=http://localhost:8088/course-management/payments/vnpay-callback
```

---

## VNPay Parameters

### Request Parameters (Gửi đến VNPay)

| Parameter      | Required | Description        | Example                |
| -------------- | -------- | ------------------ | ---------------------- |
| vnp_Version    | Yes      | Version API        | 2.1.0                  |
| vnp_Command    | Yes      | Mã API             | pay                    |
| vnp_TmnCode    | Yes      | Mã website         | RT7TU5RL               |
| vnp_Amount     | Yes      | Số tiền (x100)     | 50000000 (500,000 VND) |
| vnp_CurrCode   | Yes      | Đơn vị tiền tệ     | VND                    |
| vnp_TxnRef     | Yes      | Mã đơn hàng        | ORDER1_1699999999999   |
| vnp_OrderInfo  | Yes      | Thông tin đơn hàng | Payment for Order #1   |
| vnp_OrderType  | Yes      | Loại đơn hàng      | other                  |
| vnp_Locale     | Yes      | Ngôn ngữ           | vn hoặc en             |
| vnp_ReturnUrl  | Yes      | URL callback       | http://...             |
| vnp_IpAddr     | Yes      | IP khách hàng      | 192.168.1.1            |
| vnp_CreateDate | Yes      | Thời gian tạo      | yyyyMMddHHmmss         |
| vnp_ExpireDate | Yes      | Thời gian hết hạn  | yyyyMMddHHmmss         |
| vnp_BankCode   | No       | Mã ngân hàng       | NCB, VNBANK, ...       |
| vnp_SecureHash | Yes      | Chữ ký số          | HMAC-SHA512            |

### Response Parameters (Từ VNPay callback)

| Parameter             | Description             |
| --------------------- | ----------------------- |
| vnp_Amount            | Số tiền đã thanh toán   |
| vnp_BankCode          | Mã ngân hàng            |
| vnp_BankTranNo        | Mã GD tại Ngân hàng     |
| vnp_CardType          | Loại thẻ (ATM/QRCODE)   |
| vnp_OrderInfo         | Thông tin đơn hàng      |
| vnp_PayDate           | Thời gian thanh toán    |
| vnp_ResponseCode      | Mã kết quả (00=success) |
| vnp_TmnCode           | Mã website              |
| vnp_TransactionNo     | Mã GD tại VNPay         |
| vnp_TransactionStatus | Trạng thái GD           |
| vnp_TxnRef            | Mã tham chiếu           |
| vnp_SecureHash        | Chữ ký số               |

---

## Response Codes

| Code | Meaning                                    |
| ---- | ------------------------------------------ |
| 00   | Giao dịch thành công                       |
| 07   | Trừ tiền thành công. Giao dịch bị nghi ngờ |
| 09   | Thẻ chưa đăng ký InternetBanking           |
| 10   | Xác thực không đúng quá 3 lần              |
| 11   | Đã hết hạn chờ thanh toán                  |
| 12   | Thẻ bị khóa                                |
| 13   | Nhập sai OTP                               |
| 24   | Khách hàng hủy giao dịch                   |
| 51   | Tài khoản không đủ số dư                   |
| 65   | Vượt quá hạn mức giao dịch                 |
| 75   | Ngân hàng đang bảo trì                     |
| 79   | Nhập sai mật khẩu quá số lần               |
| 99   | Lỗi khác                                   |

---

## Security - HMAC-SHA512 Signature

### Tạo Signature (Request)

```java
// 1. Sort parameters theo alphabet
Map<String, String> sortedParams = new TreeMap<>(params);

// 2. Build hash data string
StringBuilder hashData = new StringBuilder();
for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
    hashData.append(entry.getKey())
            .append('=')
            .append(entry.getValue())
            .append('&');
}
hashData.setLength(hashData.length() - 1); // Remove last '&'

// 3. Calculate HMAC-SHA512
Mac hmac = Mac.getInstance("HmacSHA512");
SecretKey secretKey = new SecretKeySpec(hashSecret.getBytes(), "HmacSHA512");
hmac.init(secretKey);
byte[] hash = hmac.doFinal(hashData.toString().getBytes(StandardCharsets.UTF_8));
String signature = HexFormat.of().formatHex(hash);
```

### Verify Signature (Callback)

```java
// 1. Extract vnp_SecureHash from params
String receivedHash = params.get("vnp_SecureHash");
params.remove("vnp_SecureHash");
params.remove("vnp_SecureHashType");

// 2. Calculate hash từ remaining params
String calculatedHash = hmacSHA512(hashSecret, sortedParams);

// 3. Compare
if (!calculatedHash.equals(receivedHash)) {
    throw new SecurityException("Invalid signature");
}
```

---

## Error Handling

### Custom Exceptions

```java
// PaymentException.java
public class PaymentException extends RuntimeException {
    private final String errorCode;

    public PaymentException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
```

### Global Exception Handler

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ApiResponse<?>> handlePaymentException(PaymentException e) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.builder()
                .code(e.getErrorCode())
                .message(e.getMessage())
                .build());
    }
}
```

---

## Testing

### 1. Test Card Numbers (VNPay Sandbox)

| Bank Code | Card Number         | Expiry | CVV |
| --------- | ------------------- | ------ | --- |
| NCB       | 9704198526191432198 | 07/15  | 123 |
| BIDV      | 9704194700000000018 | 03/07  | -   |
| VCB       | 9704060000000000018 | 03/07  | -   |

### 2. Postman Collection

```json
{
  "name": "Create Payment",
  "request": {
    "method": "POST",
    "url": "http://localhost:8088/course-management/payments/create",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"orderId\": 1,\n  \"language\": \"vn\",\n  \"bankCode\": \"NCB\"\n}"
    }
  }
}
```

---

## Deployment Checklist

- [ ] Cấu hình environment variables (.env)
- [ ] Cập nhật Return URL với domain thật
- [ ] Đăng ký Return URL trên VNPay merchant portal
- [ ] Enable HTTPS cho production
- [ ] Setup logging và monitoring
- [ ] Test với VNPay sandbox trước
- [ ] Kiểm tra CORS configuration
- [ ] Backup database before going live

---

## Monitoring & Logging

### Important Logs

```java
// Success payment
log.info("Payment successful: orderId={}, txnRef={}, amount={}",
    orderId, txnRef, amount);

// Failed payment
log.warn("Payment failed: orderId={}, txnRef={}, responseCode={}",
    orderId, txnRef, responseCode);

// Invalid signature
log.error("Invalid signature: expected={}, received={}",
    calculatedHash, receivedHash);
```

### Metrics to Monitor

- Payment success rate
- Average payment processing time
- Failed payment count by error code
- Callback response time

---

## Resources

- [VNPay Sandbox](https://sandbox.vnpayment.vn/)
- [VNPay Documentation](https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/)
- [Bank Codes](https://sandbox.vnpayment.vn/apis/docs/bang-ma-ngan-hang/)
- [Response Codes](https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/)

---

## Support

For issues or questions:

- Check logs in `logs/application.log`
- Review VNPay documentation
- Contact VNPay support for merchant-specific issues
