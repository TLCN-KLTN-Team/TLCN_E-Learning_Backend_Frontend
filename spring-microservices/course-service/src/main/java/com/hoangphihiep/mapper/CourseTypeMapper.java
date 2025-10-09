package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.entity.CourseType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseTypeMapper {
    CourseTypeResponse toCourseTypeResponse(CourseType courseType);

    @Mapping(ignore = true, target = "id")
    CourseType toCourseType(CourseTypeRequest courseTypeRequest);
}
