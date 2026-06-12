package com.hoangphihiep.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.DepartmentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.dto.response.teacher.CourseCardResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseClass;
import com.hoangphihiep.entity.Department;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.events.CourseCreatedEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.kafka.producer.CourseEventProducer;
import com.hoangphihiep.mapper.CourseMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.repository.httpclient.ExpertRepository;
import com.hoangphihiep.repository.httpclient.NotificationRepository;
import com.hoangphihiep.dto.request.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.function.Function;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {
    private final DepartmentRepository departmentRepository;

    private final CourseRepository courseRepository;
    private final EducationalUnitRepository educationalUnitRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final CourseMapper courseMapper;
    private final CourseEventProducer eventProducer;
    private final NotificationRepository notificationRepository;
    private final CourseClassRepository courseClassRepository;

    private static final int MIN_COURSE_NAME_LENGTH = 3;
    private static final int MAX_COURSE_NAME_LENGTH = 255;
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MIN_DEPARTMENT_NAME_LENGTH = 2;
    private static final int MAX_DEPARTMENT_NAME_LENGTH = 255;
    private static final int MAX_DEPARTMENT_DESCRIPTION_LENGTH = 1000;

    public CourseResponse getCourseById (int id){
        if (id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        return courseMapper.toCourseResponse(course);
    }
    @Transactional
    public CourseResponse createCourseForEducationalUnit(int educationalUnitId, CourseRequest request) {
        validateEducationalUnitAccess(educationalUnitId);
        validateCourseRequest(request, true);

        EducationalUnit educationalUnit = educationalUnitRepository.findById(educationalUnitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        if (courseRepository.existsByCourseNameAndEducationalUnit(request.getCourseName(), educationalUnitId)) {
            throw new AppException(ErrorCode.COURSE_DUPLICATE_NAME);
        }


        try {
            Course course = new Course();
            course.setCourseName(request.getCourseName());
            course.setEducationalUnit(educationalUnit);

            String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();
            course.setExpertId(currentExpertId);
            
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

            return courseMapper.toCourseResponse(savedCourse);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public CourseResponse updateCourseForEducationalUnit(int educationalUnitId, int courseId, CourseRequest request) {

        validateEducationalUnitAccess(educationalUnitId);
        validateCourseRequest(request, false);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getEducationalUnit().getId() != educationalUnitId) {
            throw new AppException(ErrorCode.COURSE_NOT_BELONG_TO_EDUCATIONAL_UNIT);
        }

        try {
            course.setCourseName(request.getCourseName());
            course.setUpdatedAt(new Date());

            if (request.getDescription() != null) {
                course.setDescription(request.getDescription());
            }
            if (request.getCredits() != null) {
                course.setCredits(request.getCredits());
            }
            if (request.getMaxStudents() != null) {
                course.setMaxStudents(request.getMaxStudents());
            }

            Course updatedCourse = courseRepository.save(course);

            return courseMapper.toCourseResponse(updatedCourse);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private final ExpertRepository expertRepository;

    public Page<TeacherResponse> getTeachersByEducationalUnit(int educationalUnitId, int page, int size, String search) {
        validateEducationalUnitAccess(educationalUnitId);

        try {
            ApiResponse<Page<TeacherResponse>> response = teacherRepository.getTeachersByEducationalUnit(
                    educationalUnitId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            Page<TeacherResponse> teacherPage = response.getResult();

            // Batch populate để tối ưu hiệu suất
            List<TeacherResponse> populatedTeachers = batchPopulateTeacherDetails(teacherPage.getContent());

            return new PageImpl<>(populatedTeachers, teacherPage.getPageable(), teacherPage.getTotalElements());

        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public Page<TeacherResponse> getTeachersForExpert(int educationalUnitId, int page, int size, String search) {
        // Validate expert access
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            ApiResponse<ExpertResponse> expertResponse = expertRepository.getExpertByUserId(currentExpertId);
            if (expertResponse.getResult() == null) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
            ExpertResponse expert = expertResponse.getResult();
            if (expert.getEducationalUnitId() == null || !expert.getEducationalUnitId().equals(String.valueOf(educationalUnitId))) {
                 throw new AppException(ErrorCode.ACCESS_DENIED);
            }
        } catch (Exception e) {
             throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        try {
            ApiResponse<Page<TeacherResponse>> response = teacherRepository.getTeachersByEducationalUnit(
                    educationalUnitId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            Page<TeacherResponse> teacherPage = response.getResult();

            // Reuse batch populate logic
            List<TeacherResponse> populatedTeachers = batchPopulateTeacherDetails(teacherPage.getContent());

            return new PageImpl<>(populatedTeachers, teacherPage.getPageable(), teacherPage.getTotalElements());

        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private List<TeacherResponse> batchPopulateTeacherDetails(List<TeacherResponse> teachers) {
        if (teachers.isEmpty()) {
            return teachers;
        }

        try {
            // Collect all unique department IDs
            Set<Integer> departmentIds = teachers.stream()
                    .map(TeacherResponse::getDepartmentId)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());

            // Collect all unique educational unit IDs
            Set<Integer> educationalUnitIds = teachers.stream()
                    .map(TeacherResponse::getEducationalUnitId)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());

            // Batch fetch departments
            Map<Integer, Department> departmentMap = new HashMap<>();
            if (!departmentIds.isEmpty()) {
                List<Department> departments = departmentRepository.findAllById(departmentIds);
                departmentMap = departments.stream()
                        .collect(Collectors.toMap(Department::getId, Function.identity()));
            }

            // Batch fetch educational units
            Map<Integer, EducationalUnit> educationalUnitMap = new HashMap<>();
            if (!educationalUnitIds.isEmpty()) {
                List<EducationalUnit> educationalUnits = educationalUnitRepository.findAllById(educationalUnitIds);
                educationalUnitMap = educationalUnits.stream()
                        .collect(Collectors.toMap(EducationalUnit::getId, Function.identity()));
            }

            // Populate each teacher
            final Map<Integer, Department> finalDeptMap = departmentMap;
            final Map<Integer, EducationalUnit> finalEduMap = educationalUnitMap;

            return teachers.stream().map(teacher -> {
                // Populate Department
                if (teacher.getDepartmentId() != null && !teacher.getDepartmentId().isEmpty()) {
                    Department dept = finalDeptMap.get(Integer.parseInt(teacher.getDepartmentId()));
                    if (dept != null) {
                        DepartmentResponse deptResponse = DepartmentResponse.builder()
                                .id(String.valueOf(dept.getId()))
                                .name(dept.getName())
                                .description(dept.getDescription())
                                .build();
                        teacher.setDepartment(deptResponse);
                    }
                }

                // Populate Educational Unit
                if (teacher.getEducationalUnitId() != null && !teacher.getEducationalUnitId().isEmpty()) {
                    EducationalUnit edu = finalEduMap.get(Integer.parseInt(teacher.getEducationalUnitId()));
                    if (edu != null) {
                        EducationalUnitResponse eduResponse = EducationalUnitResponse.builder()
                                .id(edu.getId())
                                .name(edu.getName())
                                .description(edu.getDescription())
                                .build();
                        teacher.setEducationalUnit(eduResponse);
                    }
                }

                return teacher;
            }).collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error batch populating teacher details: {}", e.getMessage(), e);
            return teachers; // Return original list if population fails
        }
    }

    public Page<StudentResponse> getStudentsByEducationalUnit(int educationalUnitId, int page, int size, String search) {
        validateEducationalUnitAccess(educationalUnitId);

        try {
            ApiResponse<Page<StudentResponse>> response = studentRepository.getStudentsByEducationalUnit(
                    educationalUnitId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
            }

            Page<StudentResponse> studentPage = response.getResult();

            List<StudentResponse> populatedStudents = batchPopulateStudentDetails(studentPage.getContent());

            return new PageImpl<>(populatedStudents, studentPage.getPageable(), studentPage.getTotalElements());

        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public Page<ExpertResponse> getExpertsByEducationalUnit(int educationalUnitId, int page, int size, String search) {
        validateEducationalUnitAccess(educationalUnitId);

        try {
            ApiResponse<Page<ExpertResponse>> response = expertRepository.getExpertsByEducationalUnit(
                    educationalUnitId, page, size, search);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.EXPERT_NOT_FOUND);
            }

            return response.getResult();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private List<StudentResponse> batchPopulateStudentDetails(List<StudentResponse> students) {
        if (students.isEmpty()) {
            return students;
        }

        try {
            // Collect all unique department IDs
            Set<Integer> departmentIds = students.stream()
                    .map(StudentResponse::getDepartmentId)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());

            // Collect all unique educational unit IDs
            Set<Integer> educationalUnitIds = students.stream()
                    .map(StudentResponse::getEducationalUnitId)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toSet());

            // Batch fetch departments
            Map<Integer, Department> departmentMap = new HashMap<>();
            if (!departmentIds.isEmpty()) {
                List<Department> departments = departmentRepository.findAllById(departmentIds);
                departmentMap = departments.stream()
                        .collect(Collectors.toMap(Department::getId, Function.identity()));
            }

            // Batch fetch educational units
            Map<Integer, EducationalUnit> educationalUnitMap = new HashMap<>();
            if (!educationalUnitIds.isEmpty()) {
                List<EducationalUnit> educationalUnits = educationalUnitRepository.findAllById(educationalUnitIds);
                educationalUnitMap = educationalUnits.stream()
                        .collect(Collectors.toMap(EducationalUnit::getId, Function.identity()));
            }

            // Populate each student
            final Map<Integer, Department> finalDeptMap = departmentMap;
            final Map<Integer, EducationalUnit> finalEduMap = educationalUnitMap;

            return students.stream().map(student -> {
                // Populate Department
                if (student.getDepartmentId() != null && !student.getDepartmentId().isEmpty()) {
                    Department dept = finalDeptMap.get(Integer.parseInt(student.getDepartmentId()));
                    if (dept != null) {
                        DepartmentResponse deptResponse = DepartmentResponse.builder()
                                .id(String.valueOf(dept.getId()))
                                .name(dept.getName())
                                .description(dept.getDescription())
                                .build();
                        student.setDepartment(deptResponse);
                    }
                }

                // Populate Educational Unit
                if (student.getEducationalUnitId() != null && !student.getEducationalUnitId().isEmpty()) {
                    EducationalUnit edu = finalEduMap.get(Integer.parseInt(student.getEducationalUnitId()));
                    if (edu != null) {
                        EducationalUnitResponse eduResponse = EducationalUnitResponse.builder()
                                .id(edu.getId())
                                .name(edu.getName())
                                .description(edu.getDescription())
                                .build();
                        student.setEducationalUnit(eduResponse);
                    }
                }

                return student;
            }).collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error batch populating student details: {}", e.getMessage(), e);
            return students; // Return original list if population fails
        }
    }

    @Transactional
    public CourseResponse assignTeacherToCourse(int courseId, String teacherId) throws JsonProcessingException {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        validateEducationalUnitAccess(course.getEducationalUnit().getId());
        validateTeacherBelongsToEducationalUnit(teacherId, course.getEducationalUnit().getId());

        // Check if course already has classes
        List<CourseClass> existingClasses = courseClassRepository.findByCourseId(courseId);
        if (!existingClasses.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_HAS_EXISTING_CLASSES);
        }

        course.setIdTeacher(teacherId);
        course.setUpdatedAt(new Date());

        Course updatedCourse = courseRepository.save(course);

        var teacher = teacherRepository.getTeacherByTeacherId(updatedCourse.getIdTeacher()).getResult();

        // publish event course created
        CourseCreatedEvent event = CourseCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .courseId(updatedCourse.getId())
                .courseName(updatedCourse.getCourseName())
                .description(updatedCourse.getDescription())
                .teacherId(teacher.getId())
                .createdAt(LocalDateTime.now().toString())
                .build();

        // Publish event lên Kafka
        eventProducer.publishCourseCreatedEvent(event);

        // Send notification to teacher
        try {
            notificationRepository.sendNotification(NotificationMessage.builder()
                    .userId(teacher.getId()) // Teacher UUID
                    // .senderId(currentExpertId) // Assuming we have it locally or can get from context
                    .type("ASSIGNMENT")
                    .message("Bạn được phân công dạy môn học: " + updatedCourse.getCourseName())
                    .link("/teacher/assigned-courses")
                    .data(Map.of("courseId", updatedCourse.getId(), "courseName", updatedCourse.getCourseName()))
                    .build());
        } catch (Exception e) {
            log.error("Failed to send notification to teacher {}", teacher.getId(), e);
            // Non-blocking, continue
        }

        return courseMapper.toCourseResponse(updatedCourse);
    }

    @Transactional
    public CourseResponse removeTeacherFromCourse(int courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        validateEducationalUnitAccess(course.getEducationalUnit().getId());

        course.setIdTeacher(null);
        course.setUpdatedAt(new Date());

        Course updatedCourse = courseRepository.save(course);
        log.info("Removed teacher from course {}", courseId);

        return courseMapper.toCourseResponse(updatedCourse);
    }

    private void validateEducationalUnitAccess(int educationalUnitId) {
        // Get current user from security context
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        EducationalUnit educationalUnit = educationalUnitRepository.findById(educationalUnitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        // 1. Check if user is Admin of the Educational Unit
        if (currentUserId.equals(educationalUnit.getIdAdmin())) {
            return;
        }

        // 2. Check if user is an Expert belonging to the Educational Unit
        try {
            ApiResponse<ExpertResponse> response = expertRepository.getExpertByUserId(currentUserId);
            if (response != null && response.getResult() != null) {
                 ExpertResponse expert = response.getResult();
                 if (expert.getEducationalUnitId() != null 
                     && expert.getEducationalUnitId().equals(String.valueOf(educationalUnitId))) {
                     return;
                 }
            }
        } catch (Exception e) {
            // User is not an expert or other error -> proceed to Access Denied
        }

        throw new AppException(ErrorCode.ACCESS_DENIED);
    }

    private void validateTeacherBelongsToEducationalUnit(String teacherId, int educationalUnitId) {
        try {
            log.info("Calling TeacherRepository.getTeacherByTeacherId with ID: {}", teacherId);
            ApiResponse<TeacherResponse> response = teacherRepository.getTeacherByTeacherId(teacherId);

            log.info("Teacher found: {}", response);

            if (response.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            TeacherResponse teacher = response.getResult();
            if (!teacher.getEducationalUnitId().equals(String.valueOf(educationalUnitId))) {
                throw new AppException(ErrorCode.TEACHER_NOT_BELONGS_TO_INSTITUTION);
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.TEACHER_VALIDATION_FAILED);
        }
    }

    private void validateCourseRequest(CourseRequest request, boolean isCreate) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (isCreate || request.getCourseName() != null) {
            validateCourseName(request.getCourseName(), isCreate);
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
    private void validatePaginationParameters(int page, int size) {
        if (page < 0) {
            throw new AppException(ErrorCode.COURSE_PAGE_NUMBER_INVALID);
        }

        if (size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
            throw new AppException(ErrorCode.COURSE_PAGE_SIZE_INVALID);
        }
    }

    public Page<DepartmentResponse> getDepartmentsByEducationalUnit(int educationalUnitId, int page, int size, String search) {
        validatePaginationParameters(page, size);
        validateEducationalUnitAccess(educationalUnitId);

        if (search != null && search.trim().isEmpty()) {
            search = null;
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
            Page<Department> departmentPage = departmentRepository.findByEducationalUnitWithSearch(educationalUnitId, search, pageable);

            return departmentPage.map(this::toDepartmentResponse);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Tạo department cho đơn vị đào tạo
    @Transactional
    public DepartmentResponse createDepartmentForEducationalUnit(int educationalUnitId, DepartmentRequest request) {
        validateEducationalUnitAccess(educationalUnitId);
        validateDepartmentRequest(request, true);

        EducationalUnit educationalUnit = educationalUnitRepository.findById(educationalUnitId)
                .orElseThrow(() -> new AppException(ErrorCode.EDUCATIONAL_UNIT_NOT_FOUND));

        if (departmentRepository.existsByNameAndEducationalUnit(request.getName(), educationalUnitId)) {
            throw new AppException(ErrorCode.DEPARTMENT_DUPLICATE_NAME);
        }

        try {
            Department department = new Department();
            department.setName(request.getName());
            department.setDescription(request.getDescription());
            department.setEducationalUnit(educationalUnit);

            Department savedDepartment = departmentRepository.save(department);

            return toDepartmentResponse(savedDepartment);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public DepartmentResponse updateDepartmentForEducationalUnit(int educationalUnitId, int departmentId, DepartmentRequest request) {
        validateEducationalUnitAccess(educationalUnitId);
        validateDepartmentRequest(request, false);

        Department department = departmentRepository.findByIdAndEducationalUnitId(departmentId, educationalUnitId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_FOUND));

        if (request.getName() != null &&
                !request.getName().equals(department.getName()) &&
                departmentRepository.existsByNameAndEducationalUnit(request.getName(), educationalUnitId)) {
            throw new AppException(ErrorCode.DEPARTMENT_DUPLICATE_NAME);
        }

        try {
            if (request.getName() != null) {
                department.setName(request.getName());
            }
            if (request.getDescription() != null) {
                department.setDescription(request.getDescription());
            }

            Department updatedDepartment = departmentRepository.save(department);

            return toDepartmentResponse(updatedDepartment);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
    // Lấy department theo ID
    public DepartmentResponse getDepartmentByIdForEducationalUnit(int educationalUnitId, int departmentId) {
        validateEducationalUnitAccess(educationalUnitId);

        Department department = departmentRepository.findByIdAndEducationalUnitId(departmentId, educationalUnitId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_FOUND));

        return toDepartmentResponse(department);
    }

    public Page<CourseResponse> getCoursesByTeacherPaginated(String teacherId, int page, int size, String search, String creditRange) {
        if (teacherId == null || teacherId.trim().isEmpty()) {
            throw new AppException(ErrorCode.COURSE_TEACHER_REQUIRED);
        }

        validatePaginationParameters(page, size);

        String normalizedSearch = search == null || search.trim().isEmpty() ? null : search.trim();
        String normalizedCreditRange = creditRange == null || creditRange.trim().isEmpty() ? null : creditRange.trim();

        try {
            // Validate teacher exists
            ApiResponse<TeacherResponse> teacherResponse = teacherRepository.getTeacherByTeacherId(teacherId);
            if (teacherResponse.getResult() == null) {
                throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

                Page<Course> coursePage = courseRepository.findByIdTeacherWithSearchAndCreditsRange(
                    teacherId,
                    normalizedSearch,
                    normalizedCreditRange,
                    pageable
                );

            return coursePage.map(courseMapper::toCourseResponse);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while fetching paginated courses for teacher: {}", teacherId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public List<CourseCardResponse> getCourseCardsByUserId(String userId) {
        // Validate teacher exists
        ApiResponse<TeacherResponse> teacherResponse = teacherRepository.getTeacherByTeacherId(userId);
        if (teacherResponse.getResult() == null) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

        List<Course> coursesOfTeacher = courseRepository.findByIdTeacher(teacherResponse.getResult().getTeacherId());

        return coursesOfTeacher.stream()
                .map(course -> CourseCardResponse.builder()
                        .courseId(course.getId())
                        .courseName(course.getCourseName())
                        .build())
                .collect(Collectors.toList());


    }

    public Page<CourseResponse> getCoursesByExpertId(String expertId, int page, int size, String search) {
        validatePaginationParameters(page, size);

        if (expertId == null || expertId.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (search != null && search.trim().isEmpty()) {
            search = null;
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Course> coursePage = courseRepository.findByExpertIdWithSearch(expertId, search, pageable);

            return coursePage.map(course -> {
                CourseResponse courseResponse = courseMapper.toCourseResponse(course);

                // Fetch teacher info if idTeacher exists
                if (course.getIdTeacher() != null && !course.getIdTeacher().trim().isEmpty()) {
                    try {
                        ApiResponse<TeacherResponse> teacherApiResponse = teacherRepository.getTeacherByTeacherId(course.getIdTeacher());
                        if (teacherApiResponse != null && teacherApiResponse.getResult() != null) {
                            courseResponse.setTeacher(teacherApiResponse.getResult());
                        }
                    } catch (Exception e) {
                        // Log and ignore teacher fetch error, don't break the course list
                        log.warn("Failed to fetch teacher info for course {}", course.getId(), e);
                    }
                }

                return courseResponse;
            });
        } catch (Exception e) {
            log.error("Error fetching courses for expert {}: {}", expertId, e.getMessage());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Helper methods cho Department
    private void validateDepartmentRequest(DepartmentRequest request, boolean isCreate) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (isCreate || request.getName() != null) {
            validateDepartmentName(request.getName(), isCreate);
        }

        if (request.getDescription() != null) {
            validateDepartmentDescription(request.getDescription());
        }
    }

    private void validateDepartmentName(String name, boolean isRequired) {
        if (name == null || name.trim().isEmpty()) {
            if (isRequired) {
                throw new AppException(ErrorCode.DEPARTMENT_NAME_REQUIRED);
            }
            return;
        }

        String trimmedName = name.trim();
        if (trimmedName.length() < MIN_DEPARTMENT_NAME_LENGTH) {
            throw new AppException(ErrorCode.DEPARTMENT_NAME_TOO_SHORT);
        }

        if (trimmedName.length() > MAX_DEPARTMENT_NAME_LENGTH) {
            throw new AppException(ErrorCode.DEPARTMENT_NAME_TOO_LONG);
        }
    }

    private void validateDepartmentDescription(String description) {
        if (description != null && description.length() > MAX_DEPARTMENT_DESCRIPTION_LENGTH) {
            throw new AppException(ErrorCode.DEPARTMENT_DESCRIPTION_TOO_LONG);
        }
    }

    private DepartmentResponse toDepartmentResponse(Department department) {
        return DepartmentResponse.builder()
                .id(String.valueOf(department.getId()))
                .name(department.getName())
                .description(department.getDescription())
                .build();
    }
}
