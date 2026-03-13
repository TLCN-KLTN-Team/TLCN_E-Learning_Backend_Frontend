package com.hoangphihiep.entity;

import com.hoangphihiep.utils.PayoutOrderItemStatus;
import com.hoangphihiep.utils.RecipientType;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "payout_order_item")
public class PayoutOrderItem implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết với OrderItem (nguồn gốc doanh thu)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    // Liên kết với Payout (có thể null khi chưa tạo payout)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payout_id")
    private Payout payout;

    // Snapshot config tại thời điểm accrual
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revenue_share_config_id", nullable = false)
    private RevenueShareConfig revenueShareConfig;

    // ✅ Sử dụng Enum
    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", length = 50, nullable = false)
    private RecipientType recipientType;

    @Column(name = "recipient_id", nullable = false)
    private String recipientId; // Teacher ID hoặc EducationalUnit ID

    // Số tiền phải trả cho recipient này
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    // % được snapshot từ RevenueShareConfig
    @Column(name = "share_percentage_snapshot", nullable = false)
    private Double sharePercentageSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private PayoutOrderItemStatus status = PayoutOrderItemStatus.ACCRUED;

    @Column(name = "accrued_at", nullable = false)
    private LocalDateTime accruedAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "transaction_reference")
    private String transactionReference;

    // Escrow mechanism fields
    @Column(name = "hold_until")
    private LocalDateTime holdUntil;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "can_refund")
    @Builder.Default
    private Boolean canRefund = false;

    @PrePersist
    protected void onCreate() {
        if (accruedAt == null) {
            accruedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PayoutOrderItemStatus.ACCRUED;
        }
        if (canRefund == null) {
            canRefund = false;
        }
    }
}