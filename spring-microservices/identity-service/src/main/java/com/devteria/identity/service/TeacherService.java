package com.devteria.identity.service;

import java.util.HashSet;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.TeacherRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.Teacher;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.TeacherMapper;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.TeacherRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TeacherService {

    TeacherRepository teacherRepository;
    TeacherMapper teacherMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Transactional
    public TeacherResponse createTeacher(TeacherRequest request) {
        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.TEACHER_ROLE).ifPresent(roles::add);

        Teacher teacher = Teacher.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dob(request.getDob())
                .emailVerified(false)
                .roles(roles)
                .teacherId(request.getTeacherId())
                .idDepartment(request.getDepartmentId() != null ? Integer.parseInt(request.getDepartmentId()) : null)
                .idEducational(request.getEducationalUnitId() != null ? Integer.parseInt(request.getEducationalUnitId()) : null)
                .description(request.getDescription())
                .socialUrl(request.getSocialUrl())
                .bankAccountNumber(request.getBankAccountNumber())
                .build();

        try {
            teacher = teacherRepository.save(teacher);
            return teacherMapper.toTeacherResponse(teacher);
        } catch (DataIntegrityViolationException exception) {
            log.error("Error creating teacher: {}", exception.getMessage());
            throw new AppException(ErrorCode.TEACHER_ALREADY_EXISTS);
        }
    }

    public Page<TeacherResponse> getAllTeachers(
            String teacherId, String departmentId, String educationalUnitId, Pageable pageable) {
        log.info("Getting teachers with filters - teacherId: {}, departmentId: {}, educationalUnitId: {}",
                teacherId, departmentId, educationalUnitId);

        Page<Teacher> teachers = teacherRepository.findTeachersWithFilters(teacherId, departmentId, educationalUnitId, pageable);
        return teachers.map(teacherMapper::toTeacherResponse);
    }

    // Thêm method mới cho admin
    public Page<TeacherResponse> getTeachersByInstitution(int institutionId, String search, Pageable pageable) {
        log.info("Getting teachers for institution: {} with search: {}", institutionId, search);

        Page<Teacher> teachers;
        if (search != null && !search.trim().isEmpty()) {
            teachers = teacherRepository.findByInstitutionWithSearch(institutionId, search, pageable);
        } else {
            teachers = teacherRepository.findByIdEducational(institutionId, pageable);
        }

        return teachers.map(teacherMapper::toTeacherResponse);
    }

    public TeacherResponse getTeacherById(String id) {
        log.info("Getting teacher by ID: {}", id);
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_EXISTED));
        return teacherMapper.toTeacherResponse(teacher);
    }

    public TeacherResponse getTeacherByTeacherId(String teacherId) {
        log.info("Getting teacher by teacherId: {}", teacherId);
        Teacher teacher = teacherRepository.findByTeacherId(teacherId)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_EXISTED));
        return teacherMapper.toTeacherResponse(teacher);
    }

    @Transactional
    public TeacherResponse updateTeacher(String id, TeacherRequest request) {
        log.info("Updating teacher with ID: {}", id);

        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_EXISTED));

        if (request.getTeacherId() != null
                && !request.getTeacherId().equals(teacher.getTeacherId())
                && teacherRepository.existsByTeacherId(request.getTeacherId())) {
            throw new AppException(ErrorCode.TEACHER_ALREADY_EXISTS);
        }

        teacherMapper.updateTeacher(teacher, request);
        teacher = teacherRepository.save(teacher);

        TeacherResponse response = teacherMapper.toTeacherResponse(teacher);
        log.info("Teacher updated successfully with ID: {}", teacher.getId());
        return response;
    }

    @Transactional
    public void deleteTeacher(String id) {
        log.info("Deleting teacher with ID: {}", id);

        if (!teacherRepository.existsById(id)) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

        teacherRepository.deleteById(id);
        log.info("Teacher deleted successfully with ID: {}", id);
    }
}
