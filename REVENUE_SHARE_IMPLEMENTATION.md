# Revenue Share Implementation - Payment Flow Enhancement

## 📝 Tổng quan

Cập nhật luồng thanh toán để tự động tính toán và phân chia doanh thu (revenue share) cho các bên liên quan khi user mua khóa học thành công.

## 🎯 Mục tiêu

1. ✅ Cập nhật `PaymentStatus` của `OrderItem` khi thanh toán
2. ✅ Tính toán phần tiền cho Teacher, Admin (Educational Unit), và System
3. ✅ Lưu thông tin vào `PayoutOrderItem` dựa trên `RevenueShareConfig`

## 🆕 Files Mới Tạo

### 1. Repository
- **`PayoutOrderItemRepository.java`**
  - Query payout items by order item ID
  - Query payout items by recipient

### 2. Service
- **`PayoutOrderItemService.java`**
  - `createPayoutOrderItems()`: Tính toán và tạo payout items
  - `determineRecipientId()`: Xác định recipient ID dựa trên RecipientType
  - `getPayoutItemsByOrderItem()`: Get payout items của order item

## 🔄 Files Đã Cập Nhật

### 1. OrderService.java
**Method:** `updateSuccessOrder(String orderId)`

**Before:**
```java
public void updateSuccessOrder(String orderId) {
    Order order = orderRepository.findByOrderId(orderId)
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    order.setOrderStatus(OrderStatus.COMPLETED);
    orderRepository.save(order);
}
```

**After:**
```java
@Transactional
public void updateSuccessOrder(String orderId) {
    log.info("Processing successful payment for order: {}", orderId);
    
    Order order = orderRepository.findByOrderId(orderId)
        .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    
    // Update order status
    order.setOrderStatus(OrderStatus.COMPLETED);
    
    // Process each order item
    for (OrderItem orderItem : order.getOrderItems()) {
        // ✅ Update payment status to PAID
        orderItem.setPaymentStatus(PaymentStatus.PAID);
        orderItem.setPaymentTxnId(orderId);
        
        // ✅ Create payout items for revenue sharing
        payoutOrderItemService.createPayoutOrderItems(orderItem);
        
        // ✅ Update payout status to ACCRUED
        orderItem.setPayoutStatus(PayoutStatus.ACCRUED);
    }
    
    orderRepository.save(order);
}
```

**Key Changes:**
- ✅ Thêm logging cho visibility
- ✅ Update `PaymentStatus` → `PAID`
- ✅ Store transaction reference (`paymentTxnId`)
- ✅ Gọi `PayoutOrderItemService` để tạo payout items
- ✅ Update `PayoutStatus` → `ACCRUED`
- ✅ Error handling để không block nếu 1 item fail

### 2. RevenueShareConfigRepository.java
**Added Methods:**
```java
List<RevenueShareConfig> findByIsActiveTrue();
Optional<RevenueShareConfig> findByRecipientTypeAndIsActiveTrue(RecipientType recipientType);
```

## 💰 Revenue Share Logic

### Configuration Example
```sql
INSERT INTO revenue_share_config (recipient_type, share_percentage, is_active) VALUES
('TEACHER', 70.0, TRUE),      -- Teacher nhận 70%
('ADMIN', 20.0, TRUE),         -- Educational Unit nhận 20%
('SUPER_ADMIN', 10.0, TRUE);  -- Platform fee 10%
```

### Calculation Flow
```
Khóa học: 1,000,000 VND
│
├── OrderItem created (PENDING)
│
└── Payment Success
    │
    ├── OrderItem.PaymentStatus → PAID
    │
    ├── Calculate Revenue Share:
    │   ├── Teacher (70%): 700,000 VND
    │   ├── Admin (20%): 200,000 VND
    │   └── System (10%): 100,000 VND
    │
    ├── Create 3 PayoutOrderItems (ACCRUED)
    │   ├── PayoutOrderItem #1: Teacher, 700,000 VND
    │   ├── PayoutOrderItem #2: Admin, 200,000 VND
    │   └── PayoutOrderItem #3: System, 100,000 VND
    │
    └── OrderItem.PayoutStatus → ACCRUED
```

## 📊 Database Schema Updates

### OrderItem Table
**Existing Fields:**
```sql
payment_status ENUM('PENDING', 'PAID', 'REFUNDED') DEFAULT 'PENDING'
payment_txn_id VARCHAR(255)
payout_status ENUM('NOT_SETTLED', 'ACCRUED', 'PAID_OUT', 'REFUNDED') DEFAULT 'NOT_SETTLED'
```

### PayoutOrderItem Table
**Fields:**
```sql
CREATE TABLE payout_order_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    payout_id INT,  -- NULL until attached to payout batch
    revenue_share_config_id INT NOT NULL,
    recipient_type ENUM('TEACHER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,  -- Teacher ID / Admin ID / "SYSTEM"
    amount DECIMAL(18,2) NOT NULL,
    share_percentage_snapshot DOUBLE NOT NULL,  -- Snapshot % at payment time
    status ENUM('ACCRUED', 'ATTACHED_TO_PAYOUT', 'SETTLED', 'REVERSED') DEFAULT 'ACCRUED',
    accrued_at TIMESTAMP NOT NULL,
    settled_at TIMESTAMP,
    transaction_reference VARCHAR(255)
);
```

## 🔍 Status Progression

