package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreditTransferApprovalRequest;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseProgress;
import com.hoangphihiep.entity.CreditTransfer;
import com.hoangphihiep.entity.EquivalentCourse;
import com.hoangphihiep.mapper.CreditTransferMapper;
import com.hoangphihiep.repository.CourseProgressRepository;
import com.hoangphihiep.repository.CreditTransferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditTransferService {

    private final CreditTransferRepository creditTransferRepository;
    private final CourseProgressRepository courseProgressRepository; // To update progress
    private final CreditTransferMapper creditTransferMapper;

    public Page<CreditTransferResponse> searchCreditTransfers(String status, String keyword, Pageable pageable) {
        return creditTransferRepository.search(status, keyword, pageable)
                .map(creditTransferMapper::toResponse);
    }

    public CreditTransferResponse getCreditTransferById(Integer id) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));
        return creditTransferMapper.toResponse(creditTransfer);
    }

    @Transactional
    public void approveCreditTransfer(Integer id, String note, String approvedById) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        if (!"PENDING".equalsIgnoreCase(creditTransfer.getStatus())) {
            throw new RuntimeException("Request is not in PENDING status");
        }

        creditTransfer.setStatus("APPROVED");
        creditTransfer.setApprovedById(approvedById); // Should ideally get from Security Context
        creditTransfer.setApprovedDate(LocalDateTime.now());
        // creditTransfer.setNote(note); // If entity has note field

        creditTransferRepository.save(creditTransfer);

        // Update Course Progress
        updateStudentProgress(creditTransfer);
    }

    @Transactional
    public void rejectCreditTransfer(Integer id, String reason, String rejectedById) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        if (!"PENDING".equalsIgnoreCase(creditTransfer.getStatus())) {
            throw new RuntimeException("Request is not in PENDING status");
        }

        creditTransfer.setStatus("REJECTED");
        creditTransfer.setRejectionReason(reason);
        creditTransfer.setApprovedById(rejectedById);
        creditTransfer.setApprovedDate(LocalDateTime.now());

        creditTransferRepository.save(creditTransfer);
    }

    private void updateStudentProgress(CreditTransfer creditTransfer) {
        EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
        if (equivalentCourse == null || equivalentCourse.getTargetCourse() == null) {
            log.warn("Cannot update progress: Equivalent/Target Course missing for Transfer ID {}", creditTransfer.getId());
            return;
        }

        Course targetCourse = equivalentCourse.getTargetCourse();
        String studentId = creditTransfer.getIdStudent();

        // Find existing progress or create new
        CourseProgress progress = courseProgressRepository.findByCourseIdAndUserId(targetCourse.getId(), studentId);
                 // Need to implement finding by Repo

        if (progress == null) {
            progress = new CourseProgress();
            progress.setIdUser(studentId);
            progress.setCourse(targetCourse);
            progress.setStartDate(new java.sql.Date(System.currentTimeMillis())); // Or request date
        }

        progress.setCompleted(true);
        progress.setCompletedViaCreditTransfer(true);
        progress.setProgressPercentage(100.0);
        progress.setCompleteDate(new java.sql.Date(System.currentTimeMillis()));

        courseProgressRepository.save(progress);
        log.info("Updated progress for student {} course {} via Credit Transfer", studentId, targetCourse.getId());
    }
}
