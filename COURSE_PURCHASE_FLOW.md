# Luồng Mua Khóa Học - Chi Tiết End-to-End

## 📋 Tổng quan

Hệ thống hỗ trợ 2 phương thức thanh toán:
- **VNPay** (Cổng thanh toán Việt Nam)
- **PayPal** (Thanh toán quốc tế)

## 🎯 Flow Diagram

```
User → Course Detail Page → Payment Page → Payment Gateway → Return Page → My Courses
   ↓          ↓                  ↓              ↓                ↓            ↓
Browse   Click "Mua Ngay"   Choose Method   Process Pay    Handle Result  View Purchased
```

---

## 📱 FRONTEND (React TypeScript)

### 1️⃣ **Bước 1: User Browse Course**

**File:** `src/pages/user/course/CourseDetail.tsx`

```typescript
// User xem chi tiết khóa học
const CourseDetail = () => {
  const [course, setCourse] = useState<CourseResponse>();
  
  // Check xem user đã mua chưa
  if (course.purchaserStatus) {
    // Đã mua → Show content
    return <CourseContent />;
  } else {
    // Chưa mua → Show buy button
    return <BuyButton onClick={handleEnrollNow} />;
  }
};
```

**Button Click Event:**
```typescript
const handleEnrollNow = () => {
  // Navigate to payment page with course info
  navigate(`/payment/checkout/express/course/${courseId}`, {
    state: { courseIds: [courseId] }
  });
};
```

---

### 2️⃣ **Bước 2: Payment Page**

**File:** `src/pages/user/payment/Payment.tsx`

#### 2.1 Load Order Preview
```typescript
useEffect(() => {
  const loadCheckoutData = async () => {
    // Get courseIds from navigation state
    const courseIds = location.state?.courseIds;
    
    // Call preview API
    const preview = await PaymentService.getOrderPreview({ courseIds });
    
    // Display course info, price, discount
    setOrderPreview(preview);
    setCheckoutItems(preview.items);
  };
  
  loadCheckoutData();
}, []);
```

#### 2.2 User Select Payment Method
```tsx
<select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)}>
  <option value="vnpay">VNPay (Ngân hàng VN)</option>
  <option value="paypal">PayPal (Quốc tế)</option>
</select>
```

#### 2.3 Complete Payment Button
```typescript
const handleCompletePayment = async () => {
  // Validate
  if (!selectedCountry || !acceptedTerms) {
    alert("Vui lòng hoàn thành tất cả các trường");
    return;
  }

  // Calculate total
  const totalAmount = checkoutItems.reduce((sum, item) => sum + item.price, 0);

  // Create payment request
  const paymentData = {
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency: selectedCountry,
    paymentType: selectedPayment, // "vnpay" or "paypal"
    orderItems: checkoutItems.map(item => ({
      publishedCourseId: item.courseId,
      finishedFee: item.price
    }))
  };

  // Call create payment API
  const response = await PaymentService.createPayment(paymentData);

  // Redirect to payment gateway
  if (response.paymentUrl) {
    window.location.href = response.paymentUrl; // ⚠️ Full page redirect
  }
};
```

---

### 3️⃣ **Bước 3: API Service Layer**

**File:** `src/services/api/user/payment.api.ts`

```typescript
const PAYMENT_API_BASE_URL = '/course-management/user/payments';

// Preview order before payment
export const getOrderPreview = async (request: OrderPreviewRequest) => {
  const response = await axiosInstance.post(
    `${PAYMENT_API_BASE_URL}/preview`,
    request
  );
  return response.data.result;
};

// Create payment and get gateway URL
export const createPayment = async (paymentData: {
  amount: number;
  currency: string;
  paymentType: string;
  orderItems: OrderItem[];
}) => {
  const response = await axiosInstance.post(
    `${PAYMENT_API_BASE_URL}/create`,
    paymentData
  );
  return response.data; // { paymentUrl: "https://vnpay.vn/..." }
};

// Handle payment callback (VNPay return)
export const handleVNPayPaymentReturn = async (params: Record<string, string>) => {
  const response = await axiosInstance.get(
    `${PAYMENT_API_BASE_URL}/vnpay/return`,
    { params }
  );
  return response.data; // { success: true, message: "OK" }
};
```

