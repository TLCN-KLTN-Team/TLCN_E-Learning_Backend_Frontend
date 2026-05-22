package com.hoangphihiep.controller.student;

import com.hoangphihiep.dto.request.CreateCreditTransferRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
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
    private final UserInfoApi userInfoApi;

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
        
        // Fetch user info to get name
        UserResponse userResponse = userInfoApi.getUserInfo(studentId).getResult();
        String studentName = userResponse.getLastName() + " " + userResponse.getFirstName();

        creditTransferService.createCreditTransfer(request, studentId, studentName); 
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Gửi yêu cầu quy đổi thành công")
                .build());
    }

    @GetMapping("/equivalent-courses")
    public ResponseEntity<ApiResponse<Page<EquivalentCourseResponse>>> getEquivalentCourses(
            @RequestParam(required = false) String keyword,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
                String studentId = SecurityContextHolder.getContext().getAuthentication().getName();
                Integer educationalUnitId = userInfoApi.getStudentEducationalUnit(studentId).getResult();

                if (educationalUnitId == null) {
                        throw new RuntimeException("Không thể xác định đơn vị đào tạo của sinh viên hiện tại");
                }

                Page<EquivalentCourseResponse> result = equivalentCourseService.getAllEquivalentCoursesByEducationalUnit(keyword, null, educationalUnitId, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<EquivalentCourseResponse>>builder()
                .result(result)
                .build());
    }
}
