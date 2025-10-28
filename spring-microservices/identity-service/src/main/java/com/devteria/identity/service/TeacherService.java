package com.devteria.identity.service;

import java.util.HashSet;

import com.devteria.identity.entity.AccountStatus;
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
import com.devteria.identity.repository.UserRepository;

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
    UserRepository userRepository;
    TeacherMapper teacherMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Transactional
    public TeacherResponse createTeacher(TeacherRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (userRepository.existsByUsername(request.getUsername())) {

            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (teacherRepository.existsByTeacherId(request.getTeacherId())) {
            System.out.println("Có vào đây999");
            throw new AppException(ErrorCode.TEACHERID_ALREADY_EXISTS);
        }

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.TEACHER_ROLE).ifPresent(roles::add);

        Teacher teacher = Teacher.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dob(request.getDob())
                .roles(roles)
                .teacherId(request.getTeacherId())
                .idDepartment(request.getDepartmentId() != null ? Integer.parseInt(request.getDepartmentId()) : null)
                .idEducational(
                        request.getEducationalUnitId() != null
                                ? Integer.parseInt(request.getEducationalUnitId())
                                : null)
                .description(request.getDescription())
                .socialUrl(request.getSocialUrl())
                .bankAccountNumber(request.getBankAccountNumber())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        try {
            teacher = teacherRepository.save(teacher);
            return teacherMapper.toTeacherResponse(teacher);
        } catch (DataIntegrityViolationException exception) {
            log.error("Error creating teacher: {}", exception.getMessage());
            throw new AppException(ErrorCode.TEACHER_ALREADY_EXISTS);
        }
    }

    @Transactional
    public TeacherResponse updateTeacher(String id, TeacherRequest request) {
        log.info("Updating teacher with ID: {}", id);

        Teacher existingTeacher =
                teacherRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Check if email is being changed and if new email already exists
        if (!existingTeacher.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        // Check if username is being changed and if new username already exists
        if (!existingTeacher.getUsername().equals(request.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // Check if teacherId is being changed and if new teacherId already exists
        if (!existingTeacher.getTeacherId().equals(request.getTeacherId())
                && teacherRepository.existsByTeacherId(request.getTeacherId())) {
            throw new AppException(ErrorCode.TEACHER_ALREADY_EXISTS);
        }

        try {
            // Update fields
            existingTeacher.setUsername(request.getUsername());
            existingTeacher.setEmail(request.getEmail());
            existingTeacher.setFirstName(request.getFirstName());
            existingTeacher.setLastName(request.getLastName());
            existingTeacher.setDob(request.getDob());
            existingTeacher.setTeacherId(request.getTeacherId());
            existingTeacher.setIdDepartment(
                    request.getDepartmentId() != null ? Integer.parseInt(request.getDepartmentId()) : null);
            existingTeacher.setIdEducational(
                    request.getEducationalUnitId() != null ? Integer.parseInt(request.getEducationalUnitId()) : null);
            existingTeacher.setDescription(request.getDescription());
            existingTeacher.setSocialUrl(request.getSocialUrl());
            existingTeacher.setBankAccountNumber(request.getBankAccountNumber());

            // Only update password if provided
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                existingTeacher.setPassword(passwordEncoder.encode(request.getPassword()));
                log.info("Password updated for teacher: {}", id);
            }

            Teacher updatedTeacher = teacherRepository.save(existingTeacher);
            log.info("Successfully updated teacher with ID: {}", id);

            return teacherMapper.toTeacherResponse(updatedTeacher);

        } catch (DataIntegrityViolationException exception) {
            log.error("Error updating teacher: {}", exception.getMessage());
            throw new AppException(ErrorCode.TEACHER_ALREADY_EXISTS);
        }
    }

    public Page<TeacherResponse> getAllTeachers(
            String teacherId, String departmentId, String educationalUnitId, Pageable pageable) {
        log.info(
                "Getting teachers with filters - teacherId: {}, departmentId: {}, educationalUnitId: {}",
                teacherId,
                departmentId,
                educationalUnitId);

        Page<Teacher> teachers =
                teacherRepository.findTeachersWithFilters(teacherId, departmentId, educationalUnitId, pageable);
        return teachers.map(teacherMapper::toTeacherResponse);
    }

    // Thêm method mới cho admin
    public Page<TeacherResponse> getTeachersByEducationalUnit(int educationalUnitId, String search, Pageable pageable) {

        Page<Teacher> teachers;
        if (search != null && !search.trim().isEmpty()) {
            teachers = teacherRepository.findByInstitutionWithSearch(educationalUnitId, search, pageable);
        } else {
            teachers = teacherRepository.findByIdEducational(educationalUnitId, pageable);
        }

        return teachers.map(teacherMapper::toTeacherResponse);
    }

    public TeacherResponse getTeacherById(String id) {
        log.info("Getting teacher by ID: {}", id);
        Teacher teacher =
                teacherRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_FOUND));
        return teacherMapper.toTeacherResponse(teacher);
    }

    public TeacherResponse getTeacherByTeacherId(String teacherId) {
        log.info("Getting teacher by teacherId: {}", teacherId);
        Teacher teacher = teacherRepository
                .findByTeacherId(teacherId)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_FOUND));
        return teacherMapper.toTeacherResponse(teacher);
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

    public TeacherResponse getTeacherByUserId(String userId) {
        log.info("Getting teacher by userId: {}", userId);
        Teacher teacher = teacherRepository
                .findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_FOUND));
        return teacherMapper.toTeacherResponse(teacher);
    }
}
