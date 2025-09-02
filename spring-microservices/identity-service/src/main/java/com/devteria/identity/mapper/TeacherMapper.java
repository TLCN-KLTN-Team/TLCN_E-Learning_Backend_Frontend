package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.TeacherRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.entity.Teacher;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TeacherMapper {

    @Mapping(source = "idDepartment", target = "departmentId")
    @Mapping(source = "idEducational", target = "educationalUnitId")
    TeacherResponse toTeacherResponse(Teacher teacher);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(source = "departmentId", target = "idDepartment")
    @Mapping(source = "educationalUnitId", target = "idEducational")
    void updateTeacher(@MappingTarget Teacher teacher, TeacherRequest request);

    List<TeacherResponse> toTeacherResponseList(List<Teacher> teachers);
}
