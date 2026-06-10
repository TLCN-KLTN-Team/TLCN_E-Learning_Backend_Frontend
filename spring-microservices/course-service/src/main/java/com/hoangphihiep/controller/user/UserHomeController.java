package com.hoangphihiep.controller.user;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.UserPublishedCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Phiên bản yêu cầu đăng nhập của các danh sách khóa học trang chủ ({@code /anonymous/home/courses/**}).
 * Khi người dùng đã đăng nhập, frontend gọi các endpoint này (kèm Authorization header) để service
 * lọc bỏ những khóa học người dùng đã sở hữu. Khách vãng lai vẫn dùng HomeController ẩn danh.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/user/home")
public class UserHomeController {
    private final UserPublishedCourseService userPublishedCourseService;

    @GetMapping("/courses/ratings")
    public ApiResponse<?> getCoursesFollowRatings() {
        return ApiResponse.success(
                userPublishedCourseService.getCoursesByRating(),
                "Lay danh sach khoa hoc theo rating thanh cong"
        );
    }

    @GetMapping("/courses/best-sellers")
    public ApiResponse<?> getCoursesBestSeller() {
        return ApiResponse.success(
                userPublishedCourseService.getTop12BestSellingCourses(),
                "Lay danh sach khoa hoc theo top best seller thanh cong"
        );
    }
}
