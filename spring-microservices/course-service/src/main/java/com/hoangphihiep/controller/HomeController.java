package com.hoangphihiep.controller;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.service.EducationalUnitService;
import com.hoangphihiep.service.ReviewService;
import com.hoangphihiep.service.UserPublishedCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/anonymous/home")
public class HomeController {
    private final EducationalUnitService educationalUnitService;
    private final UserPublishedCourseService userPublishedCourseService;
    private final ReviewService reviewService;

    @GetMapping("/courses/ratings")
    public ApiResponse<?> getCoursesFollowRatings(){
        return ApiResponse.success(
                userPublishedCourseService.getCoursesByRating(),
                "Lay danh sach khoa hoc theo rating thanh cong"
        );
    }

    @GetMapping("/courses/best-sellers")
    public ApiResponse<?> getCoursesBestSeller(){
        return ApiResponse.success(
                userPublishedCourseService.getTop12BestSellingCourses(),
                "Lay danh sach khoa hoc theo top best seller thanh cong"
        );
    }

    @GetMapping("/reviews/top5")
    public ApiResponse<?> getTop5Reviews(){
        return ApiResponse.success(
                reviewService.getTop5Reviews(),
                "Lay danh sach 5 review tot nhat thanh cong"
        );
    }

    @GetMapping("/educational-units")
    public ApiResponse<?> getAllEducationalUnits() {
        return ApiResponse.success(
                educationalUnitService.getAllEducationalUnits(),
                "Lay danh sach cac don vi dao tao thanh cong"
        );
    }

    @GetMapping("/educational-units/{id}")
    public ApiResponse<?> getEducationalUnitById(@PathVariable Integer id) {
        return ApiResponse.success(
                educationalUnitService.getEducationalUnitById(id),
                "Lay danh sach cac don vi " + id + " dao tao thanh cong"
        );
    }

    @GetMapping("/educational-units/{id}/teachers")
    public ApiResponse<?> getTeachersByEducationalUnit(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return ApiResponse.success(
                educationalUnitService.getTeachersByEducationalUnitPaged(id, page, size),
                "Lay danh sach giang vien cua don vi dao tao thanh cong"
        );
    }

    @GetMapping("/educational-units/{id}/courses")
    public ApiResponse<?> getCoursesByEducationalUnit(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ApiResponse.success(
                educationalUnitService.getCoursesByEducationalUnitPaged(id, page, size),
                "Lay danh sach khoa hoc cua don vi dao tao thanh cong"
        );
    }
}
