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
        String userAvatar = null;

        try {
            UserResponse userResponse = userInfoApi.getUserInfo(review.getCreatedById()).getResult();
            if (userResponse != null) {
                String fullName = "";
                if (userResponse.getLastName() != null && !userResponse.getLastName().trim().isEmpty()) {
                    fullName += userResponse.getLastName().trim();
                }
                if (userResponse.getFirstName() != null && !userResponse.getFirstName().trim().isEmpty()) {
                    if (!fullName.isEmpty()) fullName += " ";
                    fullName += userResponse.getFirstName().trim();
                }
                
                if (!fullName.isEmpty()) {
                    userName = fullName;
                } else if (userResponse.getUsername() != null) {
                    userName = userResponse.getUsername();
                }
                
                userAvatar = userResponse.getAvatarUrl();
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
            .createdByAvatar(userAvatar)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
