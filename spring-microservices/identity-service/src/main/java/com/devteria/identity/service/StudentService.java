package com.devteria.identity.service;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.StudentRequest;
import com.devteria.identity.dto.response.StudentResponse;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.Student;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.StudentMapper;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.StudentRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StudentService {

    StudentRepository studentRepository;
    StudentMapper studentMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.STUDENT_ROLE).ifPresent(roles::add);

        Student student = Student.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dob(request.getDob())
                .roles(roles)
                .studentId(request.getStudentId())
                .idDepartment(request.getDepartmentId() != null ? Integer.parseInt(request.getDepartmentId()) : null)
                .idEducational(request.getEducationalUnitId() != null ? Integer.parseInt(request.getEducationalUnitId()) : null)
                .description(request.getDescription())
                .socialUrl(request.getSocialUrl())
                .className(request.getClassName())
                .build();

        try {
            student = studentRepository.save(student);
            return studentMapper.toStudentResponse(student);
        } catch (DataIntegrityViolationException exception) {
            log.error("Error creating student: {}", exception.getMessage());
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
    }

    public StudentResponse getStudentByStudentId(String studentId) {
        log.info("Getting student by studentId: {}", studentId);
        Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return studentMapper.toStudentResponse(student);
    }

    public Page<StudentResponse> getStudentsByInstitution(int institutionId, String search, Pageable pageable) {
        log.info("Getting students for institution: {} with search: {}", institutionId, search);

        Page<Student> students;
        if (search != null && !search.trim().isEmpty()) {
            students = studentRepository.findByInstitutionWithSearch(institutionId, search, pageable);
        } else {
            students = studentRepository.findByIdEducational(institutionId, pageable);
        }

        return students.map(studentMapper::toStudentResponse);
    }

    public List<StudentResponse> getAllStudentsByInstitution(int institutionId) {
        log.info("Getting all students for institution: {}", institutionId);

        List<Student> students = studentRepository.findByIdEducational(institutionId);

        return students.stream()
                .map(studentMapper::toStudentResponse)
                .collect(Collectors.toList());
    }
}
