package com.devteria.identity.mapper;


import com.devteria.identity.entity.AccountStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.devteria.identity.dto.response.StudentResponse;
import com.devteria.identity.entity.Student;

@Mapper(componentModel = "spring")
public interface StudentMapper {

    @Mapping(source = "idDepartment", target = "departmentId")
    @Mapping(source = "idEducational", target = "educationalUnitId")
    @Mapping(source = "accountStatus", target = "accountStatus")
    StudentResponse toStudentResponse(Student student);

    default String mapAccountStatus(AccountStatus accountStatus) {
        return accountStatus != null ? accountStatus.name() : null;
    }
}
