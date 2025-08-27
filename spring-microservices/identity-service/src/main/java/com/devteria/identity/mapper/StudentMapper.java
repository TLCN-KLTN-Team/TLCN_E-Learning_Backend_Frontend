package com.devteria.identity.mapper;

import com.devteria.identity.dto.request.StudentRequest;
import com.devteria.identity.dto.response.StudentResponse;
import com.devteria.identity.entity.Student;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface StudentMapper {

    @Mapping(source = "idDepartment", target = "departmentId")
    @Mapping(source = "idEducational", target = "educationalUnitId")
    StudentResponse toStudentResponse(Student student);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(source = "departmentId", target = "idDepartment")
    @Mapping(source = "educationalUnitId", target = "idEducational")
    void updateStudent(@MappingTarget Student student, StudentRequest request);

    List<StudentResponse> toStudentResponseList(List<Student> students);
}
