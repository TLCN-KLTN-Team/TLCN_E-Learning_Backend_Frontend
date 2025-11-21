package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring", uses = { SectionMapper.class })
@Slf4j
public abstract class CourseMapper {
    
    @Autowired
    protected TeacherRepository teacherRepository;
    
    @Mapping(source = "educationalUnit.id", target = "idEducationalUnit")
    public abstract CourseResponse toCourseResponse(Course course);
    
    @AfterMapping
    protected void fetchTeacherInfo(@MappingTarget CourseResponse courseResponse, Course course) {
        if (course.getIdTeacher() != null && !course.getIdTeacher().isEmpty()) {
            try {
                var teacherApiResponse = teacherRepository.getTeacherByUserId(course.getIdTeacher());
                if (teacherApiResponse != null && teacherApiResponse.getResult() != null) {
                    courseResponse.setTeacher(teacherApiResponse.getResult());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch teacher info for teacherId: {}. Error: {}", 
                        course.getIdTeacher(), e.getMessage());
                // Không throw exception, chỉ log warning để không ảnh hưởng flow chính
            }
        }
    }
}
