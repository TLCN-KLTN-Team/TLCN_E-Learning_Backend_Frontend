package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.WishlistResponse;
import com.hoangphihiep.entity.Cart;
import com.hoangphihiep.entity.FavoriteCourse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.CartRepository;
import com.hoangphihiep.repository.FavoriteCourseRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final FavoriteCourseRepository favoriteCourseRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final CartRepository cartRepository;

    public WishlistResponse getWishlist() {
        this.removeCoursesInCartOrInOrder();
        FavoriteCourse favoriteCourse = this.getEntity();
        List<WishlistResponse.Course> courses = favoriteCourse.getCourses().stream()
                .map(course -> WishlistResponse.Course.builder()
                        .courseId(course.getId())
                        .courseName(course.getCourseName())
                        .authorName(course.getAuthorName())
                        .rating(4.5)
                        .duration(10)
                        .originalPrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .currentPrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .build()
                ).toList();

        return WishlistResponse.builder()
                .courses(courses)
                .build();
    }

    public FavoriteCourse getEntity(){
        String userId = JwtUtils.getCurrentUserId();
        FavoriteCourse favoriteCourse = favoriteCourseRepository.findByUserId(userId)
                .orElse(null);
        if (favoriteCourse == null){
            favoriteCourse = this.createWishlist();
            favoriteCourse = favoriteCourseRepository.save(favoriteCourse);
        }
        return favoriteCourse;
    }

    public FavoriteCourse createWishlist() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        FavoriteCourse wishlist = favoriteCourseRepository.findByUserId(userId)
                .orElse(new FavoriteCourse());
        if (wishlist.getId() != null) {
            throw new AppException(ErrorCode.CART_ALREADY_EXISTS);
        }
        wishlist.setIdUser(userId);
        return favoriteCourseRepository.save(wishlist);
    }
    private PublishedCourse getPublishedCourse(Integer courseId) {
        return publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));
    }

    public boolean existCourseInWishlist(Integer courseId) {
        PublishedCourse course = this.getPublishedCourse(courseId);
        FavoriteCourse favoriteCourse = this.getEntity();

        return favoriteCourse.getCourses().contains(course);
    }

    public void addToWishlist(Integer courseId){
        PublishedCourse course = publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        FavoriteCourse favoriteCourse = favoriteCourseRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElse(null);
        if (favoriteCourse == null){
            favoriteCourse = this.createWishlist();
        }
        if (favoriteCourse.getCourses().contains(course)){
            throw new AppException(ErrorCode.COURSE_ALREADY_IN_WISHLIST);
        }

        favoriteCourse.addCourse(course);
        favoriteCourseRepository.save(favoriteCourse);
    }

    public void removeFromWishlist(Integer courseId){
        PublishedCourse course = publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        FavoriteCourse favoriteCourse = this.getEntity();
        if (!favoriteCourse.getCourses().contains(course)){
            throw new AppException(ErrorCode.COURSE_NOT_IN_WISHLIST);
        }

        favoriteCourse.removeCourse(course);
        favoriteCourseRepository.save(favoriteCourse);
    }

    public void removeCoursesInCartOrInOrder() {
        List<PublishedCourse> courses = new ArrayList<>();
        Cart cart = cartRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElse(null);
        if (cart != null) {
            courses.addAll(cart.getCourses());
        }

        courses.forEach(course -> this.removeFromWishlist(course.getId()));
    }

}
