package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.entity.EducationalUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = { SectionMapper.class })
public interface CourseMapper {
    @Mapping(source = "educationalUnit.id", target = "idEducationalUnit")
    CourseResponse toCourseResponse(Course course);
}
