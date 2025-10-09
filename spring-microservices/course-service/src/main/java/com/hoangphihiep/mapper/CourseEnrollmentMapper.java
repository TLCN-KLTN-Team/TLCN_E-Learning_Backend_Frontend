package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseEnrollmentResponse;
import com.hoangphihiep.entity.CourseEnrollment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourseEnrollmentMapper {

    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.courseName", target = "courseName")
    @Mapping(source = "studentId", target = "studentId")
    @Mapping(target = "studentName", ignore = true) // Will be set separately
    CourseEnrollmentResponse toEnrollmentResponse(CourseEnrollment enrollment);

    List<CourseEnrollmentResponse> toEnrollmentResponseList(List<CourseEnrollment> enrollments);
}
