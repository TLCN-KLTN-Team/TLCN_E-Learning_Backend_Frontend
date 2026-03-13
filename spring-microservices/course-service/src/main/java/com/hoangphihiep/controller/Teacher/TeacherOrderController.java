package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/teacher/orders")
@RequiredArgsConstructor
public class TeacherOrderController {

    private final OrderService orderService;

    @GetMapping
    public ApiResponse<?> getTeacherOrders() {
        return ApiResponse.success(orderService.getTeacherOrders(), "Get teacher orders successfully");
    }
}
