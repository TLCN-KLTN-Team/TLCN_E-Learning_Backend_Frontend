package com.hoangphihiep.dto.response;

import com.hoangphihiep.entity.Certificate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CertificateResponse {
    private Integer id;
    private String userId;
    private String studentName;
    private Integer courseId;
    private String courseName;
    private String certificateCode;
    private Date issueDate;
    private String transactionHash;
    private String contractAddress;
    private BigInteger blockNumber;
    private Double finalScore;
    private String grade;
    private Certificate.CertificateStatus status;

    public static CertificateResponse fromEntity(Certificate certificate) {
        return CertificateResponse.builder()
                .id(certificate.getId())
                .userId(certificate.getUserId())
                .courseId(certificate.getPublishedCourse().getId())
                .courseName(certificate.getPublishedCourse().getCourseName())
                .certificateCode(certificate.getCertificateCode())
                .issueDate(certificate.getIssueDate())
                .transactionHash(certificate.getTransactionHash())
                .contractAddress(certificate.getContractAddress())
                .blockNumber(certificate.getBlockNumber())
                .status(certificate.getStatus())
                .finalScore(certificate.getFinalScore())
                .grade(certificate.getGrade())
                .build();
    }
}
