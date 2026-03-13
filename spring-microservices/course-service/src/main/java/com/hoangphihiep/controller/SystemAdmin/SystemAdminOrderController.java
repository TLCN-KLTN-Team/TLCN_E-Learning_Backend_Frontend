package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/super-admin/orders")
@RequiredArgsConstructor
public class SystemAdminOrderController {

    private final OrderService orderService;

    @GetMapping("/refunded")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<?> getRefundedOrders() {
        return ApiResponse.success(orderService.getRefundedOrderItems(), "Get refunded orders successfully");
    }
}