---

## 🔧 BACKEND (Spring Boot Java)

### 4️⃣ **Bước 4: Payment Controller**

**File:** `course-service/controller/user/PaymentController.java`

```java
@RestController
@RequestMapping("/payments/user")
public class PaymentController {
    private final PaymentService paymentService;

    /**
     * POST /api/v1/course-management/user/payments/create
     * Body: { amount, currency, paymentType, orderItems }
     */
    @PostMapping("/create")
    public ResponseEntity<?> redirectPaymentGateway(
        @RequestBody PaymentRequest request,
        HttpServletRequest httpRequest
    ) {
        String paymentUrl = "";
        
        if ("vnpay".equalsIgnoreCase(request.getPaymentType())) {
            // Tạo VNPay URL
            paymentUrl = paymentService.createVNPayPaymentUrl(request, httpRequest);
        } else if ("paypal".equalsIgnoreCase(request.getPaymentType())) {
            // Tạo PayPal URL
            paymentUrl = paymentService.processPaypalPayment(request);
        }
        
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    /**
     * GET /api/v1/course-management/user/payments/vnpay/return
     * VNPay redirect về đây sau khi user thanh toán
     */
    @GetMapping("/vnpay/return")
    public ResponseEntity<?> paymentCallback(HttpServletRequest request) {
        var response = paymentService.handleVNPayCallback(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/course-management/user/payments/preview
     * Preview order trước khi thanh toán
     */
    @PostMapping("/preview")
    public ApiResponse<?> previewPayment(@RequestBody OrderPreviewRequest request) {
        var response = paymentService.getOrderPreview(request.getCourseIds());
        return ApiResponse.success(response, "Preview order successfully");
    }
}
```

---

### 5️⃣ **Bước 5: Payment Service**

**File:** `course-service/service/PaymentService.java`

#### 5.1 Create VNPay Payment URL
```java
public String createVNPayPaymentUrl(PaymentRequest request, HttpServletRequest httpRequest) {
    // 1. Generate unique order ID
    String orderId = UUID.randomUUID().toString();
    
    // 2. Prepare VNPay parameters
    Map<String, String> vnp_Params = new HashMap<>();
    vnp_Params.put("vnp_Version", "2.1.0");
    vnp_Params.put("vnp_Command", "pay");
    vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
    vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // VNPay yêu cầu nhân 100
    vnp_Params.put("vnp_CurrCode", "VND");
    vnp_Params.put("vnp_TxnRef", orderId); // ⭐ Order reference
    vnp_Params.put("vnp_OrderInfo", "Payment for courses");
    vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
    vnp_Params.put("vnp_IpAddr", vnPayUtils.getIpAddress(httpRequest));
    
    // 3. Create order with status PENDING
    CreationOrderRequest orderRequest = CreationOrderRequest.builder()
        .orderId(orderId)
        .createTime(new Date(System.currentTimeMillis()))
        .orderItems(request.getOrderItems())
        .build();
    orderService.createOrder(orderRequest); // ⚠️ Save to DB with PENDING status
    
    // 4. Generate secure hash
    String vnp_SecureHash = vnPayUtils.hmacSHA512(
        vnPayConfig.getVnp_HashSecret(), 
        hashData.toString()
    );
    
    // 5. Build payment URL
    return vnPayConfig.getVnp_PayUrl() + "?" + query + "&vnp_SecureHash=" + vnp_SecureHash;
    // Example: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1000000&...
}
```

#### 5.2 Handle VNPay Callback
```java
public VNPayReturnResponse handleVNPayCallback(HttpServletRequest request) {
    // 1. Get all query params from VNPay redirect
    Map<String, String> fields = vnPayUtils.getQueryParams(request);
    
    // 2. Verify signature
    String vnpSecureHash = fields.get("vnp_SecureHash");
    String calculatedHash = vnPayUtils.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());
    
    if (!calculatedHash.equals(vnpSecureHash)) {
        return VNPayReturnResponse.builder()
            .success(false)
            .message("Invalid signature - Data may have been tampered")
            .build();
    }
    
    // 3. Check payment success
    if ("00".equals(fields.get("vnp_ResponseCode"))) {
        // ✅ Payment success
        String orderId = fields.get("vnp_TxnRef");
        
        // ⚠️ Update order status to COMPLETED
        // ⚠️ Update order items payment status to PAID
        // ⚠️ Create PayoutOrderItems for revenue sharing
        orderService.updateSuccessOrder(orderId);
        
        return VNPayReturnResponse.builder()
            .success(true)
            .message("OK")
            .build();
    } else {
        // ❌ Payment failed
        return VNPayReturnResponse.builder()
            .success(false)
            .message("Payment failed with code: " + fields.get("vnp_ResponseCode"))
            .build();
    }
}
```

