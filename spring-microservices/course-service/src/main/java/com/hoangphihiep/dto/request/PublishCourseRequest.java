package com.hoangphihiep.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishCourseRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Course type ID is required")
    private Integer courseTypeId;

    @NotNull(message = "Course detail is required")
    private CourseDetailRequest courseDetail;

    @NotNull(message = "Course price is required")
    @Min(value = 0, message = "Course price must be greater than or equal to 0")
    private BigDecimal coursePrice;

    private String note; // Ghi chú khi gửi duyệt
}