package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.Order;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.OrderMapper;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.JwtUtils;
import com.hoangphihiep.utils.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserPublishedCourseService {
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final PublishedCourseSearchService publishedCourseSearchService;
    private final TeacherRepository teacherApi;
    private final OrderService orderService;
    private final OrderItemService orderItemService;
    private final OrderMapper orderMapper;

    public List<OrderResponse> getPendingOrders() {
        String userId = JwtUtils.getCurrentUserId();
        List<Order> orders = orderService.getOrdersByUserId();
        List<Order> pendingOrders = orders.stream()
                .filter(order -> order.getOrderStatus().equals(OrderStatus.PENDING))
                .toList();

        return pendingOrders.stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    public List<PublishedCourseProgressResponse> getMyPublishedCourse() {
        List<Order> ordersOfUser = orderService.getOrdersByUserId();
        List<Integer> orderIds = ordersOfUser.stream()
                .map(Order::getId)
                .toList();

        Set<Integer> publishedCourseIds = orderItemService.getPurchasedCourseIdsByListOrderIds(orderIds);
        List<PublishedCourse> purchasedCourses = new ArrayList<>();
        publishedCourseIds.forEach(publishedCourseId -> {
            PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId).orElseThrow(
                    () -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND)
            );
            purchasedCourses.add(publishedCourse);
        });

        List<PublishedCourseProgressResponse> result = purchasedCourses.stream()
                .map(pc -> PublishedCourseProgressResponse.builder()
                        .publishedCourseId(pc.getId())
                        .publishedCourseName(pc.getCourse().getCourseName())
                        .authorName(pc.getAuthorName()) // Placeholder for author name
                        .progressPercentage(0) // Placeholder for progress
                        .build())
                .toList();

        return result;
    }

    public PaginatedResponse<PublishedCourseCardResponse> getPublishedCoursesWithPaging(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PublishedCourse> publishedCourses = publishedCourseRepository.findAll(pageable);
        List<PublishedCourseCardResponse> courseCardResponses = publishedCourses.stream()
                .map(publishedCourse -> {
                    PublishedCourseCardResponse response = PublishedCourseCardResponse.builder()
                            .id(publishedCourse.getId())
                            .courseName(publishedCourse.getCourse().getCourseName())
                            .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                            .authorName("...") // Placeholder for author name
                            .build();

                    return response;
                }).toList();

        return PaginatedResponse.<PublishedCourseCardResponse>builder()
                .content(courseCardResponses)
                .size(pageable.getPageSize())
                .page(pageable.getPageNumber())
                .totalElements(publishedCourses.getTotalElements())
                .totalPages(publishedCourses.getTotalPages())
                .build();
    }

    public PublishedCourseDetailResponse getPublishedCourseDetailById(Integer publishedCourseId){
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId).orElseThrow(
                () -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND)
        );

        return this.toPublishedCourseDetailResponse(publishedCourse);
    }

    private PublishedCourseDetailResponse toPublishedCourseDetailResponse(PublishedCourse publishedCourse) {
        // calculate duration, rating, student count, etc.

        try {
            var teacher = teacherApi.getTeacherByTeacherId(publishedCourse.getCourse().getIdTeacher()).getResult();

            // build contents
//            PublishedCourseContentResponse contentResponse = PublishedCourseContentResponse.builder()
//
//                    .build();

            PublishedCourseDetailResponse response = PublishedCourseDetailResponse.builder()
                    .courseName(publishedCourse.getCourse().getCourseName())
                    .description(publishedCourse.getCourse().getDescription())
                    .authorName(teacher.getFirstName() + " " + teacher.getLastName())
                    .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                    .purchaserStatus(orderService.checkCoursePurchased(publishedCourse.getId()))
                    .build();

            return response;
        } catch (AppException e) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }
    }


}
