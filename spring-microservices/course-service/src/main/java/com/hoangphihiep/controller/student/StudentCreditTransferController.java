package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.CreateCreditTransferRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.service.CreditTransferService;
import com.hoangphihiep.service.EquivalentCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/credit-transfers")
@RequiredArgsConstructor
public class StudentCreditTransferController {

    private final CreditTransferService creditTransferService;
    private final EquivalentCourseService equivalentCourseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CreditTransferResponse>>> getMyRequests(
            @PageableDefault(sort = "requestDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        String studentId = SecurityContextHolder.getContext().getAuthentication().getName();
        Page<CreditTransferResponse> result = creditTransferService.getMyCreditTransfers(studentId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<CreditTransferResponse>>builder()
                .result(result)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createRequest(@RequestBody CreateCreditTransferRequest request) {
        String studentId = SecurityContextHolder.getContext().getAuthentication().getName();
        // Ideally get name from Profile/User Service, but for now we might leave it null or try to get from somewhere.
        // In the service, we marked it as Snapshot.
        // For simple implementation, we can pass studentId as name if name is not available in JWT.
        // Or updated Service to fetch name?
        // Let's assume the FE sends the name or we create a user service call.
        // Checking Plan... Plan said "studentName (String) - Optional (snapshotted)".
        // I will pass studentId as name for now, or "Sinh viên " + studentId.
        // Better: Authenticated user principal might have details?
        // Let's keep it simple: studentName = studentId for now, or handle in Service if we had UserRepository.
        
        creditTransferService.createCreditTransfer(request, studentId, studentId); 
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Gửi yêu cầu quy đổi thành công")
                .build());
    }

    @GetMapping("/equivalent-courses")
    public ResponseEntity<ApiResponse<Page<EquivalentCourseResponse>>> getEquivalentCourses(
            @RequestParam(required = false) String keyword,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<EquivalentCourseResponse> result = equivalentCourseService.getAllEquivalentCourses(keyword, null, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<EquivalentCourseResponse>>builder()
                .result(result)
                .build());
    }
}
