package com.devteria.identity.service;

import com.devteria.identity.dto.request.TeacherCreationRequest;
import com.devteria.identity.dto.request.TeacherUpdateRequest;
import com.devteria.identity.dto.response.TeacherResponse;
import com.devteria.identity.entity.Teacher;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.TeacherMapper;
import com.devteria.identity.mapper.UserMapper;
import com.devteria.identity.repository.TeacherRepository;
import com.devteria.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TeacherService {

    TeacherRepository teacherRepository;
    UserRepository userRepository;
    TeacherMapper teacherMapper;
    UserMapper userMapper;

    @Transactional
    public TeacherResponse createTeacher(TeacherCreationRequest request) {
        log.info("Creating teacher with teacherId: {}", request.getTeacherId());

        // Check if teacher ID already exists
        if (teacherRepository.existsByTeacherId(request.getTeacherId())) {
            throw new AppException(ErrorCode.TEACHER_EXISTED);
        }

        // Create teacher entity directly from request
        Teacher teacher = teacherMapper.toTeacher(request);

        // Save teacher
        teacher = teacherRepository.save(teacher);

        // Create response
        TeacherResponse response = teacherMapper.toTeacherResponse(teacher);

        log.info("Teacher created successfully with ID: {}", teacher.getId());
        return response;
    }

    public Page<TeacherResponse> getAllTeachers(String teacherId, String departmentId,
                                                String educationalUnitId, Pageable pageable) {
        log.info("Getting teachers with filters - teacherId: {}, departmentId: {}, educationalUnitId: {}",
                teacherId, departmentId, educationalUnitId);

        Page<Teacher> teachers = teacherRepository.findTeachersWithFilters(
                teacherId, departmentId, educationalUnitId, pageable);

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
    public TeacherResponse updateTeacher(String id, TeacherUpdateRequest request) {
        log.info("Updating teacher with ID: {}", id);

        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_NOT_EXISTED));

        // Check if new teacherId already exists (if provided and different)
        if (request.getTeacherId() != null &&
                !request.getTeacherId().equals(teacher.getTeacherId()) &&
                teacherRepository.existsByTeacherId(request.getTeacherId())) {
            throw new AppException(ErrorCode.TEACHER_EXISTED);
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
            throw new AppException(ErrorCode.TEACHER_NOT_EXISTED);
        }

        teacherRepository.deleteById(id);
        log.info("Teacher deleted successfully with ID: {}", id);
    }
}
