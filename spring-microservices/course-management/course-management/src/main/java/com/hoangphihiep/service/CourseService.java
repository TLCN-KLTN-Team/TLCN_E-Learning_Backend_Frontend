package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseMapper;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.CourseTypeRepository;
import com.hoangphihiep.repository.EducationalUnitRepository;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseTypeRepository courseTypeRepository;
    private final EducationalUnitRepository educationalUnitRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final CourseMapper courseMapper;

    // Constants for validation
    private static final int MIN_COURSE_NAME_LENGTH = 3;
    private static final int MAX_COURSE_NAME_LENGTH = 255;
    private static final int MAX_DESCRIPTION_LENGTH = 2000;
    private static final BigDecimal MAX_COURSE_PRICE = new BigDecimal("10000000"); // 10 triệu VNĐ
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100;

    // Lấy danh sách khóa học của đơn vị đào tạo
    public Page<CourseResponse> getCoursesByInstitution(int institutionId, int page, int size, String search) {
        validatePaginationParameters(page, size);
        validateInstitutionAccess(institutionId);

        if (search != null && search.trim().isEmpty()) {
            search = null;
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Course> coursePage = courseRepository.findByInstitutionWithSearch(institutionId, search, pageable);

            return coursePage.map(courseMapper::toCourseResponse);
        } catch (Exception e) {
            log.error("Error occurred while fetching courses for institution: {}", institutionId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Tạo khóa học cho đơn vị đào tạo
    @Transactional
    public CourseResponse createCourseForInstitution(int institutionId, CourseRequest request) {
        validateInstitutionAccess(institutionId);
        validateCourseRequest(request, true);

        EducationalUnit institution = educationalUnitRepository.findById(institutionId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        // Kiểm tra tên khóa học không trùng trong cùng đơn vị
        if (courseRepository.existsByCourseNameAndInstitution(request.getCourseName(), institutionId)) {
            throw new AppException(ErrorCode.COURSE_DUPLICATE_NAME);
        }

        CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

        // Validate teacher belongs to the same institution
        if (request.getIdTeacher() != null) {
            validateTeacherBelongsToInstitution(request.getIdTeacher(), institutionId);
        }

        try {
            Course course = new Course();
            course.setCourseName(request.getCourseName());
            course.setCourseType(courseType);
            course.setIdTeacher(request.getIdTeacher());
            course.setInstitution(institution);
            course.setCreatedAt(new Date());
            course.setUpdatedAt(new Date());

            // Set additional fields if provided
            if (request.getDescription() != null) {
                course.setDescription(request.getDescription());
            }
            if (request.getCredits() != null) {
                course.setCredits(request.getCredits());
            }
            if (request.getMaxStudents() != null) {
                course.setMaxStudents(request.getMaxStudents());
            }

            Course savedCourse = courseRepository.save(course);
            log.info("Admin created new course with ID: {} for institution: {}", savedCourse.getId(), institutionId);

            return courseMapper.toCourseResponse(savedCourse);
        } catch (Exception e) {
            log.error("Unexpected error while creating course for institution: {}", institutionId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Lấy danh sách giáo viên của đơn vị đào tạo
    public Page<TeacherResponse> getTeachersByInstitution(int institutionId, int page, int size, String search) {
        validateInstitutionAccess(institutionId);

        try {
            ApiResponse<Page<TeacherResponse>> response = teacherRepository.getTeachersByInstitution(
                    institutionId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            return response.getResult();
        } catch (Exception e) {
            log.error("Error occurred while fetching teachers for institution: {}", institutionId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Lấy danh sách sinh viên của đơn vị đào tạo
    public Page<StudentResponse> getStudentsByInstitution(int institutionId, int page, int size, String search) {
        validateInstitutionAccess(institutionId);

        try {
            ApiResponse<Page<StudentResponse>> response = studentRepository.getStudentsByInstitution(
                    institutionId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
            }

            return response.getResult();
        } catch (Exception e) {
            log.error("Error occurred while fetching students for institution: {}", institutionId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public CourseResponse assignTeacherToCourse(int courseId, String teacherId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        validateInstitutionAccess(course.getInstitution().getId());
        validateTeacherBelongsToInstitution(teacherId, course.getInstitution().getId());

        course.setIdTeacher(teacherId);
        course.setUpdatedAt(new Date());

        Course updatedCourse = courseRepository.save(course);
        log.info("Assigned teacher {} to course {}", teacherId, courseId);

        return courseMapper.toCourseResponse(updatedCourse);
    }

    // Xóa giáo viên khỏi khóa học
    @Transactional
    public CourseResponse removeTeacherFromCourse(int courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        validateInstitutionAccess(course.getInstitution().getId());

        course.setIdTeacher(null);
        course.setUpdatedAt(new Date());

        Course updatedCourse = courseRepository.save(course);
        log.info("Removed teacher from course {}", courseId);

        return courseMapper.toCourseResponse(updatedCourse);
    }

    private void validateInstitutionAccess(int institutionId) {
        // Get current admin user from security context
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();

        EducationalUnit institution = educationalUnitRepository.findById(institutionId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        if (!currentAdminId.equals(institution.getIdAdmin())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validateTeacherBelongsToInstitution(String teacherId, int institutionId) {
        try {
            ApiResponse<TeacherResponse> response = teacherRepository.getTeacherByTeacherId(teacherId);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            TeacherResponse teacher = response.getResult();
            if (!teacher.getEducationalUnitId().equals(String.valueOf(institutionId))) {
                throw new AppException(ErrorCode.TEACHER_NOT_BELONGS_TO_INSTITUTION);
            }
        } catch (Exception e) {
            log.error("Error validating teacher {} for institution {}", teacherId, institutionId, e);
            throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
        }
    }


    public List<CourseResponse> getAllCourses(int page, int size, String search) {
        validatePaginationParameters(page, size);

        if (search != null && search.trim().isEmpty()) {
            search = null;
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Course> coursePage = courseRepository.findBySearch(search, pageable);

            return coursePage.getContent().stream()
                    .map(courseMapper::toCourseResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Error occurred while fetching courses", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public CourseResponse getCourseById(Integer id) {
        if (id == null || id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        return courseMapper.toCourseResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        validateCourseRequest(request, true);

        if (courseRepository.existsByCourseName(request.getCourseName())) {
            throw new AppException(ErrorCode.COURSE_DUPLICATE_NAME);
        }

        CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

        try {
            Course course = new Course();
            course.setCourseName(request.getCourseName());
            course.setCourseType(courseType);
            course.setIdTeacher(request.getIdTeacher());
            course.setCreatedAt(new Date());
            course.setUpdatedAt(new Date());

            Course savedCourse = courseRepository.save(course);
            log.info("Created new course with ID: {}", savedCourse.getId());

            return courseMapper.toCourseResponse(savedCourse);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while creating course", e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        } catch (Exception e) {
            log.error("Unexpected error while creating course", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public CourseResponse updateCourse(Integer id, CourseRequest request) {
        if (id == null || id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        validateCourseRequestForUpdate(request);

        if (request.getCourseName() != null &&
                !request.getCourseName().equals(course.getCourseName()) &&
                courseRepository.existsByCourseName(request.getCourseName())) {
            throw new AppException(ErrorCode.COURSE_DUPLICATE_NAME);
        }

        try {
            updateCourseFields(course, request);
            course.setUpdatedAt(new Date());

            Course updatedCourse = courseRepository.save(course);
            log.info("Updated course with ID: {}", updatedCourse.getId());

            return courseMapper.toCourseResponse(updatedCourse);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while updating course", e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while updating course", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
    public List<CourseResponse> getCoursesByTeacher(String teacherId) {
        if (teacherId == null || teacherId.trim().isEmpty()) {
            throw new AppException(ErrorCode.COURSE_TEACHER_REQUIRED);
        }

        try {
            List<Course> courses = courseRepository.findByIdTeacher(teacherId);
            return courses.stream()
                    .map(courseMapper::toCourseResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Error occurred while fetching courses by teacher: {}", teacherId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public CourseResponse publishCourse(Integer id, String teacherId) {
        if (id == null || id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (teacherId != null && !teacherId.equals(course.getIdTeacher())) {
            throw new AppException(ErrorCode.COURSE_TEACHER_MISMATCH);
        }

        if (course.getSections() == null || course.getSections().isEmpty()) {
            throw new AppException(ErrorCode.COURSE_EMPTY_SECTIONS);
        }

        try {
            course.setUpdatedAt(new Date());

            Course publishedCourse = courseRepository.save(course);
            log.info("Published course with ID: {}", publishedCourse.getId());

            return courseMapper.toCourseResponse(publishedCourse);
        } catch (Exception e) {
            log.error("Unexpected error while publishing course", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void validateCourseRequest(CourseRequest request, boolean isCreate) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (isCreate || request.getCourseName() != null) {
            validateCourseName(request.getCourseName(), isCreate);
        }

        if (isCreate || request.getCourseTypeId() != null) {
            if (request.getCourseTypeId() == null) {
                throw new AppException(ErrorCode.COURSE_TYPE_REQUIRED);
            }
        }

        if (isCreate || request.getIdTeacher() != null) {
            validateTeacherId(request.getIdTeacher(), isCreate);
        }
    }

    private void validateCourseRequestForUpdate(CourseRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (request.getCourseName() != null) {
            validateCourseName(request.getCourseName(), false);
        }

        if (request.getIdTeacher() != null) {
            validateTeacherId(request.getIdTeacher(), false);
        }
    }

    private void validateCourseName(String courseName, boolean isRequired) {
        if (courseName == null || courseName.trim().isEmpty()) {
            if (isRequired) {
                throw new AppException(ErrorCode.COURSE_NAME_REQUIRED);
            }
            return;
        }

        String trimmedName = courseName.trim();
        if (trimmedName.length() < MIN_COURSE_NAME_LENGTH) {
            throw new AppException(ErrorCode.COURSE_NAME_TOO_SHORT);
        }

        if (trimmedName.length() > MAX_COURSE_NAME_LENGTH) {
            throw new AppException(ErrorCode.COURSE_NAME_TOO_LONG);
        }
    }

    private void validateTeacherId(String teacherId, boolean isRequired) {
        if (teacherId == null || teacherId.trim().isEmpty()) {
            if (isRequired) {
                throw new AppException(ErrorCode.COURSE_TEACHER_REQUIRED);
            }
        }
    }

    private void validateCoursePrice(BigDecimal price) {
        if (price == null) {
            return;
        }

        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.COURSE_PRICE_NEGATIVE);
        }

        if (price.compareTo(MAX_COURSE_PRICE) > 0) {
            throw new AppException(ErrorCode.COURSE_PRICE_TOO_HIGH);
        }
    }

    private void validatePaginationParameters(int page, int size) {
        if (page < 0) {
            throw new AppException(ErrorCode.COURSE_PAGE_NUMBER_INVALID);
        }

        if (size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
            throw new AppException(ErrorCode.COURSE_PAGE_SIZE_INVALID);
        }
    }

    private boolean isSignificantUpdate(CourseRequest request) {
        return request.getCourseName() != null ||
                request.getCourseTypeId() != null;
    }

    private void updateCourseFields(Course course, CourseRequest request) {
        if (request.getCourseName() != null) {
            course.setCourseName(request.getCourseName());
        }

        if (request.getCourseTypeId() != null) {
            CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));
            course.setCourseType(courseType);
        }
    }
}
