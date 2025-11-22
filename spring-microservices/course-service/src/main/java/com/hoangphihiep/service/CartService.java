package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.CartResponse;
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

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final FavoriteCourseRepository favoriteCourseRepository;

    public Cart createCart() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Cart cart = cartRepository.findByUserId(userId)
                .orElse(new Cart());
        if (cart.getId() != null) {
            throw new AppException(ErrorCode.CART_ALREADY_EXISTS);
        }
        cart.setIdUser(userId);
        return cartRepository.save(cart);
    }

    public Cart getEntity() {
        return cartRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
    }
    private PublishedCourse getPublishedCourse(Integer courseId) {
        return publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));
    }

    boolean existCart() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        return cart.getId() != null;
    }

    public boolean existCourseInCart(Integer courseId) {
        PublishedCourse course = this.getPublishedCourse(courseId);
        Cart cart = this.getEntity();

        return cart.getCourses().contains(course);
    }

    public void addToCart(Integer courseId){
        PublishedCourse course = publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));
        Cart cart = cartRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElse(null);
        if (cart.getId() == null) {
            cart = this.createCart();
        }

        if (cart.getCourses().contains(course)) {
            throw new AppException(ErrorCode.COURSE_ALREADY_IN_CART);
        }

        cart.addCourse(course);
        cartRepository.save(cart);
    }

    public void removeFromCart(Integer courseId){
        PublishedCourse course = publishedCourseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));
        Cart cart = cartRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        if (!cart.getCourses().contains(course)) {
            throw new AppException(ErrorCode.COURSE_NOT_IN_CART);
        }

        cart.getCourses().remove(course);
        cartRepository.save(cart);
    }

    public CartResponse getCart(){
        Cart cart = cartRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        FavoriteCourse favoriteCourse = favoriteCourseRepository.findByUserId(JwtUtils.getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WISHLIST_NOT_FOUND));

        BigDecimal amount = cart.getCourses().stream()
                .map(PublishedCourse::getCoursePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal originalPrice = amount.multiply(BigDecimal.valueOf(2.5));
        BigDecimal discountedPrice = originalPrice.subtract(amount);

        List<CartResponse.Course> cartCourses = cart.getCourses().stream()
                .map(course -> CartResponse.Course.builder()
                        .courseId(course.getId())
                        .courseName(course.getCourse().getCourseName())
                        .authorName(course.getAuthorName())
//                        .rating(course.getRating())
//                        .duration(course.getDuration())
                        .originalPrice(currencyUtils.formatCurrency(course.getCoursePrice().multiply(BigDecimal.valueOf(2.5))))
                        .currentPrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .build())
                .toList();

        // call favorite here
        List<CartResponse.Course> wishlistCourses = favoriteCourse.getCourses().stream()
                .map(course -> CartResponse.Course.builder()
                        .courseId(course.getId())
                        .courseName(course.getCourseName())
                        .authorName(course.getAuthorName())
                        .rating(4.5)
                        .duration(10)
                        .originalPrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .currentPrice(currencyUtils.formatCurrency(course.getCoursePrice()))
                        .build()
                ).toList();

        return CartResponse.builder()
                .amount(currencyUtils.formatCurrency(amount))
                .originalPrice(currencyUtils.formatCurrency(originalPrice))
                .discountedPrice(currencyUtils.formatCurrency(discountedPrice))
                .cartCourses(cartCourses)
                .favoriteCourses(wishlistCourses)
                .build();
    }

}
