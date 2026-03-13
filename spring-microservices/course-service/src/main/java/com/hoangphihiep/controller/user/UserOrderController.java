package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/orders")
@RequiredArgsConstructor
public class UserOrderController {

    private final OrderService orderService;

    @GetMapping
    public ApiResponse<?> getHistoryOrders() {
        return ApiResponse.success(orderService.getHistoryOrders(), "Get history orders successfully");
    }

    @PostMapping("/refund/{orderItemId}")
    public ApiResponse<?> refundCourse(@PathVariable Integer orderItemId) {
        orderService.refundCourse(orderItemId);
        return ApiResponse.success(null, "Refund request processed successfully");
    }
}
