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
@Table(name = "certificate", uniqueConstraints = {
    @UniqueConstraint(name = "uq_certificate_user_published", columnNames = {"user_id", "published_course_id"})
})
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "student_wallet")
    private String studentWallet;

    @Column(name = "signature", length = 512)
    private String signature;

    @Column(name = "signature_message", length = 2000)
    private String signatureMessage;

    @Column(name = "signature_verified_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date signatureVerifiedAt;

    @ManyToOne
    @JoinColumn(name = "published_course_id", nullable = false)
    private PublishedCourse publishedCourse;

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

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "grade")
    private String grade;

    @Column(name = "certificate_hash")
    private String certificateHash;

    // PDF & NFT Metadata
    @Column(name = "pdf_cid")
    private String pdfCid;

    @Column(name = "metadata_cid")
    private String metadataCid;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "token_uri")
    private String tokenUri;

    @Column(name = "token_id")
    private String tokenId;

    public enum CertificateStatus {
        PENDING,
        ISSUED,
        FAILED
    }
}