---

### 6️⃣ **Bước 6: Order Service**

**File:** `course-service/service/OrderService.java`

#### 6.1 Create Order (Status: PENDING)
```java
@Transactional
public void createOrder(CreationOrderRequest request) {
    // 1. Get current user ID from JWT token
    String userId = SecurityContextHolder.getContext()
        .getAuthentication()
        .getName();
    
    // 2. Create order entity
    Order order = Order.builder()
        .orderId(request.getOrderId()) // UUID from payment service
        .orderDate(request.getCreateTime())
        .orderStatus(OrderStatus.PENDING) // ⚠️ Initial status
        .idUser(userId)
        .build();
    
    // 3. Create order items (courses)
    for (CreationOrderItemRequest itemRequest : request.getOrderItems()) {
        OrderItem item = orderItemService.createOrderItem(itemRequest, order);
        // ⚠️ OrderItem initial status: PaymentStatus.PENDING
        order.getOrderItems().add(item);
    }
    
    // 4. Calculate total amount
    order.calculateAmount();
    
    // 5. Save to database (cascade will save OrderItems)
    orderRepository.save(order);
}
```

#### 6.2 Update Order to SUCCESS + Create Revenue Share
```java
@Transactional
public void updateSuccessOrder(String orderId) {
    log.info("Processing successful payment for order: {}", orderId);
    
    // 1. Find order by orderId (UUID)
    Order order = orderRepository.findByOrderId(orderId)
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    
    // 2. Update order status to COMPLETED
    order.setOrderStatus(OrderStatus.COMPLETED);
    
    // 3. Process each order item
    for (OrderItem orderItem : order.getOrderItems()) {
        // 3.1 Update payment status to PAID
        orderItem.setPaymentStatus(PaymentStatus.PAID); // ⚠️ Mark as PAID
        orderItem.setPaymentTxnId(orderId); // Store transaction reference
        
        log.info("Updated OrderItem ID: {} to PAID status", orderItem.getId());
        
        // 3.2 Create payout order items for revenue sharing
        try {
            // ⭐ Calculate revenue share for teacher, admin, system
            payoutOrderItemService.createPayoutOrderItems(orderItem);
            
            // Update payout status to ACCRUED (revenue calculated, waiting for payout)
            orderItem.setPayoutStatus(PayoutStatus.ACCRUED);
            
            log.info("Successfully created payout items for OrderItem ID: {}", orderItem.getId());
        } catch (Exception e) {
            log.error("Error creating payout items for OrderItem ID: {}", orderItem.getId(), e);
            // Continue processing other items even if one fails
        }
    }
    
    // 4. Save all changes (cascade will update OrderItems and create PayoutOrderItems)
    orderRepository.save(order);
    
    log.info("Successfully processed payment for order: {} with {} items", 
            orderId, order.getOrderItems().size());
}
```

#### 6.3 Check if Course is Purchased
```java
public boolean checkCoursePurchased(Integer publishedCourseId) {
    // 1. Get all orders of current user
    List<Order> ordersOfUser = this.getOrdersByUserId();
    
    // 2. Get all order IDs
    List<Integer> orderIds = ordersOfUser.stream()
        .map(Order::getId)
        .toList();
    
    // 3. Get all order items
    List<OrderItem> orderItems = new ArrayList<>();
    orderIds.forEach(orderId -> {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        orderItems.addAll(items);
    });
    
    // 4. Check if publishedCourseId exists in order items with PAID status
    return orderItems.stream()
        .anyMatch(item -> 
            item.getCourse().getId().equals(publishedCourseId) &&
            item.getPaymentStatus() == PaymentStatus.PAID
        );
}
```

---

### 6️⃣.1 **PayoutOrderItem Service - Revenue Sharing**

