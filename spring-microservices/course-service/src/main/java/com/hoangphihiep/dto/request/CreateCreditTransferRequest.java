package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateCreditTransferRequest {
    private Integer equivalentCourseId;
    private String description;
    private String educationalUnitName; // Optional override
}
