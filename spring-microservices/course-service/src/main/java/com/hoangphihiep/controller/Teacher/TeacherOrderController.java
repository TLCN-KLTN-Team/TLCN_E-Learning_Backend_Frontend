package com.hoangphihiep.controller.Teacher;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/teacher/orders")
@RequiredArgsConstructor
public class TeacherOrderController {

    private final OrderService orderService;

    @GetMapping
    public ApiResponse<?> getTeacherOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        return ApiResponse.success(
                orderService.getTeacherOrders(page, size, search),
                "Get teacher orders successfully"
        );
    }
}
