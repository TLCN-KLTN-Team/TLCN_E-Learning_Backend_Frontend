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

    // URL on cloud
    private String logo;
    public String businessLicense;

    private String description;

    private Integer establishedYear;

    private String status;

    private Date subscriptionStartDate;

    private Date subscriptionEndDate;

    private Date createdAt;

    private Integer totalDepartments;

    private Set<DepartmentResponse> departments;

    // representative info
    private String representativeName;
    private String representativeEmail;
    private String representativePhone;
}
