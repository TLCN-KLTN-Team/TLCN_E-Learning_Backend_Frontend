package com.devteria.identity.mapper;

import com.devteria.identity.dto.request.TeacherCreationRequest;
import com.devteria.identity.dto.request.TeacherUpdateRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.entity.Teacher;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TeacherMapper {

    @Mapping(target = "id", ignore = true)
    Teacher toTeacher(TeacherCreationRequest request);

    TeacherResponse toTeacherResponse(Teacher teacher);

    @Mapping(target = "id", ignore = true)
    void updateTeacher(@MappingTarget Teacher teacher, TeacherUpdateRequest request);
}
