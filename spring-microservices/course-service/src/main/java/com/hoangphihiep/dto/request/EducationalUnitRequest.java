package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationalUnitRequest {
    private String idAdmin;
    private String name;
    private String type;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String description;
    private Integer establishedYear;
}