**File:** `course-service/service/PayoutOrderItemService.java`

```java
@Transactional
public List<PayoutOrderItem> createPayoutOrderItems(OrderItem orderItem) {
    List<PayoutOrderItem> payoutOrderItems = new ArrayList<>();
    
    // Get course and total amount
    PublishedCourse course = orderItem.getCourse();
    BigDecimal totalAmount = BigDecimal.valueOf(orderItem.getFinishedFee());
    
    log.info("Creating payout items for OrderItem ID: {}, Course: {}, Amount: {}", 
            orderItem.getId(), course.getTitle(), totalAmount);
    
    // Get all active revenue share configs (tỉ lệ chiết khấu)
    List<RevenueShareConfig> activeConfigs = revenueShareConfigRepository.findByIsActiveTrue();
    
    if (activeConfigs.isEmpty()) {
        log.warn("No active revenue share configs found!");
        return payoutOrderItems;
    }
    
    // Tính toán phần tiền cho từng recipient
    for (RevenueShareConfig config : activeConfigs) {
        // Calculate share amount based on percentage
        BigDecimal shareAmount = totalAmount
                .multiply(BigDecimal.valueOf(config.getSharePercentage()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        String recipientId = determineRecipientId(config.getRecipientType(), course);
        
        if (recipientId == null) {
            log.warn("Cannot determine recipient ID for type: {}", config.getRecipientType());
            continue;
        }
        
        // Create PayoutOrderItem
        PayoutOrderItem payoutOrderItem = PayoutOrderItem.builder()
                .orderItem(orderItem)
                .revenueShareConfig(config)
                .recipientType(config.getRecipientType())
                .recipientId(recipientId) // Teacher ID, Admin ID, or "SYSTEM"
                .amount(shareAmount) // Số tiền nhận được
                .sharePercentageSnapshot(config.getSharePercentage()) // Snapshot % at payment time
                .status(PayoutOrderItemStatus.ACCRUED) // Waiting for payout
                .accruedAt(LocalDateTime.now())
                .build();
        
        payoutOrderItems.add(payoutOrderItem);
        
        log.info("Created payout for {} (ID: {}): {} VND ({}% of {})", 
                config.getRecipientType(), 
                recipientId, 
                shareAmount, 
                config.getSharePercentage(), 
                totalAmount);
    }
    
    // Save all payout order items
    List<PayoutOrderItem> savedItems = payoutOrderItemRepository.saveAll(payoutOrderItems);
    
    log.info("Successfully created {} payout items for OrderItem ID: {}", 
            savedItems.size(), orderItem.getId());
    
    return savedItems;
}

/**
 * Determine recipient ID based on RecipientType
 */
private String determineRecipientId(RecipientType recipientType, PublishedCourse course) {
    return switch (recipientType) {
        case TEACHER -> course.getCourse().getIdCreatorTeacher(); // Teacher của course
        case ADMIN -> getEducationalUnitAdminId(course); // Admin của educational unit
        case SUPER_ADMIN -> "SYSTEM"; // System revenue (platform fee)
    };
}

private String getEducationalUnitAdminId(PublishedCourse course) {
    if (course.getCourse().getEducationalUnit() != null) {
        return course.getCourse().getEducationalUnit().getIdCreatorAdmin();
    }
    return null;
}
```

---

### 7️⃣ **Bước 7: Order Entity & Status**

**File:** `course-service/entity/Order.java`

