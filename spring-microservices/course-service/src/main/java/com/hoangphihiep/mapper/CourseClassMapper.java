package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseClassResponse;
import com.hoangphihiep.entity.CourseClass;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourseClassMapper {

    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.courseName", target = "courseName")
    CourseClassResponse toCourseClassResponse(CourseClass courseClass);

    List<CourseClassResponse> toCourseClassResponseList(List<CourseClass> courseClasses);
}