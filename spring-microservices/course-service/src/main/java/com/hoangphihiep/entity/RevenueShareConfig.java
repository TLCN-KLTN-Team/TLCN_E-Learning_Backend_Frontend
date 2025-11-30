package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.hoangphihiep.utils.RecipientType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "revenue_share_config")
public class RevenueShareConfig implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", length = 50, nullable = false)
    private RecipientType recipientType;

    @Column(name = "share_percentage", nullable = false)
    private Double sharePercentage;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @OneToMany(mappedBy = "revenueShareConfig")
    private List<PayoutOrderItem> payoutOrderItems = new ArrayList<>();
}