```java
@Entity
@Table(name="orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "order_id", unique = true, nullable = false)
    private String orderId; // UUID from payment
    
    @Column(name = "order_date")
    private Date orderDate;
    
    @Column(precision = 18, scale = 2)
    private BigDecimal amount;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderItem> orderItems = new HashSet<>();
    
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus; // PENDING, COMPLETED, FAILED
    
    @Column(name = "user_id")
    private String idUser; // JWT user ID
    
    public void calculateAmount() {
        this.amount = orderItems.stream()
            .map(item -> BigDecimal.valueOf(item.getFinishedFee()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

**File:** `course-service/utils/OrderStatus.java`
```java
public enum OrderStatus {
    PENDING,    // Đang chờ thanh toán
    COMPLETED,  // Thanh toán thành công
    FAILED      // Thanh toán thất bại
}
```

---

## 🔄 FRONTEND - Return Page

### 8️⃣ **Bước 8: Handle Payment Return**

**File:** `src/pages/user/payment/VNPayReturn.tsx`

```typescript
const VNPayReturn = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");

  useEffect(() => {
    const processPaymentReturn = async () => {
      // 1. Get all query params from URL
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      // VNPay returns params like:
      // ?vnp_Amount=100000000
      // &vnp_BankCode=NCB
      // &vnp_ResponseCode=00
      // &vnp_TxnRef=abc-123-xyz
      // &vnp_TransactionNo=14123456
      // &vnp_SecureHash=...

      // 2. Call backend to verify and update order
      const result = await handleVNPayPaymentReturn(params);
      
      // 3. Display result
      if (result.success) {
        setStatus("success");
        // User can now access purchased courses!
      } else {
        setStatus("failed");
      }
    };

    processPaymentReturn();
  }, [searchParams]);

  return (
    <div>
      {status === "success" && (
        <>
          <CheckCircle className="text-green-500" />
          <h1>Thanh toán thành công!</h1>
          
          {/* Display transaction info */}
          <p>Mã giao dịch: {searchParams.get("vnp_TransactionNo")}</p>
          <p>Mã đơn hàng: {searchParams.get("vnp_TxnRef")}</p>
          <p>Số tiền: {formatCurrency(searchParams.get("vnp_Amount"))}</p>
          
          <Button onClick={() => navigate("/my-courses")}>
            Xem khóa học của tôi
          </Button>
        </>
      )}
      
      {status === "failed" && (
        <>
          <XCircle className="text-red-500" />
          <h1>Thanh toán thất bại!</h1>
          <Button onClick={() => navigate("/courses")}>
            Thử lại
          </Button>
        </>
      )}
    </div>
  );
};
```

---

## 📊 Database Schema

### Orders Table
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(255) UNIQUE NOT NULL,  -- UUID from payment
    order_date DATE,
    amount DECIMAL(18,2),
    order_status ENUM('PENDING', 'COMPLETED', 'FAILED'),
    user_id VARCHAR(255),  -- JWT user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    published_course_id INT,
    finished_fee DECIMAL(18,2),
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED') DEFAULT 'PENDING',
    payment_txn_id VARCHAR(255),
    payout_status ENUM('NOT_SETTLED', 'ACCRUED', 'PAID_OUT', 'REFUNDED') DEFAULT 'NOT_SETTLED',
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (published_course_id) REFERENCES published_courses(id)
);
```

### Payout Order Items Table (Revenue Share)
```sql
CREATE TABLE payout_order_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    payout_id INT,
    revenue_share_config_id INT NOT NULL,
    recipient_type ENUM('TEACHER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,  -- Teacher ID / Admin ID / "SYSTEM"
    amount DECIMAL(18,2) NOT NULL,  -- Số tiền được chia
    share_percentage_snapshot DOUBLE NOT NULL,  -- % snapshot tại thời điểm thanh toán
    status ENUM('ACCRUED', 'ATTACHED_TO_PAYOUT', 'SETTLED', 'REVERSED', 'REVERSED_AFTER_SETTLEMENT') DEFAULT 'ACCRUED',
    accrued_at TIMESTAMP NOT NULL,
    settled_at TIMESTAMP,
    transaction_reference VARCHAR(255),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (payout_id) REFERENCES payouts(id),
    FOREIGN KEY (revenue_share_config_id) REFERENCES revenue_share_config(id)
);
```

### Revenue Share Config Table
```sql
CREATE TABLE revenue_share_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_type ENUM('TEACHER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
    share_percentage DOUBLE NOT NULL,  -- Tỉ lệ chiết khấu (%)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Example data:
-- TEACHER: 70% của giá khóa học
-- ADMIN: 20% cho educational unit
-- SUPER_ADMIN: 10% platform fee
INSERT INTO revenue_share_config (recipient_type, share_percentage, is_active) VALUES
('TEACHER', 70.0, TRUE),
('ADMIN', 20.0, TRUE),
('SUPER_ADMIN', 10.0, TRUE);
```

---

## 🔍 Sequence Diagram

