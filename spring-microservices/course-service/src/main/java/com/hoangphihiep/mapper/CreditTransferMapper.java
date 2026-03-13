package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CreditTransferResponse;
import com.hoangphihiep.entity.CreditTransfer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CreditTransferMapper {

    @Mapping(source = "idStudent", target = "studentId")
    @Mapping(source = "equivalentCourse.id", target = "equivalentCourseId")
    @Mapping(source = "equivalentCourse.requirements", target = "equivalentCourseRequirements")
    @Mapping(source = "equivalentCourse.description", target = "equivalentCourseDescription")
    // Assuming sourceCourse and targetCourse fields in Entity might still be populated or derived from EquivalentCourse
    @Mapping(source = "equivalentCourse.sourceCourse.courseName", target = "sourceCourseName")
    @Mapping(source = "equivalentCourse.sourceCourse.id", target = "sourceCourseId")
    @Mapping(source = "equivalentCourse.targetCourse.courseName", target = "targetCourseName")
    @Mapping(source = "equivalentCourse.targetCourse.id", target = "targetCourseId")
    CreditTransferResponse toResponse(CreditTransfer entity);
}
