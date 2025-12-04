package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.ReviewResponse;
import com.hoangphihiep.dto.response.UserResponse;
import com.hoangphihiep.entity.Review;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewMapper {
    UserInfoApi userInfoApi;
    
    public ReviewResponse toReviewResponse(Review review) {
        String userName = review.getCreatedById();

        try {
            UserResponse userResponse = userInfoApi.getUserInfo(review.getCreatedById()).getResult();
            if (userResponse != null) {
                userName = userResponse.getUsername();
                System.out.println("tên của user: " + userName);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user info for userId: {}, error: {}", review.getCreatedById(), e.getMessage());
        }
        
        return ReviewResponse.builder()
                .id(review.getId())
                .rate(review.getRate())
                .content(review.getContent())
                .courseId(review.getCourse().getId())
                .courseName(review.getCourse().getCourseName())
                .createdById(review.getCreatedById())
                .createdByName(userName)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