```
User                Frontend              Backend              VNPay              Database
 |                      |                    |                    |                    |
 |--Browse Course------>|                    |                    |                    |
 |<--Show Course--------|                    |                    |                    |
 |                      |                    |                    |                    |
 |--Click "Mua Ngay"--->|                    |                    |                    |
 |                      |                    |                    |                    |
 |                   Navigate to Payment Page                     |                    |
 |                      |                    |                    |                    |
 |                      |--getOrderPreview-->|                    |                    |
 |                      |<--Preview Data-----|                    |                    |
 |<--Show Payment-------|                    |                    |                    |
 |                      |                    |                    |                    |
 |--Select Method------>|                    |                    |                    |
 |--Complete Payment--->|                    |                    |                    |
 |                      |                    |                    |                    |
 |                      |--createPayment---->|                    |                    |
 |                      |                    |--Create Order----->|                    |
 |                      |                    |                    |--Save PENDING----->|
 |                      |                    |<--Order Saved------|                    |
 |                      |                    |                    |                    |
 |                      |                    |--Generate URL----->|                    |
 |                      |<--paymentUrl-------|<--VNPay URL--------|                    |
 |                      |                    |                    |                    |
 |<--Redirect to VNPay--|                    |                    |                    |
 |========================================>|                    |                    |
 |                   (User at VNPay)        |                    |                    |
 |                      |                    |                    |                    |
 |--Enter Card Info---->|                    |                    |                    |
 |--Submit Payment----->|                    |                    |                    |
 |                      |                    |                    |                    |
 |<--Payment Result-----|                    |                    |                    |
 |                      |                    |                    |                    |
 |<--Redirect Back------|------------------->|                    |                    |
 |                      |                    |                    |                    |
 |                   Return to /vnpay/return                      |                    |
 |                      |                    |                    |                    |
 |                      |--Verify Callback-->|                    |                    |
 |                      |                    |--Verify Hash------>|                    |
 |                      |                    |--Update Order----->|                    |
 |                      |                    |                    |--Set Order-------->|
 |                      |                    |                    | COMPLETED          |
 |                      |                    |                    |--Set OrderItem---->|
 |                      |                    |                    | PaymentStatus:PAID |
 |                      |                    |                    |--Calculate Share-->|
 |                      |                    |                    |--Create Payout---->|
 |                      |                    |                    | OrderItems         |
 |                      |                    |                    | (Teacher 70%)      |
 |                      |                    |                    | (Admin 20%)        |
 |                      |                    |                    | (System 10%)       |
 |                      |                    |                    |--Set OrderItem---->|
 |                      |                    |                    | PayoutStatus:      |
 |                      |                    |                    | ACCRUED            |
 |                      |                    |<--Updated----------|                    |
 |                      |<--Success----------|                    |                    |
 |<--Show Success-------|                    |                    |                    |
 |                      |                    |                    |                    |
 |--View My Courses---->|                    |                    |                    |
 |                      |--getMyCourses----->|                    |                    |
 |                      |                    |--Query Orders----->|                    |
 |                      |                    |<--COMPLETED Orders-|                    |
 |<--Show Courses-------|<--Course List------|                    |                    |
```

---

## ⚠️ Important Notes

### Security
1. **Order ID**: Sử dụng UUID để tránh dự đoán
2. **Secure Hash**: VNPay yêu cầu verify chữ ký để đảm bảo dữ liệu không bị giả mạo
3. **JWT Token**: User ID được lấy từ token để đảm bảo quyền sở hữu

### Transaction Safety
1. **Order Status**:
   - `PENDING`: Khi tạo order, chưa thanh toán
   - `COMPLETED`: Sau khi VNPay callback success
   - `FAILED`: Nếu thanh toán thất bại

2. **Idempotency**: 
   - Order ID unique → Không thể tạo trùng
   - VNPay callback có thể gọi nhiều lần → Backend phải handle

### Error Handling
1. **Frontend**:
   - Show loading state
   - Handle timeout
   - Display error message

2. **Backend**:
   - Validate signature
   - Check order exists
   - Transaction rollback if error

---

## 🧪 Testing Scenarios

### 1. Happy Path
```
User → Browse → Payment → VNPay → Success → My Courses ✅
```

### 2. Payment Failed
```
User → Browse → Payment → VNPay → Cancel → Return Failed ❌
```

