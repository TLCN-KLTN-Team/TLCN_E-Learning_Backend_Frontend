package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CreateCreditTransferRequest;
import com.hoangphihiep.dto.request.ScheduleCreditTransferInterviewRequest;
import com.hoangphihiep.dto.request.NotificationMessage;
import com.hoangphihiep.dto.request.SubmitCreditTransferInterviewScoreRequest;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.entity.Certificate;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseProgress;
import com.hoangphihiep.entity.CreditTransfer;
import com.hoangphihiep.entity.EquivalentCourse;
import com.hoangphihiep.mapper.CreditTransferMapper;
import com.hoangphihiep.repository.CertificateRepository;
import com.hoangphihiep.repository.CourseProgressRepository;
import com.hoangphihiep.repository.CreditTransferRepository;
import com.hoangphihiep.repository.httpclient.ExpertRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.repository.httpclient.NotificationRepository;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.dto.response.ExpertResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.utils.CreditTransferStatus;
import com.hoangphihiep.utils.InterviewMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Locale;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditTransferService {

    private static final double DEFAULT_CERTIFICATE_WEIGHT = 0.4;
    private static final double DEFAULT_INTERVIEW_WEIGHT = 0.6;
    private static final double DEFAULT_APPROVAL_THRESHOLD = 7.0;
    private static final DateTimeFormatter INTERVIEW_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final DateTimeFormatter DECISION_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final CreditTransferRepository creditTransferRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final CertificateRepository certificateRepository;
    private final FileHandlerRepository fileHandlerRepository;
    private final com.hoangphihiep.repository.EquivalentCourseRepository equivalentCourseRepository;
    private final CreditTransferMapper creditTransferMapper;
    private final UserInfoApi userInfoApi;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;
    private final ExpertRepository expertRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public Page<CreditTransferResponse> searchCreditTransfers(String status, String keyword, Pageable pageable) {
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();
        return searchCreditTransfers(status, keyword, currentExpertId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<CreditTransferResponse> searchCreditTransfers(String status, String keyword, String expertId, Pageable pageable) {
        CreditTransferStatus parsedStatus = parseStatus(status);
        return creditTransferRepository.search(parsedStatus, keyword, expertId, pageable)
                .map(this::toResponseWithCertificateScore);
    }

    @Transactional(readOnly = true)
    public Page<CreditTransferResponse> searchTeacherCreditTransfers(String status, String keyword, String teacherId, Pageable pageable) {
        CreditTransferStatus parsedStatus = parseStatus(status);
        return creditTransferRepository.searchByTeacher(parsedStatus, keyword, teacherId, pageable)
                .map(this::toResponseWithCertificateScore);
    }

    @Transactional(readOnly = true)
    public CreditTransferResponse getCreditTransferById(Integer id) {
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertCanAccessCreditTransfer(creditTransfer, currentExpertId);
        return toResponseWithCertificateScore(creditTransfer);
    }

    @Transactional(readOnly = true)
    public CreditTransferResponse getTeacherCreditTransferById(Integer id, String teacherId) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertTeacherCanAccessCreditTransfer(creditTransfer, teacherId);
        return toResponseWithCertificateScore(creditTransfer);
    }

    @Transactional
    public void approveCreditTransfer(Integer id, String note, String approvedById) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertCanAccessCreditTransfer(creditTransfer, approvedById);

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
        sendDecisionNotification(creditTransfer, true);
        sendDecisionEmailNotification(creditTransfer, true);
    }

    @Transactional
    public void rejectCreditTransfer(Integer id, String reason, String rejectedById) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertCanAccessCreditTransfer(creditTransfer, rejectedById);

        if (creditTransfer.getStatus() != CreditTransferStatus.PENDING_EXPERT_REVIEW) {
            throw new RuntimeException("Yêu cầu chưa sẵn sàng để expert từ chối");
        }

        creditTransfer.setStatus(CreditTransferStatus.REJECTED);
        creditTransfer.setRejectionReason(reason);
        creditTransfer.setApprovedById(rejectedById);
        creditTransfer.setApprovedDate(LocalDateTime.now());

        creditTransferRepository.save(creditTransfer);
        sendDecisionNotification(creditTransfer, false);
        sendDecisionEmailNotification(creditTransfer, false);
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

    private void assertCanAccessCreditTransfer(CreditTransfer creditTransfer, String expertId) {
        if (creditTransfer == null
                || creditTransfer.getEquivalentCourse() == null
                || creditTransfer.getEquivalentCourse().getTargetCourse() == null
                || creditTransfer.getEquivalentCourse().getTargetCourse().getExpertId() == null
                || !creditTransfer.getEquivalentCourse().getTargetCourse().getExpertId().equals(expertId)) {
            throw new RuntimeException("Bạn không có quyền truy cập yêu cầu tín chỉ này");
        }
    }

    private void assertTeacherCanAccessCreditTransfer(CreditTransfer creditTransfer, String teacherId) {
        if (creditTransfer == null
                || creditTransfer.getEquivalentCourse() == null
                || creditTransfer.getEquivalentCourse().getTargetCourse() == null
                || creditTransfer.getEquivalentCourse().getTargetCourse().getIdTeacher() == null
                || !creditTransfer.getEquivalentCourse().getTargetCourse().getIdTeacher().equals(teacherId)) {
            throw new RuntimeException("Bạn không có quyền truy cập yêu cầu tín chỉ này");
        }
    }

    @Transactional
    public void scheduleInterview(Integer id, ScheduleCreditTransferInterviewRequest request, String teacherId) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertTeacherCanAccessCreditTransfer(creditTransfer, teacherId);

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
        
        sendInterviewScheduledNotification(creditTransfer);
        sendInterviewScheduledEmailNotification(creditTransfer);
    }
    
    private void sendInterviewScheduledNotification(CreditTransfer creditTransfer) {
        try {
            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";
            
            String interviewDetails = buildInterviewDetails(creditTransfer);
            
            notificationRepository.sendNotification(NotificationMessage.builder()
                    .userId(creditTransfer.getIdStudent())
                    .type("CREDIT_TRANSFER_INTERVIEW_SCHEDULED")
                    .message("Lịch vấn đáp quy đổi tín chỉ cho môn " + targetCourseName + " đã được xếp. " + interviewDetails)
                    .link("/student/credit-transfers")
                    .data(buildCreditTransferData(creditTransfer, targetCourse))
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send interview scheduled notification for credit transfer {}: {}", creditTransfer.getId(), e.getMessage(), e);
        }
    }
    
    private String buildInterviewDetails(CreditTransfer creditTransfer) {
        StringBuilder details = new StringBuilder();
        if (creditTransfer.getInterviewScheduledAt() != null) {
            details.append("Thời gian: ").append(creditTransfer.getInterviewScheduledAt().format(INTERVIEW_TIME_FORMATTER)).append(". ");
        }
        if (creditTransfer.getInterviewMode() != null) {
            details.append("Hình thức: ").append(creditTransfer.getInterviewMode().equals(InterviewMode.ONLINE) ? "Online" : "Offline").append(". ");
        }
        if (creditTransfer.getInterviewMode() == InterviewMode.ONLINE && !isBlank(creditTransfer.getInterviewMeetingLink())) {
            details.append("Link: ").append(creditTransfer.getInterviewMeetingLink()).append(".");
        } else if (creditTransfer.getInterviewMode() == InterviewMode.OFFLINE && !isBlank(creditTransfer.getInterviewLocation())) {
            details.append("Địa điểm: ").append(creditTransfer.getInterviewLocation()).append(".");
        }
        return details.toString();
    }

    private void sendInterviewScheduledEmailNotification(CreditTransfer creditTransfer) {
        try {
            UserResponse student = userInfoApi.getUserInfo(creditTransfer.getIdStudent()).getResult();
            if (student == null || isBlank(student.getEmail())) {
                log.warn("Skipping interview schedule email because student email is missing for request {}", creditTransfer.getId());
                return;
            }

            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";

            String interviewTime = creditTransfer.getInterviewScheduledAt() != null
                    ? creditTransfer.getInterviewScheduledAt().format(INTERVIEW_TIME_FORMATTER)
                    : "Chưa cập nhật";

            String interviewMode = creditTransfer.getInterviewMode() == InterviewMode.ONLINE ? "Online"
                    : creditTransfer.getInterviewMode() == InterviewMode.OFFLINE ? "Offline" : "Chưa cập nhật";

            String meetingOrLocation = "Chưa cập nhật";
            if (creditTransfer.getInterviewMode() == InterviewMode.ONLINE && !isBlank(creditTransfer.getInterviewMeetingLink())) {
                meetingOrLocation = creditTransfer.getInterviewMeetingLink();
            } else if (creditTransfer.getInterviewMode() == InterviewMode.OFFLINE && !isBlank(creditTransfer.getInterviewLocation())) {
                meetingOrLocation = creditTransfer.getInterviewLocation();
            }

            emailService.sendCreditTransferInterviewScheduledEmailAsync(
                    student.getEmail(),
                    student.getFirstName(),
                    creditTransfer.getStudentName(),
                    targetCourseName,
                    interviewTime,
                    interviewMode,
                    meetingOrLocation
            );
        } catch (Exception e) {
            log.warn("Failed to send interview scheduled email for credit transfer {}: {}", creditTransfer.getId(), e.getMessage(), e);
        }
    }

    @Transactional
    public void submitInterviewScore(Integer id, SubmitCreditTransferInterviewScoreRequest request, String teacherId) {
        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertTeacherCanAccessCreditTransfer(creditTransfer, teacherId);

        if (creditTransfer.getStatus() != CreditTransferStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Yêu cầu chưa được xếp lịch vấn đáp");
        }

        if (!isBlank(creditTransfer.getInterviewTeacherId()) && !teacherId.equals(creditTransfer.getInterviewTeacherId())) {
            throw new RuntimeException("Chỉ giáo viên đã xếp lịch mới được chấm vấn đáp");
        }

        validateScoreRange(request.getInterviewScore(), "Điểm vấn đáp");

        Double certificateScore = resolveCertificateScore(creditTransfer);
        if (certificateScore == null) {
            throw new RuntimeException("Không tìm thấy điểm chứng chỉ final_score cho sinh viên này");
        }

        validateScoreRange(certificateScore, "Điểm trung bình chứng chỉ");

        EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
        double certificateWeight = equivalentCourse.getCertificateWeight() != null ? equivalentCourse.getCertificateWeight() : DEFAULT_CERTIFICATE_WEIGHT;
        double interviewWeight = equivalentCourse.getInterviewWeight() != null ? equivalentCourse.getInterviewWeight() : DEFAULT_INTERVIEW_WEIGHT;
        double approvalThreshold = equivalentCourse.getApprovalThreshold() != null ? equivalentCourse.getApprovalThreshold() : DEFAULT_APPROVAL_THRESHOLD;

        double decisionScore = (certificateScore * certificateWeight) + (request.getInterviewScore() * interviewWeight);

        creditTransfer.setInterviewTeacherId(teacherId);
        creditTransfer.setCertificateScore(certificateScore);
        creditTransfer.setInterviewScore(request.getInterviewScore());
        creditTransfer.setInterviewFeedback(request.getInterviewFeedback());
        if (!isBlank(request.getInterviewEvidenceUrl())) {
            creditTransfer.setInterviewEvidenceUrl(request.getInterviewEvidenceUrl().trim());
        }
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
    public String uploadInterviewEvidence(Integer id, MultipartFile file, String teacherId) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn video minh chứng");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.startsWith("video/")) {
            throw new RuntimeException("File minh chứng phải là video");
        }

        CreditTransfer creditTransfer = creditTransferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review request not found"));

        assertTeacherCanAccessCreditTransfer(creditTransfer, teacherId);

        if (creditTransfer.getStatus() != CreditTransferStatus.INTERVIEW_SCHEDULED
                && creditTransfer.getStatus() != CreditTransferStatus.INTERVIEW_SCORED) {
            throw new RuntimeException("Yêu cầu không thể nộp minh chứng ở trạng thái hiện tại");
        }

        if (!isBlank(creditTransfer.getInterviewTeacherId()) && !teacherId.equals(creditTransfer.getInterviewTeacherId())) {
            throw new RuntimeException("Chỉ giáo viên đã xếp lịch mới được nộp minh chứng");
        }

        Map<String, String> uploadResult = fileHandlerRepository.uploadFile(file);
        String uploadedUrl = uploadResult != null ? uploadResult.get("url") : null;
        if (isBlank(uploadedUrl)) {
            throw new RuntimeException("Upload video minh chứng thất bại");
        }

        creditTransfer.setInterviewTeacherId(teacherId);
        creditTransfer.setInterviewEvidenceUrl(uploadedUrl);
        creditTransferRepository.save(creditTransfer);

        return uploadedUrl;
    }

    @Transactional
    public void createCreditTransfer(CreateCreditTransferRequest request, String studentId, String studentName) {
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
        creditTransfer.setEducationalUnitName(request.getEducationalUnitName() != null ? request.getEducationalUnitName() : 
            (equivalentCourse.getSourceCourse() != null && equivalentCourse.getSourceCourse().getCourse() != null && equivalentCourse.getSourceCourse().getCourse().getEducationalUnit() != null) 
            ? equivalentCourse.getSourceCourse().getCourse().getEducationalUnit().getName() : "Unknown");
        
        creditTransfer.setStatus(CreditTransferStatus.PENDING);
        creditTransfer.setRequestDate(LocalDateTime.now());

        CreditTransfer saved = creditTransferRepository.save(creditTransfer);
        sendCreatedNotifications(saved);
        sendCreatedEmailNotification(saved);
    }

    @Transactional(readOnly = true)
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

    private CreditTransferResponse toResponseWithCertificateScore(CreditTransfer creditTransfer) {
        CreditTransferResponse response = creditTransferMapper.toResponse(creditTransfer);
        response.setStudentId(resolveStudentCode(creditTransfer.getIdStudent()));
        if (response.getCertificateScore() == null) {
            response.setCertificateScore(resolveCertificateScore(creditTransfer));
        }
        response.setInterviewEvidenceUrl(creditTransfer.getInterviewEvidenceUrl());
        return response;
    }

    private String resolveStudentCode(String userId) {
        if (isBlank(userId)) {
            return userId;
        }

        try {
            StudentResponse student = studentRepository.getStudentById(userId).getResult();
            if (student != null && !isBlank(student.getStudentId())) {
                return student.getStudentId();
            }
        } catch (Exception ex) {
            log.warn("Failed to resolve student code for userId {}: {}", userId, ex.getMessage());
        }

        return userId;
    }

    private Double resolveCertificateScore(CreditTransfer creditTransfer) {
        EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
        if (equivalentCourse == null || equivalentCourse.getSourceCourse() == null) {
            return null;
        }

        Integer publishedCourseId = equivalentCourse.getSourceCourse().getId();
        if (publishedCourseId == null) {
            return null;
        }

        return certificateRepository.findByUserIdAndPublishedCourse_Id(creditTransfer.getIdStudent(), publishedCourseId)
                .map(Certificate::getFinalScore)
                .orElse(null);
    }

    private void sendDecisionNotification(CreditTransfer creditTransfer, boolean approved) {
        try {
            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";

            String message;
            String type;
            if (approved) {
                type = "CREDIT_TRANSFER_APPROVED";
                message = "Yêu cầu quy đổi tín chỉ cho môn " + targetCourseName + " đã được duyệt.";
            } else {
                type = "CREDIT_TRANSFER_REJECTED";
                String reasonSuffix = isBlank(creditTransfer.getRejectionReason())
                        ? ""
                        : " Lý do: " + creditTransfer.getRejectionReason();
                message = "Yêu cầu quy đổi tín chỉ cho môn " + targetCourseName + " đã bị từ chối." + reasonSuffix;
            }

            notificationRepository.sendNotification(NotificationMessage.builder()
                    .userId(creditTransfer.getIdStudent())
                    .type(type)
                    .message(message)
                    .link("/student/credit-transfers")
                    .data(buildCreditTransferData(creditTransfer, targetCourse))
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send decision notification for credit transfer {}: {}", creditTransfer.getId(), e.getMessage(), e);
        }
    }

    private void sendDecisionEmailNotification(CreditTransfer creditTransfer, boolean approved) {
        try {
            UserResponse student = userInfoApi.getUserInfo(creditTransfer.getIdStudent()).getResult();
            if (student == null || isBlank(student.getEmail())) {
                log.warn("Skipping decision email because student email is missing for request {}", creditTransfer.getId());
                return;
            }

            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";

            String decisionStatus = approved ? "Được duyệt" : "Bị từ chối";
            String decisionTime = creditTransfer.getApprovedDate() != null
                    ? creditTransfer.getApprovedDate().format(DECISION_TIME_FORMATTER)
                    : "Chưa cập nhật";
            String decisionReason = approved
                    ? "Yêu cầu đã đạt ngưỡng xét duyệt theo quy định."
                    : (isBlank(creditTransfer.getRejectionReason()) ? "Không có lý do cụ thể." : creditTransfer.getRejectionReason());

            emailService.sendCreditTransferDecisionEmailAsync(
                    student.getEmail(),
                    student.getFirstName(),
                    creditTransfer.getStudentName(),
                    targetCourseName,
                    decisionStatus,
                    decisionTime,
                    decisionReason
            );
        } catch (Exception e) {
            log.warn("Failed to send decision email for credit transfer {}: {}", creditTransfer.getId(), e.getMessage(), e);
        }
    }

    private void sendCreatedNotifications(CreditTransfer creditTransfer) {
        try {
            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            Integer educationalUnitId = targetCourse != null && targetCourse.getEducationalUnit() != null
                    ? targetCourse.getEducationalUnit().getId()
                    : null;

            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";

            try {
                notificationRepository.sendNotification(NotificationMessage.builder()
                        .userId(creditTransfer.getIdStudent())
                        .type("CREDIT_TRANSFER_REQUEST_CREATED")
                        .message("Bạn đã gửi thành công yêu cầu quy đổi tín chỉ cho môn " + targetCourseName + ".")
                        .link("/student/credit-transfers")
                        .data(buildCreditTransferData(creditTransfer, targetCourse))
                        .build());
            } catch (Exception ex) {
                log.warn("Failed to notify student for credit transfer {}: {}", creditTransfer.getId(), ex.getMessage());
            }

            if (educationalUnitId != null) {
                try {
                    var experts = expertRepository.getExpertsByEducationalUnitNoPage(educationalUnitId).getResult();
                    if (experts != null) {
                        for (ExpertResponse expert : experts) {
                            if (expert == null || isBlank(expert.getId())) {
                                continue;
                            }

                            notificationRepository.sendNotification(NotificationMessage.builder()
                                    .userId(expert.getId())
                                    .type("CREDIT_TRANSFER_REQUESTED")
                                    .message("Có yêu cầu quy đổi tín chỉ mới cho môn " + targetCourseName + ". Vui lòng kiểm tra và duyệt hồ sơ.")
                                    .link("/expert/credit-transfers")
                                    .data(buildCreditTransferData(creditTransfer, targetCourse))
                                    .build());
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to notify experts for credit transfer {}: {}", creditTransfer.getId(), ex.getMessage());
                }
            }

            if (targetCourse != null && !isBlank(targetCourse.getIdTeacher())) {
                try {
                    TeacherResponse teacher = teacherRepository.getTeacherByTeacherId(targetCourse.getIdTeacher()).getResult();
                    if (teacher != null && !isBlank(teacher.getId())) {
                        notificationRepository.sendNotification(NotificationMessage.builder()
                                .userId(teacher.getId())
                                .type("CREDIT_TRANSFER_NEEDS_SCHEDULE")
                                .message("Sinh viên vừa gửi yêu cầu quy đổi cho môn " + targetCourseName + ". Vui lòng sắp lịch vấn đáp.")
                                .link("/teacher/credit-transfers")
                                .data(buildCreditTransferData(creditTransfer, targetCourse))
                                .build());
                    }
                } catch (Exception ex) {
                    log.warn("Failed to notify teacher for credit transfer {}: {}", creditTransfer.getId(), ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to send credit transfer notifications for request {}", creditTransfer.getId(), e);
        }
    }

    private Map<String, Object> buildCreditTransferData(CreditTransfer creditTransfer, Course targetCourse) {
        Map<String, Object> data = new HashMap<>();
        data.put("creditTransferId", creditTransfer.getId());

        EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
        if (equivalentCourse != null && equivalentCourse.getId() != null) {
            data.put("equivalentCourseId", equivalentCourse.getId());
        }

        if (targetCourse != null) {
            if (targetCourse.getId() != null) {
                data.put("targetCourseId", targetCourse.getId());
            }
            if (targetCourse.getCourseName() != null) {
                data.put("targetCourseName", targetCourse.getCourseName());
            }
        }

        return data;
    }

    private void sendCreatedEmailNotification(CreditTransfer creditTransfer) {
        try {
            UserResponse student = userInfoApi.getUserInfo(creditTransfer.getIdStudent()).getResult();
            if (student == null || isBlank(student.getEmail())) {
                log.warn("Skipping credit transfer email because student email is missing for request {}", creditTransfer.getId());
                return;
            }

            EquivalentCourse equivalentCourse = creditTransfer.getEquivalentCourse();
            Course targetCourse = equivalentCourse != null ? equivalentCourse.getTargetCourse() : null;
            String targetCourseName = targetCourse != null ? targetCourse.getCourseName() : "môn học đích";

            emailService.sendCreditTransferRequestCreatedEmailAsync(
                    student.getEmail(),
                    student.getFirstName(),
                    creditTransfer.getStudentName(),
                    targetCourseName,
                    creditTransfer.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send credit transfer email for request {}: {}", creditTransfer.getId(), e.getMessage(), e);
        }
    }
}
