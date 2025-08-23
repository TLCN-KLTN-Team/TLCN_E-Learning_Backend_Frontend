package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = { SectionMapper.class })
public interface CourseMapper {

    @Mapping(source = "courseType", target = "courseType")
    @Mapping(source = "sections", target = "sections")
    @Mapping(target = "reviewsCount", expression = "java(course.getReview() != null ? course.getReview().size() : 0)")
    CourseResponse toCourseResponse(Course course);

    // map CourseType → CourseTypeResponse
    default CourseTypeResponse mapCourseType(CourseType courseType) {
        if (courseType == null) return null;
        return CourseTypeResponse.builder()
                .id(courseType.getId())
                .courseTypeName(courseType.getCourseTypeName())
                .build();
    }
}
