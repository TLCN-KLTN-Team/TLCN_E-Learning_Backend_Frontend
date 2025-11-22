package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.CartService;
import com.hoangphihiep.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/carts")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ApiResponse<?> getCart(){
        return ApiResponse.success(
                cartService.getCart(),
                "Get cart successfully"
        );
    }

    @GetMapping("/exist/{courseId}")
    public ApiResponse<?> checkPublishedCourseInCart(@PathVariable Integer courseId){
        return ApiResponse.success(
                cartService.existCourseInCart(courseId),
                "Check published course in cart successfully"
        );
    }

    @PostMapping
    public ApiResponse<?> createCart(){
        cartService.createCart();
        return ApiResponse.builder()
                .message("Create cart successfully")
                .build();
    }

    @PostMapping("/add/{courseId}")
    public ApiResponse<?> addToCart(@PathVariable Integer courseId){
        cartService.addToCart(courseId);
        return ApiResponse.builder()
                .message("Add to cart successfully")
                .build();
    }

    @PostMapping("/remove/{courseId}")
    public ApiResponse<?> removeFromCart(@PathVariable Integer courseId){
        cartService.removeFromCart(courseId);
        return ApiResponse.builder()
                .message("Remove from cart successfully")
                .build();
    }


}
