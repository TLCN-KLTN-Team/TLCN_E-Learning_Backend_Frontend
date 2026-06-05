package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.SystemRevenueResponse;
import com.hoangphihiep.service.PayoutOrderItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/super-admin/revenue")
@RequiredArgsConstructor
public class SystemAdminRevenueController {
    
    private final PayoutOrderItemService payoutOrderItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<SystemRevenueResponse>> getSystemRevenue() {
        log.info("Getting system revenue");
        SystemRevenueResponse revenue = payoutOrderItemService.getSystemRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get system revenue successfully"));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<SystemRevenueResponse>> getSystemRevenueByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting system revenue from {} to {}", startDate, endDate);
        SystemRevenueResponse revenue = payoutOrderItemService.getSystemRevenueByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get system revenue successfully"));
    }

    @GetMapping("/teachers")
    public ResponseEntity<ApiResponse<?>> getAllTeachersRevenue() {
        log.info("Getting all teachers revenue");
        var revenue = payoutOrderItemService.getAllTeachersRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get teachers revenue successfully"));
    }

    @GetMapping("/teachers/range")
    public ResponseEntity<ApiResponse<?>> getAllTeachersRevenueByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting all teachers revenue from {} to {}", startDate, endDate);
        var revenue = payoutOrderItemService.getAllTeachersRevenueByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get teachers revenue successfully"));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<?>> getAllCoursesRevenue() {
        log.info("Getting all courses revenue");
        var revenue = payoutOrderItemService.getAllCoursesRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get courses revenue successfully"));
    }

    @GetMapping("/courses/range")
    public ResponseEntity<ApiResponse<?>> getAllCoursesRevenueByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting all courses revenue from {} to {}", startDate, endDate);
        var revenue = payoutOrderItemService.getAllCoursesRevenueByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get courses revenue successfully"));
    }

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<?>> getAllAdminsRevenue() {
        log.info("Getting all admins revenue");
        var revenue = payoutOrderItemService.getAllAdminsRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get admins revenue successfully"));
    }
}
