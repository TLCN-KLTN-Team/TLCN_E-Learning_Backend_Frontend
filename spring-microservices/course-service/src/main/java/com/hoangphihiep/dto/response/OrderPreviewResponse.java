package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderPreviewResponse {
    List<CourseItem> items;
    String amount;
    String discountedPrice;

    @Data
    @AllArgsConstructor
    @Builder
    public static class CourseItem {
        private Long id;
        private String name;
        private String price;
        private String discountedPrice;
        private String imageUrl;
    }
}
