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

    // Mapping chính - bỏ qua institution để tránh circular reference
    @Mapping(source = "courseType", target = "courseType")
    @Mapping(source = "sections", target = "sections")
    @Mapping(target = "institution", ignore = true) // QUAN TRỌNG: Bỏ qua institution
    CourseResponse toCourseResponse(Course course);

    // Mapping riêng cho trường hợp cần institution info (không bao gồm courses)
    @Named("courseWithBasicInstitution")
    @Mapping(source = "courseType", target = "courseType")
    @Mapping(source = "sections", target = "sections")
    @Mapping(source = "institution", target = "institution", qualifiedByName = "toBasicEducationalUnit")
    CourseResponse toCourseResponseWithInstitution(Course course);

    // Mapping CourseType
    default CourseTypeResponse mapCourseType(CourseType courseType) {
        if (courseType == null) return null;
        return CourseTypeResponse.builder()
                .id(courseType.getId())
                .courseTypeName(courseType.getCourseTypeName())
                .build();
    }

    // Mapping EducationalUnit cơ bản (không có courses)
    @Named("toBasicEducationalUnit")
    @Mapping(target = "departments", ignore = true)
    @Mapping(target = "totalDepartments", ignore = true)
    EducationalUnitResponse toBasicEducationalUnitResponse(EducationalUnit educationalUnit);
}