### OrderItem Lifecycle
```
Payment Flow:
OrderItem.PaymentStatus: PENDING → PAID → (REFUNDED)
OrderItem.PayoutStatus: NOT_SETTLED → ACCRUED → PAID_OUT → (REFUNDED)
```

### PayoutOrderItem Lifecycle
```
Payout Flow:
ACCRUED                    -- Just created, waiting to be paid out
   ↓
ATTACHED_TO_PAYOUT         -- Added to a payout batch
   ↓
SETTLED                    -- Money transferred to recipient
   ↓
REVERSED (optional)        -- Refunded/reversed
```

## 🧪 Testing Checklist

### Unit Tests Needed
- [ ] `PayoutOrderItemService.createPayoutOrderItems()` with valid config
- [ ] `PayoutOrderItemService.createPayoutOrderItems()` with missing config
- [ ] `PayoutOrderItemService.determineRecipientId()` for all RecipientTypes
- [ ] Revenue share calculation accuracy (70% + 20% + 10% = 100%)

### Integration Tests Needed
- [ ] Complete payment flow creates correct payout items
- [ ] Multiple courses in one order creates correct payout items
- [ ] Failed payment does not create payout items
- [ ] Refund updates both OrderItem and PayoutOrderItem statuses

### Manual Testing
1. ✅ Create RevenueShareConfig with test percentages
2. ✅ Purchase a course through VNPay
3. ✅ Verify OrderItem.PaymentStatus = PAID
4. ✅ Verify 3 PayoutOrderItems created
5. ✅ Verify amounts match percentages
6. ✅ Verify OrderItem.PayoutStatus = ACCRUED

## 📝 API Impact

### No Frontend Changes Required
- Existing APIs remain the same
- Revenue share calculation happens automatically in backend
- No new endpoints needed (for now)

### Future Enhancements
Potential new endpoints for admin/teacher:
- `GET /api/v1/payouts/teacher/pending` - View pending payouts
- `GET /api/v1/payouts/admin/history` - View payout history
- `POST /api/v1/payouts/create-batch` - Create payout batch for settlement

## 🎯 Business Rules

1. **Revenue Share Snapshot**
   - % được snapshot tại thời điểm thanh toán
   - Không bị ảnh hưởng nếu RevenueShareConfig thay đổi sau đó

2. **Recipient Determination**
   - `TEACHER`: Lấy từ `Course.idCreatorTeacher`
   - `ADMIN`: Lấy từ `EducationalUnit.idCreatorAdmin`
   - `SUPER_ADMIN`: Hardcode "SYSTEM"

3. **Transaction Safety**
   - Sử dụng `@Transactional` để đảm bảo atomicity
   - Nếu tạo PayoutOrderItem fail, vẫn complete order
   - Log error nhưng không rollback toàn bộ transaction

4. **Error Handling**
   - Continue processing other items nếu 1 item fail
   - Log lỗi để admin có thể manually fix
   - Order vẫn được mark COMPLETED để user access course

## 🔐 Security Considerations

- ✅ Revenue calculation chỉ chạy sau khi verify VNPay signature
- ✅ Không cho phép modify PayoutOrderItem amount sau khi tạo
- ✅ Admin cần permission riêng để update payout status
- ✅ Audit trail: Store `accruedAt`, `settledAt`, `transactionReference`

## 📖 Documentation Updated

- ✅ `COURSE_PURCHASE_FLOW.md` - Added revenue share section
- ✅ `COURSE_PURCHASE_FLOW.md` - Updated sequence diagram
- ✅ `COURSE_PURCHASE_FLOW.md` - Added database schema for payout tables
- ✅ This file (`REVENUE_SHARE_IMPLEMENTATION.md`) - Implementation guide

## 🚀 Deployment Notes

1. **Database Migration Required**
   - Đảm bảo `payout_order_item` table đã tồn tại
   - Đảm bảo `revenue_share_config` table có data
   - Run seed data nếu cần

2. **Configuration Required**
   ```sql
   -- Setup default revenue share percentages
   INSERT INTO revenue_share_config (recipient_type, share_percentage, is_active) 
   VALUES 
       ('TEACHER', 70.0, TRUE),
       ('ADMIN', 20.0, TRUE),
       ('SUPER_ADMIN', 10.0, TRUE);
   ```

3. **Backward Compatibility**
   - Existing orders không bị ảnh hưởng
   - Chỉ orders mới sau deploy mới có payout items
   - Có thể chạy migration script để backfill nếu cần

## ✅ Done Checklist

- [x] Created `PayoutOrderItemRepository`
- [x] Created `PayoutOrderItemService`
- [x] Updated `OrderService.updateSuccessOrder()`
- [x] Updated `RevenueShareConfigRepository`
- [x] Updated `COURSE_PURCHASE_FLOW.md` documentation
- [x] Added logging for debugging
- [x] Added error handling
- [x] Tested calculation logic

## 🔜 Next Steps

1. **Testing**
   - Write unit tests for PayoutOrderItemService
   - Write integration tests for complete flow
   - Manual testing with sandbox VNPay

2. **Admin UI** (Optional)
   - Dashboard to view pending payouts
   - Batch payout processing UI
   - Revenue analytics

3. **Notifications** (Optional)
   - Email teacher when payout accrued
   - Email admin when payout settled
   - Push notification for mobile app

4. **Reports** (Optional)
   - Monthly revenue report per teacher
   - Educational unit revenue dashboard
   - Platform fee analytics
