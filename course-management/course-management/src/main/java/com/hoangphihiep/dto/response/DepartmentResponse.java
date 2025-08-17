package com.hoangphihiep.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {
    private String id;
    private String name;
    private String description;
}