### 3. Already Purchased
```
User → Browse → Check Status → Show "Đã mua" → View Content ✅
```

### 4. Invalid Signature
```
VNPay Callback → Verify Hash → Mismatch → Return Error ❌
```

---

## 📚 Related Files

### Frontend
- `src/pages/user/course/CourseDetail.tsx` - Course detail page
- `src/pages/user/payment/Payment.tsx` - Payment checkout page
- `src/pages/user/payment/VNPayReturn.tsx` - Payment return handler
- `src/services/api/user/payment.api.ts` - Payment API service

### Backend
- `controller/user/PaymentController.java` - Payment endpoints
- `service/PaymentService.java` - Payment business logic
- `service/OrderService.java` - Order management
- `service/PayoutOrderItemService.java` - **NEW: Revenue share calculation**
- `entity/Order.java` - Order entity
- `entity/OrderItem.java` - Order item entity (with PaymentStatus, PayoutStatus)
- `entity/PayoutOrderItem.java` - **NEW: Revenue distribution records**
- `entity/RevenueShareConfig.java` - **NEW: Revenue share percentage config**
- `repository/PayoutOrderItemRepository.java` - **NEW: Payout repository**
- `repository/RevenueShareConfigRepository.java` - **NEW: Config repository**
- `utils/OrderStatus.java` - Order status enum
- `utils/PaymentStatus.java` - **NEW: OrderItem payment status enum**
- `utils/PayoutStatus.java` - **NEW: OrderItem payout status enum**
- `utils/PayoutOrderItemStatus.java` - **NEW: Payout item status enum**
- `utils/RecipientType.java` - **NEW: Recipient type enum (TEACHER, ADMIN, SUPER_ADMIN)**
- `config/VNPayConfig.java` - VNPay configuration
- `utils/VNPayUtils.java` - VNPay utilities

---

## 🎓 Summary

**Luồng hoàn chỉnh:**
1. User chọn khóa học → Click "Mua ngay"
2. Frontend call `/preview` để hiển thị thông tin đơn hàng
3. User chọn phương thức và nhấn "Thanh toán"
4. Frontend call `/create` → Backend tạo Order (PENDING) và OrderItems (PaymentStatus.PENDING) → Trả về VNPay URL
5. User redirect sang VNPay → Thanh toán
6. VNPay redirect về `/vnpay/return` với kết quả
7. Backend verify signature → **Update Order (COMPLETED)**
8. **Update OrderItems (PaymentStatus.PAID, PayoutStatus.ACCRUED)**
9. **⭐ Calculate revenue share và tạo PayoutOrderItems:**
   - Teacher nhận 70% (ví dụ: 700,000 VND từ khóa học 1,000,000 VND)
   - Admin (Educational Unit) nhận 20% (200,000 VND)
   - System (Platform) nhận 10% (100,000 VND)
10. Frontend hiển thị thành công → User có thể xem khóa học đã mua

**Key Points:**
- ✅ Order được tạo với status PENDING trước khi thanh toán
- ✅ OrderItem được tạo với PaymentStatus.PENDING và PayoutStatus.NOT_SETTLED
- ✅ Chỉ update thành COMPLETED/PAID sau khi verify VNPay callback
- ✅ **⭐ PayoutOrderItem được tạo tự động khi thanh toán thành công**
- ✅ **Revenue share dựa trên RevenueShareConfig (có thể thay đổi % theo thời gian)**
- ✅ **Snapshot % tại thời điểm thanh toán để đảm bảo consistency**
- ✅ User chỉ có thể access course khi PaymentStatus = PAID
- ✅ Security: JWT auth + VNPay signature verification

**Revenue Share Flow:**
```
Course Price: 1,000,000 VND
├── Teacher (70%): 700,000 VND → PayoutOrderItem (ACCRUED)
├── Admin (20%): 200,000 VND → PayoutOrderItem (ACCRUED)
└── System (10%): 100,000 VND → PayoutOrderItem (ACCRUED)

Status progression:
OrderItem.PaymentStatus: PENDING → PAID
OrderItem.PayoutStatus: NOT_SETTLED → ACCRUED → PAID_OUT
PayoutOrderItem.Status: ACCRUED → ATTACHED_TO_PAYOUT → SETTLED
```
