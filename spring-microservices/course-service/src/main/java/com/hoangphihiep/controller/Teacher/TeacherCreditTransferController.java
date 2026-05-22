package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.ScheduleCreditTransferInterviewRequest;
import com.hoangphihiep.dto.request.SubmitCreditTransferInterviewScoreRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.service.CreditTransferService;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/teacher/credit-transfers")
@RequiredArgsConstructor
public class TeacherCreditTransferController {

    private final CreditTransferService creditTransferService;
        private final TeacherRepository teacherRepository;

        private String resolveCurrentTeacherId() {
                String userId = SecurityContextHolder.getContext().getAuthentication().getName();
                TeacherResponse teacher = teacherRepository.getTeacherByUserId(userId).getResult();

                if (teacher == null || teacher.getTeacherId() == null || teacher.getTeacherId().trim().isEmpty()) {
                        throw new RuntimeException("Không thể xác định giáo viên hiện tại");
                }

                return teacher.getTeacherId();
        }

        @GetMapping
        public ResponseEntity<ApiResponse<Page<CreditTransferResponse>>> search(
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String keyword,
                        @PageableDefault(sort = "requestDate", direction = Sort.Direction.DESC) Pageable pageable
        ) {
                                String teacherId = resolveCurrentTeacherId();
                Page<CreditTransferResponse> result = creditTransferService.searchTeacherCreditTransfers(status, keyword, teacherId, pageable);
                return ResponseEntity.ok(ApiResponse.<Page<CreditTransferResponse>>builder()
                                .result(result)
                                .build());
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<CreditTransferResponse>> getDetail(@PathVariable Integer id) {
                                String teacherId = resolveCurrentTeacherId();
                return ResponseEntity.ok(ApiResponse.<CreditTransferResponse>builder()
                                .result(creditTransferService.getTeacherCreditTransferById(id, teacherId))
                                .build());
        }

    @PostMapping("/{id}/interview/schedule")
    public ResponseEntity<ApiResponse<Void>> scheduleInterview(
            @PathVariable Integer id,
            @RequestBody ScheduleCreditTransferInterviewRequest request
    ) {
        String teacherId = resolveCurrentTeacherId();
        creditTransferService.scheduleInterview(id, request, teacherId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xếp lịch vấn đáp")
                .build());
    }

    @PostMapping("/{id}/interview/score")
    public ResponseEntity<ApiResponse<Void>> submitInterviewScore(
            @PathVariable Integer id,
            @RequestBody SubmitCreditTransferInterviewScoreRequest request
    ) {
        String teacherId = resolveCurrentTeacherId();
        creditTransferService.submitInterviewScore(id, request, teacherId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã lưu kết quả vấn đáp")
                .build());
    }

        @PostMapping(value = "/{id}/interview/evidence/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<String>> uploadInterviewEvidence(
                        @PathVariable Integer id,
                        @RequestPart("file") MultipartFile file
        ) {
                String teacherId = resolveCurrentTeacherId();
                String uploadedUrl = creditTransferService.uploadInterviewEvidence(id, file, teacherId);

                return ResponseEntity.ok(ApiResponse.<String>builder()
                                .result(uploadedUrl)
                                .message("Đã tải lên video minh chứng")
                                .build());
        }
}
