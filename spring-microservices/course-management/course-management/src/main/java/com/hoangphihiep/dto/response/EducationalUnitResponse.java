package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationalUnitResponse {
    private String id;

    private String name;

    private String type;

    private String address;

    private String phone;

    private String email;

    private String website;

    private String logo;

    private String description;

    private Integer establishedYear;

    private String status;

    private String idAdmin;

    private Date subscriptionStartDate;

    private Date subscriptionEndDate;

    private Date createdAt;

    private Integer totalDepartments;

    private Set<DepartmentResponse> departments;
}
