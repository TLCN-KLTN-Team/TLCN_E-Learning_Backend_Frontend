package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.ScheduleCreditTransferInterviewRequest;
import com.hoangphihiep.dto.request.SubmitCreditTransferInterviewScoreRequest;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseProgress;
import com.hoangphihiep.entity.CreditTransfer;
import com.hoangphihiep.entity.EquivalentCourse;
import com.hoangphihiep.mapper.CreditTransferMapper;
import com.hoangphihiep.repository.CourseProgressRepository;
import com.hoangphihiep.repository.CreditTransferRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.utils.CreditTransferStatus;
import com.hoangphihiep.utils.InterviewMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditTransferService {

    private static final double DEFAULT_CERTIFICATE_WEIGHT = 0.4;
    private static final double DEFAULT_INTERVIEW_WEIGHT = 0.6;
    private static final double DEFAULT_APPROVAL_THRESHOLD = 7.0;

    private final CreditTransferRepository creditTransferRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final com.hoangphihiep.repository.EquivalentCourseRepository equivalentCourseRepository;
    private final CreditTransferMapper creditTransferMapper;
    private final FileHandlerRepository fileHandlerRepository;

    public Page<CreditTransferResponse> searchCreditTransfers(String status, String keyword, Pageable pageable) {
        CreditTransferStatus parsedStatus = parseStatus(status);
        return creditTransferRepository.search(parsedStatus, keyword, pageable)
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

        if (creditTransfer.getStatus() != CreditTransferStatus.PENDING_EXPERT_REVIEW) {
            throw new RuntimeException("Yêu cầu chưa sẵn sàng để expert phê duyệt");
        }

        if (creditTransfer.getDecisionScore() == null || creditTransfer.getApprovalThresholdApplied() == null) {
            throw new RuntimeException("Thiếu dữ liệu điểm xét duyệt");
        }

        if (creditTransfer.getDecisionScore() < creditTransfer.getApprovalThresholdApplied()) {
            throw new RuntimeException("Điểm xét duyệt chưa đạt ngưỡng, không thể phê duyệt");
        }

        creditTransfer.setStatus(CreditTransferStatus.APPROVED);
        creditTransfer.setApprovedById(approvedById);
        creditTransfer.setApprovedDate(LocalDateTime.now());

        creditTransferRepository.save(creditTransfer);
        updateStudentProgress(creditTransfer);
    }

    @Transactional
    public void rejectCreditTransfer(Integer id, String reason, String rejectedById) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        if (creditTransfer.getStatus() != CreditTransferStatus.PENDING_EXPERT_REVIEW) {
            throw new RuntimeException("Yêu cầu chưa sẵn sàng để expert từ chối");
        }

        creditTransfer.setStatus(CreditTransferStatus.REJECTED);
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

        CourseProgress progress = courseProgressRepository.findByCourseIdAndUserId(targetCourse.getId(), studentId);

        if (progress == null) {
            progress = new CourseProgress();
            progress.setIdUser(studentId);
            progress.setCourse(targetCourse);
            progress.setStartDate(new java.sql.Date(System.currentTimeMillis()));
        }

        progress.setCompleted(true);
        progress.setCompletedViaCreditTransfer(true);
        progress.setProgressPercentage(100.0);
        progress.setCompleteDate(new java.sql.Date(System.currentTimeMillis()));

        courseProgressRepository.save(progress);
        log.info("Updated progress for student {} course {} via Credit Transfer", studentId, targetCourse.getId());
    }

    @Transactional
    public void scheduleInterview(Integer id, ScheduleCreditTransferInterviewRequest request, String teacherId) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        if (creditTransfer.getStatus() != CreditTransferStatus.PENDING
                && creditTransfer.getStatus() != CreditTransferStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Yêu cầu không thể xếp lịch vấn đáp ở trạng thái hiện tại");
        }

        if (request.getInterviewScheduledAt() == null || request.getInterviewMode() == null) {
            throw new RuntimeException("Thiếu thời gian hoặc hình thức vấn đáp");
        }

        if (request.getInterviewMode() == InterviewMode.ONLINE && isBlank(request.getInterviewMeetingLink())) {
            throw new RuntimeException("Vui lòng nhập link phòng họp online");
        }

        if (request.getInterviewMode() == InterviewMode.OFFLINE && isBlank(request.getInterviewLocation())) {
            throw new RuntimeException("Vui lòng nhập địa điểm vấn đáp offline");
        }

        creditTransfer.setInterviewTeacherId(teacherId);
        creditTransfer.setInterviewScheduledAt(request.getInterviewScheduledAt());
        creditTransfer.setInterviewMode(request.getInterviewMode());
        creditTransfer.setInterviewMeetingLink(request.getInterviewMode() == InterviewMode.ONLINE ? request.getInterviewMeetingLink() : null);
        creditTransfer.setInterviewLocation(request.getInterviewMode() == InterviewMode.OFFLINE ? request.getInterviewLocation() : null);
        creditTransfer.setInterviewFeedback(request.getNote());
        creditTransfer.setStatus(CreditTransferStatus.INTERVIEW_SCHEDULED);
        creditTransferRepository.save(creditTransfer);
    }

    @Transactional
    public void submitInterviewScore(Integer id, SubmitCreditTransferInterviewScoreRequest request, String teacherId) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        if (creditTransfer.getStatus() != CreditTransferStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Yêu cầu chưa được xếp lịch vấn đáp");
        }

        if (!isBlank(creditTransfer.getInterviewTeacherId()) && !teacherId.equals(creditTransfer.getInterviewTeacherId())) {
            throw new RuntimeException("Chỉ giáo viên đã xếp lịch mới được chấm vấn đáp");
        }

        validateScoreRange(request.getCertificateScore(), "Điểm trung bình chứng chỉ");
        validateScoreRange(request.getInterviewScore(), "Điểm vấn đáp");

        EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
        double certificateWeight = equivalentCourse.getCertificateWeight() != null ? equivalentCourse.getCertificateWeight() : DEFAULT_CERTIFICATE_WEIGHT;
        double interviewWeight = equivalentCourse.getInterviewWeight() != null ? equivalentCourse.getInterviewWeight() : DEFAULT_INTERVIEW_WEIGHT;
        double approvalThreshold = equivalentCourse.getApprovalThreshold() != null ? equivalentCourse.getApprovalThreshold() : DEFAULT_APPROVAL_THRESHOLD;

        double decisionScore = (request.getCertificateScore() * certificateWeight) + (request.getInterviewScore() * interviewWeight);

        creditTransfer.setInterviewTeacherId(teacherId);
        creditTransfer.setCertificateScore(request.getCertificateScore());
        creditTransfer.setInterviewScore(request.getInterviewScore());
        creditTransfer.setInterviewFeedback(request.getInterviewFeedback());
        creditTransfer.setInterviewScoredAt(LocalDateTime.now());
        creditTransfer.setCertificateWeightApplied(certificateWeight);
        creditTransfer.setInterviewWeightApplied(interviewWeight);
        creditTransfer.setApprovalThresholdApplied(approvalThreshold);
        creditTransfer.setDecisionScore(decisionScore);
        creditTransfer.setDecisionReason("Điểm tổng hợp = chứng chỉ x trọng số + vấn đáp x trọng số");
        creditTransfer.setStatus(CreditTransferStatus.PENDING_EXPERT_REVIEW);

        creditTransferRepository.save(creditTransfer);
    }

    @Transactional
    public void createCreditTransfer(com.hoangphihiep.dto.request.CreateCreditTransferRequest request, String studentId, String studentName) {
        createCreditTransfer(request, studentId, studentName, null);
    }

    @Transactional
    public void createCreditTransfer(com.hoangphihiep.dto.request.CreateCreditTransferRequest request, String studentId, String studentName, MultipartFile attachmentFile) {
        EquivalentCourse equivalentCourse = equivalentCourseRepository.findById(request.getEquivalentCourseId())
                .orElseThrow(() -> new RuntimeException("Khóa học quy đổi không tồn tại"));

        Course targetCourse = equivalentCourse.getTargetCourse();

        CourseProgress progress = courseProgressRepository.findByCourseIdAndUserId(targetCourse.getId(), studentId);
        if (progress != null && progress.isCompleted()) {
             throw new RuntimeException("Bạn đã hoàn thành môn học " + targetCourse.getCourseName() + ", không thể yêu cầu quy đổi.");
        }

        List<CreditTransferStatus> activeStatuses = List.of(
                CreditTransferStatus.PENDING,
                CreditTransferStatus.INTERVIEW_SCHEDULED,
                CreditTransferStatus.PENDING_EXPERT_REVIEW
        );

        long pendingCount = creditTransferRepository.countByIdStudentAndStatusIn(studentId, activeStatuses);
        if (pendingCount >= 3) {
             throw new RuntimeException("Bạn đang có quá nhiều yêu cầu chờ duyệt (" + pendingCount + "). Vui lòng đợi xử lý trước khi gửi thêm.");
        }

        CreditTransfer creditTransfer = new CreditTransfer();
        creditTransfer.setIdStudent(studentId);
        creditTransfer.setStudentName(studentName);
        creditTransfer.setEquivalentCourse(equivalentCourse);
        creditTransfer.setDescription(request.getDescription());
        creditTransfer.setAttachmentUrl(resolveAttachmentUrl(request.getAttachmentUrl(), attachmentFile));
        creditTransfer.setEducationalUnitName(request.getEducationalUnitName() != null ? request.getEducationalUnitName() : 
            (equivalentCourse.getSourceCourse() != null && equivalentCourse.getSourceCourse().getCourse() != null && equivalentCourse.getSourceCourse().getCourse().getEducationalUnit() != null) 
            ? equivalentCourse.getSourceCourse().getCourse().getEducationalUnit().getName() : "Unknown");
        
        creditTransfer.setStatus(CreditTransferStatus.PENDING);
        creditTransfer.setRequestDate(LocalDateTime.now());

        creditTransferRepository.save(creditTransfer);
    }

    private String resolveAttachmentUrl(String attachmentUrl, MultipartFile attachmentFile) {
        if (attachmentFile != null && !attachmentFile.isEmpty()) {
            Map<String, String> uploaded = fileHandlerRepository.uploadFile(attachmentFile);
            String uploadedUrl = uploaded != null ? uploaded.get("url") : null;
            if (isBlank(uploadedUrl)) {
                throw new RuntimeException("Không thể tải tệp minh chứng lên hệ thống");
            }
            return uploadedUrl;
        }

        return attachmentUrl;
    }

    public Page<CreditTransferResponse> getMyCreditTransfers(String studentId, Pageable pageable) {
        return creditTransferRepository.findByIdStudent(studentId, pageable)
                .map(creditTransferMapper::toResponse);
    }

    private CreditTransferStatus parseStatus(String status) {
        if (isBlank(status)) {
            return null;
        }

        try {
            return CreditTransferStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
    }

    private void validateScoreRange(Double score, String fieldName) {
        if (score == null) {
            throw new RuntimeException(fieldName + " là bắt buộc");
        }

        if (score < 0 || score > 10) {
            throw new RuntimeException(fieldName + " phải nằm trong khoảng từ 0 đến 10");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
