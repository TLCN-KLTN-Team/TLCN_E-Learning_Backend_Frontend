package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.TeacherRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.entity.Teacher;

@Mapper(componentModel = "spring")
public interface TeacherMapper {

    @Mapping(target = "id", ignore = true)
    Teacher toTeacher(TeacherRequest request);

    TeacherResponse toTeacherResponse(Teacher teacher);

    @Mapping(target = "id", ignore = true)
    void updateTeacher(@MappingTarget Teacher teacher, TeacherRequest request);
}
