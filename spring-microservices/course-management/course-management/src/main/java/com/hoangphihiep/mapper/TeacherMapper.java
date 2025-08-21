package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.request.TeacherRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class TeacherMapper {

    public Map<String, Object> toCreateRequestMap(TeacherRequest request) {
        Map<String, Object> map = new HashMap<>();

        // User information
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", request.getUsername());
        userInfo.put("password", request.getPassword());
        userInfo.put("firstName", request.getFirstName());
        userInfo.put("lastName", request.getLastName());
        userInfo.put("email", request.getEmail());
        userInfo.put("dob", request.getDob());

        // Teacher specific information
        Map<String, Object> teacherInfo = new HashMap<>();
        teacherInfo.put("teacherId", request.getTeacherId());
        teacherInfo.put("departmentId", request.getDepartmentId());
        teacherInfo.put("educationalUnitId", request.getEducationalUnitId());
        teacherInfo.put("description", request.getDescription());
        teacherInfo.put("socialUrl", request.getSocialUrl());
        teacherInfo.put("bankAccountNumber", request.getBankAccountNumber());

        map.put("user", userInfo);
        map.put("teacher", teacherInfo);

        return map;
    }

    public Map<String, Object> toUpdateRequestMap(TeacherRequest request) {
        Map<String, Object> map = new HashMap<>();

        // User information
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("firstName", request.getFirstName());
        userInfo.put("lastName", request.getLastName());
        userInfo.put("email", request.getEmail());
        userInfo.put("dob", request.getDob());

        // Teacher specific information
        Map<String, Object> teacherInfo = new HashMap<>();
        teacherInfo.put("teacherId", request.getTeacherId());
        teacherInfo.put("departmentId", request.getDepartmentId());
        teacherInfo.put("educationalUnitId", request.getEducationalUnitId());
        teacherInfo.put("description", request.getDescription());
        teacherInfo.put("socialUrl", request.getSocialUrl());
        teacherInfo.put("bankAccountNumber", request.getBankAccountNumber());

        map.put("user", userInfo);
        map.put("teacher", teacherInfo);

        return map;
    }
}
