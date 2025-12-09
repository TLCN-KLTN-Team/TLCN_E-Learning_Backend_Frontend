package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderPreviewResponse {
    List<CourseItem> items;
    String originalPrice;
    String totalPrice;
    BigDecimal amount;
    String discountedPrice;

    @Data
    @AllArgsConstructor
    @Builder
    public static class CourseItem {
        private Integer id;
        private String courseName;
        private String price;
        private BigDecimal amount;
        private String discountedPrice;
        private String imageUrl;
    }
}
