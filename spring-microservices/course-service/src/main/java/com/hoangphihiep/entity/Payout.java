package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.hoangphihiep.utils.PayoutPayoutStatus;
import com.hoangphihiep.utils.RecipientType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "payout")
public class Payout implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", length = 50, nullable = false)
    private RecipientType recipientType;

    @Column(name = "recipient_id", nullable = false)
    private String recipientId;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", length = 10)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private PayoutPayoutStatus status;

    @Column(name = "payout_method", length = 50)
    private String payoutMethod;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "transaction_id")
    private String transactionId;

    @OneToMany(mappedBy = "payout", cascade = CascadeType.ALL)
    private List<PayoutOrderItem> payoutOrderItems = new ArrayList<>();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (requestDate == null) {
            requestDate = LocalDateTime.now();
        }
        if (currency == null) {
            currency = "VND";
        }
    }
}
