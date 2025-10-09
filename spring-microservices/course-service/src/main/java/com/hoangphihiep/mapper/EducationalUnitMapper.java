package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.entity.Department;
import com.hoangphihiep.entity.EducationalUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;

@Mapper(componentModel = "spring")
public interface EducationalUnitMapper {

    // Mapping cơ bản không bao gồm courses để tránh circular
    @Mapping(target = "departments", ignore = true)
    @Mapping(target = "totalDepartments", source = "departments", qualifiedByName = "countDepartments")
    EducationalUnitResponse toEducationalUnitResponse(EducationalUnit educationalUnit);

    @Named("countDepartments")
    default Integer countDepartments(Set<Department> departments) {
        return departments != null ? departments.size() : 0;
    }
}
