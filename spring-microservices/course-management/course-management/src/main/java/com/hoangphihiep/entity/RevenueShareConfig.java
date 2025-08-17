package com.hoangphihiep.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

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

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType;

    @Column(name = "share_percentage", nullable = false)
    private double sharePercentage;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;
}
