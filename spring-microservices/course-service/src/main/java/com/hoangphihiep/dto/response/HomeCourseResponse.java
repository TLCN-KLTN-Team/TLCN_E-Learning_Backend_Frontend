package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeCourseResponse {
    private String courseName;
    private String authorName;
    private double rating;
    private int numberOfPurchase;
    private String price;
    private String oldPrice;
    private String tag;
}
