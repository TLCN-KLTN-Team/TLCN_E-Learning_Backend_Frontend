package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseObjectiveResponse;
import com.hoangphihiep.entity.CourseObjective;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourseObjectiveMapper {

    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.courseName", target = "courseName")
    CourseObjectiveResponse toCourseObjectiveResponse(CourseObjective objective);

    List<CourseObjectiveResponse> toCourseObjectiveResponseList(List<CourseObjective> objectives);
}