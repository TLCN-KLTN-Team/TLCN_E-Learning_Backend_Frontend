package com.hoangphihiep.controller.Teacher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hoangphihiep.dto.request.BulkSectionRequest;
import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
@RequiredArgsConstructor
@Slf4j
public class TeacherCourseController {

    private final CourseService courseService;

    private final SectionService sectionService;

    private final CourseClassService classService;

    private final CourseEnrollmentService enrollmentService;

    private final StudentService studentService;
    @GetMapping("/{teacherId}")
    public ApiResponse<List<CourseResponse>> getCoursesByTeacher(
            @PathVariable String teacherId) {

        List<CourseResponse> courses = courseService.getCoursesByTeacherWithDetails(teacherId);

        return ApiResponse.<List<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/{teacherId}/paginated")
    public ApiResponse<Page<CourseResponse>> getCoursesByTeacherPaginated(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Getting paginated courses for teacher: {}", teacherId);

        // Get courses
        Page<CourseResponse> courses = courseService.getCoursesByTeacherPaginated(teacherId, page, size);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/by-course/{courseId}")
    public ApiResponse<CourseResponse> getCoursesById(
            @PathVariable int courseId) {

        CourseResponse courses = courseService.getCourseById(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/section/{courseId}")
    public ApiResponse<List<SectionResponse>> getCourseDetail(
            @PathVariable Integer courseId) {

        List<SectionResponse> sectionResponse = sectionService.getSectionsByCourseId(courseId);

        return ApiResponse.<List<SectionResponse>>builder()
                .result(sectionResponse)
                .build();
    }

    @PostMapping(value = "/section/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<SectionResponse>> createSections(
            @RequestPart("data") String dataJson,  // ĐỔI THÀNH String
            @RequestPart(value = "lessonFiles", required = false) List<MultipartFile> lessonFiles,
            @RequestPart(value = "questionFiles", required = false) List<MultipartFile> questionFiles,
            @RequestPart(value = "assignmentFiles", required = false) List<MultipartFile> assignmentFiles,
            @RequestPart(value = "rubricFiles", required = false) List<MultipartFile> rubricFiles
    ) throws JsonProcessingException {  // Thêm throws

        System.out.println("========== DEBUG REQUEST ==========");
        System.out.println("Raw JSON string: " + dataJson);

        // Parse JSON string thành object
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // Nếu có Date/Time fields
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        BulkSectionRequest request = mapper.readValue(dataJson, BulkSectionRequest.class);

        System.out.println("Parsed request object: " + request);
        System.out.println("Course ID: " + request.getCourseId());
        System.out.println("Total sections: " + request.getSections().size());

        System.out.println("========== DEBUG FILES ==========");
        printFileList("Lesson files", lessonFiles);
        printFileList("Question files", questionFiles);
        printFileList("Assignment files", assignmentFiles);
        printFileList("Rubric files", rubricFiles);

        List<SectionResponse> responses = sectionService.createSections(
                request,
                lessonFiles,
                questionFiles,
                assignmentFiles,
                rubricFiles
        );

        System.out.println("========== RESPONSE RESULT ==========");
        System.out.println("Total sections created: " + responses.size());

        return ApiResponse.<List<SectionResponse>>builder()
                .result(responses)
                .build();
    }


    @GetMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> getStudentsDetail(
            @PathVariable String studentId) {

        StudentResponse student = studentService.getStudentByStudentId(studentId);

        return ApiResponse.<StudentResponse>builder()
                .result(student)
                .build();
    }

    private void printFileList(String label, List<MultipartFile> files) {
        if (files == null) {
            System.out.println(label + ": NULL");
            return;
        }
        System.out.println(label + ": " + files.size() + " file(s)");
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            System.out.printf("  [%d] name=%s, originalFilename=%s, size=%d bytes%n",
                    i, file.getName(), file.getOriginalFilename(), file.getSize());
        }
    }
}
