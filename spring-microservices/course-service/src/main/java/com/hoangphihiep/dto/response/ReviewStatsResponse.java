package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewStatsResponse {
    Double averageRating;
    Long totalReviews;
    RatingDistribution ratingDistribution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class RatingDistribution {
        Long fiveStar;
        Long fourStar;
        Long threeStar;
        Long twoStar;
        Long oneStar;
    }
}
