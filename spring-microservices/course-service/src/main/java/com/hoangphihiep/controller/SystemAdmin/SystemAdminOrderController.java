package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/super-admin/orders")
@RequiredArgsConstructor
public class SystemAdminOrderController {

    private final OrderService orderService;

    @GetMapping("/pending-refund")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<?> getPendingRefunds() {
        return ApiResponse.success(orderService.getPendingRefundItems(), "Get pending refund requests successfully");
    }

    @GetMapping("/refunded")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<?> getRefundedOrders() {
        return ApiResponse.success(orderService.getRefundedOrderItems(), "Get refunded orders successfully");
    }

    @PostMapping("/approve-refund/{orderItemId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<?> approveRefund(@PathVariable Integer orderItemId) {
        orderService.approveRefund(orderItemId);
        return ApiResponse.success(null, "Refund approved successfully");
    }
}
