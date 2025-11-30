package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import com.hoangphihiep.utils.PaymentStatus;
import com.hoangphihiep.utils.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Table(name="order_item")
@NamedQuery(name="OrderItem.findAll", query="SELECT oi from OrderItem oi")
public class OrderItem implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private PublishedCourse course;

    @Column(name = "finished_fee")
    private double finishedFee;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 50)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_txn_id", unique = true)
    private String paymentTxnId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", length = 50)
    @Builder.Default
    private PayoutStatus payoutStatus = PayoutStatus.NOT_SETTLED;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PayoutOrderItem> payoutOrderItems = new ArrayList<>();

    public boolean containsCourse(Integer courseId) {
        return this.course.getId().equals(courseId);
    }
}
