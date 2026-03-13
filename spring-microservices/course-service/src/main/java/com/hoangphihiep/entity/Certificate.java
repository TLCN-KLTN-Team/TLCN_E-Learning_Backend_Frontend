package com.hoangphihiep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigInteger;
import java.util.Date;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "certificate")
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "certificate_code", unique = true, nullable = false)
    private String certificateCode;

    @Column(name = "issue_date")
    private Date issueDate;

    // Blockchain Data
    @Column(name = "transaction_hash")
    private String transactionHash;

    @Column(name = "contract_address")
    private String contractAddress;

    @Column(name = "block_number")
    private BigInteger blockNumber;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private CertificateStatus status;

    public enum CertificateStatus {
        PENDING,
        ISSUED,
        FAILED
    }
}
