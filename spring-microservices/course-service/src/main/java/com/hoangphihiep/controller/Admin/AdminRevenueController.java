package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.response.AdminRevenueResponse;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.PayoutOrderItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/admin/revenue")
@RequiredArgsConstructor
public class AdminRevenueController {
    
    private final PayoutOrderItemService payoutOrderItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminRevenueResponse>> getAdminRevenue() {
        log.info("Getting revenue for current admin");
        AdminRevenueResponse revenue = payoutOrderItemService.getAdminRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get admin revenue successfully"));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<AdminRevenueResponse>> getAdminRevenueByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting admin revenue from {} to {}", startDate, endDate);
        AdminRevenueResponse revenue = payoutOrderItemService.getAdminRevenueByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get admin revenue successfully"));
    }
}
