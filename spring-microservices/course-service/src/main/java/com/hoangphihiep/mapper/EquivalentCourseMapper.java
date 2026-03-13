package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.request.EquivalentCourseRequest;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.entity.EquivalentCourse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EquivalentCourseMapper {

    @Mapping(source = "sourceCourse.id", target = "sourceCourseId")
    @Mapping(source = "sourceCourse.courseName", target = "sourceCourseName")
    @Mapping(source = "sourceCourse.courseImage", target = "sourceCourseImage")
    @Mapping(source = "sourceCourse.course.educationalUnit.name", target = "sourceEducationalUnit")
    @Mapping(source = "sourceCourse.course.credits", target = "sourceCourseCredits") // Added
    // @Mapping(source = "sourceCourse.course.courseCode", target = "sourceCourseCode") // Field not exists
    @Mapping(source = "targetCourse.id", target = "targetCourseId")
    @Mapping(source = "targetCourse.courseName", target = "targetCourseName")
    @Mapping(source = "targetCourse.credits", target = "targetCourseCredits") // Added
    // @Mapping(source = "targetCourse.courseCode", target = "targetCourseCode") // Field not exists
    EquivalentCourseResponse toResponse(EquivalentCourse entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceCourse", ignore = true)
    @Mapping(target = "targetCourse", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    EquivalentCourse toEntity(EquivalentCourseRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceCourse", ignore = true)
    @Mapping(target = "targetCourse", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntity(@MappingTarget EquivalentCourse entity, EquivalentCourseRequest request);
}
