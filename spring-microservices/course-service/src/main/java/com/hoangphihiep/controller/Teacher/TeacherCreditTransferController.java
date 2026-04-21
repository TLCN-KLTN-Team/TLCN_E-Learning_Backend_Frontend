package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.request.ScheduleCreditTransferInterviewRequest;
import com.hoangphihiep.dto.request.SubmitCreditTransferInterviewScoreRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.service.CreditTransferService;
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

        @GetMapping
        public ResponseEntity<ApiResponse<Page<CreditTransferResponse>>> search(
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String keyword,
                        @PageableDefault(sort = "requestDate", direction = Sort.Direction.DESC) Pageable pageable
        ) {
                Page<CreditTransferResponse> result = creditTransferService.searchCreditTransfers(status, keyword, pageable);
                return ResponseEntity.ok(ApiResponse.<Page<CreditTransferResponse>>builder()
                                .result(result)
                                .build());
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<CreditTransferResponse>> getDetail(@PathVariable Integer id) {
                return ResponseEntity.ok(ApiResponse.<CreditTransferResponse>builder()
                                .result(creditTransferService.getCreditTransferById(id))
                                .build());
        }

    @PostMapping("/{id}/interview/schedule")
    public ResponseEntity<ApiResponse<Void>> scheduleInterview(
            @PathVariable Integer id,
            @RequestBody ScheduleCreditTransferInterviewRequest request
    ) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
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
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
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
                String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
                String uploadedUrl = creditTransferService.uploadInterviewEvidence(id, file, teacherId);

                return ResponseEntity.ok(ApiResponse.<String>builder()
                                .result(uploadedUrl)
                                .message("Đã tải lên video minh chứng")
                                .build());
        }
}
