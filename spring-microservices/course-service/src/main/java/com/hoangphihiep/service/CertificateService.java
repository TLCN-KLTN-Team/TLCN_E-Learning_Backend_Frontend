package com.hoangphihiep.service;

import com.hoangphihiep.entity.Certificate;
import com.hoangphihiep.repository.CertificateRepository;
import com.hoangphihiep.service.blockchain.Web3jService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final Web3jService web3jService;

    @Async
    public void issueCertificateAsync(String userId, Integer courseId) {
        log.info("Starting Async Certificate Issuance for User: {} - Course: {}", userId, courseId);

        // 1. Check if certificate exists
        if (certificateRepository.findByUserIdAndCourseId(userId, courseId).isPresent()) {
            log.info("Certificate already exists for User {} Course {}", userId, courseId);
            return;
        }

        // 2. Create Pending Certificate
        Certificate certificate = Certificate.builder()
                .userId(userId)
                .courseId(courseId)
                .certificateCode(UUID.randomUUID().toString())
                .issueDate(new Date())
                .status(Certificate.CertificateStatus.PENDING)
                .build();
        
        certificate = certificateRepository.save(certificate);

        // 3. Interact with Blockchain
        try {
            // Generate content to hash (Code + UserId + CourseId + Date)
            String contentToHash = certificate.getCertificateCode() + ":" + userId + ":" + courseId + ":" + certificate.getIssueDate().getTime();
            
            // Send to Blockchain
            String txHash = web3jService.issueCertificateTransaction(contentToHash);
            
            // 4. Update Certificate on Success
            certificate.setTransactionHash(txHash);
            certificate.setStatus(Certificate.CertificateStatus.ISSUED);
            
            // Try to get block number immediately (might be null if pending, can be updated later or ignored for now)
            BigInteger blockParam = web3jService.getBlockNumber(txHash);
            certificate.setBlockNumber(blockParam);

            certificateRepository.save(certificate);
            
            // TODO: Send WebSocket Notification here
            log.info("Certificate Issued Successfully! Tx: {}", txHash);

        } catch (Exception e) {
            log.error("Failed to issue blockchain certificate", e);
            certificate.setStatus(Certificate.CertificateStatus.FAILED);
            certificateRepository.save(certificate);
        }
    }

    public Certificate getCertificate(String userId, Integer courseId) {
        return certificateRepository.findByUserIdAndCourseId(userId, courseId)
                .filter(c -> c.getStatus() == Certificate.CertificateStatus.ISSUED)
                .orElse(null);
    }
    
    public Certificate getCertificateByCode(String code) {
         return certificateRepository.findByCertificateCode(code).orElse(null);
    }
}
