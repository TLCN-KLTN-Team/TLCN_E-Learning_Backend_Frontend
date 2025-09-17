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
import com.devteria.identity.repository.UserRepository;
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
    UserRepository userRepository;
    StudentMapper studentMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (userRepository.existsByUsername(request.getUsername())) {

            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (studentRepository.existsByStudentId(request.getStudentId())) {
            System.out.println ("Có vào đây999");
            throw new AppException(ErrorCode.STUDENT_ALREADY_EXISTS);
        }

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

    @Transactional
    public StudentResponse updateStudent(String id, StudentRequest request) {
        log.info("Updating student with ID: {}", id);

        Student existingStudent = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Check if email is being changed and if new email already exists
        if (!existingStudent.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        // Check if username is being changed and if new username already exists
        if (!existingStudent.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // Check if studentId is being changed and if new studentId already exists
        if (!existingStudent.getStudentId().equals(request.getStudentId()) &&
                studentRepository.existsByStudentId(request.getStudentId())) {
            throw new AppException(ErrorCode.STUDENT_ALREADY_EXISTS);
        }

        try {
            // Update fields
            existingStudent.setUsername(request.getUsername());
            existingStudent.setEmail(request.getEmail());
            existingStudent.setFirstName(request.getFirstName());
            existingStudent.setLastName(request.getLastName());
            existingStudent.setDob(request.getDob());
            existingStudent.setStudentId(request.getStudentId());
            existingStudent.setIdDepartment(request.getDepartmentId() != null ?
                    Integer.parseInt(request.getDepartmentId()) : null);
            existingStudent.setIdEducational(request.getEducationalUnitId() != null ?
                    Integer.parseInt(request.getEducationalUnitId()) : null);
            existingStudent.setDescription(request.getDescription());
            existingStudent.setSocialUrl(request.getSocialUrl());
            existingStudent.setClassName(request.getClassName());

            // Only update password if provided
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                existingStudent.setPassword(passwordEncoder.encode(request.getPassword()));
                log.info("Password updated for student: {}", id);
            }

            Student updatedStudent = studentRepository.save(existingStudent);
            log.info("Successfully updated student with ID: {}", id);

            return studentMapper.toStudentResponse(updatedStudent);

        } catch (DataIntegrityViolationException exception) {
            log.error("Error updating student: {}", exception.getMessage());
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
    }
}
