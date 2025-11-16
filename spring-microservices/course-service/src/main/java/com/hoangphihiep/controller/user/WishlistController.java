package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wishlists")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<?> getWishlist(){
        return ApiResponse.success(
                wishlistService.getWishlist(),
                "Get wishlist successfully"
        );
    }

    @GetMapping("/exist/{courseId}")
    public ApiResponse<?> checkPublishedCourseInWishlist(@PathVariable Integer courseId){
        return ApiResponse.success(
                wishlistService.existCourseInWishlist(courseId),
                "Check published course in wishlist successfully"
        );
    }

    @PostMapping("/add/{courseId}")
    public ApiResponse<?> addToWishlist(@PathVariable Integer courseId){
        wishlistService.addToWishlist(courseId);
        return ApiResponse.builder()
                .message("Add to wishlist successfully")
                .build();
    }

    @PostMapping("/remove/{courseId}")
    public ApiResponse<?> removeFromWishlist(@PathVariable Integer courseId){
        wishlistService.removeFromWishlist(courseId);
        return ApiResponse.builder()
                .message("Remove from wishlist successfully")
                .build();
    }
}
