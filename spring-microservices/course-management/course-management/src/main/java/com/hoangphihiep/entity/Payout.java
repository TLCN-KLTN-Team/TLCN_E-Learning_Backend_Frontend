package com.hoangphihiep.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import com.devteria.identity.entity.Teacher;
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
@Table(name = "payout")
public class Payout implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "teacher_id")
    private String idTeacher;

    @Column(name = "amount", nullable = false)
    private double amount;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "payout_method", length = 50)
    private String payoutMethod;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "transaction_id")
    private String transactionId;
}
