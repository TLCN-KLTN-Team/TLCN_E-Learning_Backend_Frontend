package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.request.CreditTransferApprovalRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.service.CreditTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expert/credit-transfers")
@RequiredArgsConstructor
public class CreditTransferController {

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

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Integer id, @RequestBody CreditTransferApprovalRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        creditTransferService.approveCreditTransfer(id, request.getNote(), currentUserId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Phê duyệt thành công")
                .build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Integer id, @RequestBody CreditTransferApprovalRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        creditTransferService.rejectCreditTransfer(id, request.getRejectionReason(), currentUserId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã từ chối yêu cầu")
                .build());
    }
}
