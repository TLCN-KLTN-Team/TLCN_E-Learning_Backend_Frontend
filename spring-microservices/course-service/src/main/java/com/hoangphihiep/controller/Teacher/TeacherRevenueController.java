package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherRevenueResponse;
import com.hoangphihiep.service.PayoutOrderItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/teacher/revenue")
@RequiredArgsConstructor
public class TeacherRevenueController {
    
    private final PayoutOrderItemService payoutOrderItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<TeacherRevenueResponse>> getTeacherRevenue() {
        log.info("Getting revenue for current teacher");
        TeacherRevenueResponse revenue = payoutOrderItemService.getTeacherRevenue();
        System.out.println ("Kết quả trả về: " + revenue);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get teacher revenue successfully"));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<TeacherRevenueResponse>> getTeacherRevenueByRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("Getting teacher revenue from {} to {}", startDate, endDate);
        TeacherRevenueResponse revenue = payoutOrderItemService.getTeacherRevenueByRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(revenue, "Get teacher revenue successfully"));
    }
}
