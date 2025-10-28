package com.hoangphihiep.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // General errors (9xxx)
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

    // Authentication & Authorization errors (10xx)
    INVALID_KEY(1001, "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1006, "Không có quyền truy cập", HttpStatus.UNAUTHORIZED),
    UNAUTHENTICATED(1007, "Chưa được xác thực", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1008, "Bị cấm truy cập", HttpStatus.FORBIDDEN),
    ACCESS_DENIED(1009, "Truy cập bị từ chối", HttpStatus.FORBIDDEN),

    // Common validation errors (10xx)
    INVALID_REQUEST(1005, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1004, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    USERNAME_EXISTED(1005, "Username đã tồn tại", HttpStatus.BAD_REQUEST),

    // Instructor related errors (10xx)
    INSTRUCTOR_NOT_EXISTED(1002, "Giảng viên không tồn tại", HttpStatus.NOT_FOUND),
    INSTRUCTOR_CODE_EXISTED(1003, "ID teacher đã tồn tại", HttpStatus.BAD_REQUEST),
    STUDENT_CODE_EXISTED(1010, "ID student đã tồn tại", HttpStatus.BAD_REQUEST),

    // Educational Unit related errors (11xx)
    EDUCATIONAL_UNIT_NOT_FOUND(1101, "Không tìm thấy đơn vị đào tạo", HttpStatus.NOT_FOUND),

    // Teacher related errors (12xx)
    TEACHER_NOT_FOUND(1201, "Không tìm thấy giảng viên", HttpStatus.NOT_FOUND),
    TEACHER_NOT_BELONGS_TO_INSTITUTION(1202, "Giảng viên không thuộc đơn vị đào tạo này", HttpStatus.BAD_REQUEST),
    TEACHER_VALIDATION_FAILED(1203, "Xác thực giảng viên thất bại", HttpStatus.BAD_REQUEST),

    // Student related errors (13xx)
    STUDENT_NOT_FOUND(1301, "Không tìm thấy sinh viên", HttpStatus.NOT_FOUND),
    STUDENT_NOT_BELONGS_TO_INSTITUTION(1302, "Sinh viên không thuộc đơn vị đào tạo này", HttpStatus.BAD_REQUEST),
    STUDENT_VALIDATION_FAILED(1303, "Xác thực sinh viên thất bại", HttpStatus.BAD_REQUEST),
    STUDENT_ALREADY_ENROLLED(1304, "Sinh viên đã được ghi danh vào khóa học này", HttpStatus.CONFLICT),

    // Department related errors (14xx)
    DEPARTMENT_NOT_FOUND(1401, "Không tìm thấy khoa", HttpStatus.NOT_FOUND),
    DEPARTMENT_NAME_REQUIRED(1402, "Tên khoa không được để trống", HttpStatus.BAD_REQUEST),
    DEPARTMENT_NAME_TOO_SHORT(1403, "Tên khoa phải có ít nhất 2 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_NAME_TOO_LONG(1404, "Tên khoa không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_DESCRIPTION_TOO_LONG(1405, "Mô tả khoa không được vượt quá 1000 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_DUPLICATE_NAME(1406, "Tên khoa đã tồn tại trong đơn vị đào tạo", HttpStatus.CONFLICT),
    DEPARTMENT_IN_USE(1407, "Không thể xóa khoa vì có giáo viên hoặc sinh viên đang thuộc khoa này", HttpStatus.CONFLICT),

    // Section related errors (20xx)
    SECTION_NOT_FOUND(2001, "Không tìm thấy phần học", HttpStatus.NOT_FOUND),
    SECTION_TITLE_REQUIRED(2002, "Tiêu đề phần học không được để trống", HttpStatus.BAD_REQUEST),
    SECTION_ORDER_INDEX_INVALID(2003, "Chỉ số thứ tự phần học không hợp lệ", HttpStatus.BAD_REQUEST),
    SECTION_ALREADY_EXISTS(2004, "Phần học đã tồn tại với thứ tự này", HttpStatus.CONFLICT),

    // Course related errors (21xx)
    COURSE_NOT_FOUND(2101, "Không tìm thấy khóa học", HttpStatus.NOT_FOUND),
    COURSE_ACCESS_DENIED(2102, "Không có quyền truy cập khóa học", HttpStatus.FORBIDDEN),
    COURSE_NAME_REQUIRED(2103, "Tên khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_NAME_TOO_LONG(2104, "Tên khóa học không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_NAME_TOO_SHORT(2105, "Tên khóa học phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_INVALID(2106, "Giá khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_NEGATIVE(2107, "Giá khóa học không được âm", HttpStatus.BAD_REQUEST),
    COURSE_ALREADY_PUBLISHED(2108, "Khóa học đã được xuất bản", HttpStatus.CONFLICT),
    COURSE_NOT_APPROVED(2109, "Khóa học chưa được duyệt", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_REQUIRED(2110, "ID giảng viên không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_NOT_FOUND(2111, "Không tìm thấy giảng viên", HttpStatus.NOT_FOUND),
    COURSE_TYPE_REQUIRED(2112, "Loại khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NOT_FOUND(2113, "Không tìm thấy loại khóa học", HttpStatus.NOT_FOUND),
    COURSE_VISIBILITY_INVALID(2114, "Trạng thái hiển thị khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_STATUS_INVALID(2115, "Trạng thái khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_DUPLICATE_NAME(2116, "Tên khóa học đã tồn tại", HttpStatus.CONFLICT),
    COURSE_CANNOT_DELETE_PUBLISHED(2117, "Không thể xóa khóa học đã xuất bản", HttpStatus.CONFLICT),
    COURSE_CANNOT_EDIT_PUBLISHED(2118, "Không thể chỉnh sửa khóa học đã xuất bản", HttpStatus.CONFLICT),
    COURSE_EMPTY_SECTIONS(2119, "Khóa học phải có ít nhất một phần học", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_TOO_HIGH(2120, "Giá khóa học không được vượt quá 10,000,000 VNĐ", HttpStatus.BAD_REQUEST),
    COURSE_DESCRIPTION_TOO_LONG(2121, "Mô tả khóa học không được vượt quá 2000 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_MISMATCH(2122, "Bạn không có quyền chỉnh sửa khóa học này", HttpStatus.FORBIDDEN),
    COURSE_INVALID_SEARCH_CRITERIA(2123, "Tiêu chí tìm kiếm không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_PAGE_SIZE_INVALID(2124, "Kích thước trang phải từ 1 đến 100", HttpStatus.BAD_REQUEST),
    COURSE_PAGE_NUMBER_INVALID(2125, "Số trang phải lớn hơn hoặc bằng 0", HttpStatus.BAD_REQUEST),
    COURSE_CAPACITY_EXCEEDED(2126, "Vượt quá sức chứa tối đa của khóa học", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_ALREADY_EXISTS(2127, "Tên loại khóa học đã tồn tại", HttpStatus.CONFLICT),

    // Course Type related errors (21xx - continued)
    COURSE_TYPE_DUPLICATE_NAME(2131, "Tên loại khóa học đã tồn tại", HttpStatus.CONFLICT),
    COURSE_TYPE_NAME_REQUIRED(2132, "Tên loại khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_TOO_SHORT(2133, "Tên loại khóa học phải có ít nhất 2 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_TOO_LONG(2134, "Tên loại khóa học không được vượt quá 100 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_IN_USE(2135, "Không thể xóa loại khóa học vì có khóa học đang sử dụng", HttpStatus.CONFLICT),

    // Lesson related errors (22xx)
    LESSON_NOT_FOUND(2201, "Không tìm thấy bài học", HttpStatus.NOT_FOUND),
    LESSON_TITLE_REQUIRED(2202, "Tiêu đề bài học không được để trống", HttpStatus.BAD_REQUEST),
    LESSON_CONTENT_REQUIRED(2203, "Nội dung bài học không được để trống", HttpStatus.BAD_REQUEST),
    LESSON_VIDEO_URL_INVALID(2204, "URL video bài học không hợp lệ", HttpStatus.BAD_REQUEST),
    LESSON_NUMBER_ITEM_INVALID(2205, "Số thứ tự bài học không hợp lệ", HttpStatus.BAD_REQUEST),

    // Quiz related errors (23xx)
    QUIZ_NOT_FOUND(2301, "Không tìm thấy bài kiểm tra", HttpStatus.NOT_FOUND),
    QUIZ_TITLE_REQUIRED(2302, "Tiêu đề bài kiểm tra không được để trống", HttpStatus.BAD_REQUEST),
    QUIZ_DURATION_INVALID(2303, "Thời gian làm bài không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPT_LIMIT_INVALID(2304, "Số lần thử không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_PASSING_SCORE_INVALID(2305, "Điểm đạt không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_NO_QUESTIONS(2306, "Bài kiểm tra phải có ít nhất một câu hỏi", HttpStatus.BAD_REQUEST),

    // Question related errors (24xx)
    QUESTION_NOT_FOUND(2401, "Không tìm thấy câu hỏi", HttpStatus.NOT_FOUND),
    QUESTION_TEXT_REQUIRED(2402, "Nội dung câu hỏi không được để trống", HttpStatus.BAD_REQUEST),
    QUESTION_TYPE_INVALID(2403, "Loại câu hỏi không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_SCORE_INVALID(2404, "Điểm số câu hỏi không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_NO_CORRECT_ANSWER(2405, "Câu hỏi phải có ít nhất một đáp án đúng", HttpStatus.BAD_REQUEST),
    QUESTION_INSUFFICIENT_ANSWERS(2406, "Câu hỏi phải có ít nhất hai đáp án", HttpStatus.BAD_REQUEST),

    // Answer related errors (25xx)
    ANSWER_NOT_FOUND(2501, "Không tìm thấy đáp án", HttpStatus.NOT_FOUND),
    ANSWER_CONTENT_REQUIRED(2502, "Nội dung đáp án không được để trống", HttpStatus.BAD_REQUEST),
    ANSWER_ORDER_INDEX_INVALID(2503, "Thứ tự đáp án không hợp lệ", HttpStatus.BAD_REQUEST),

    // Data integrity errors (26xx)
    DATA_INTEGRITY_VIOLATION(2601, "Vi phạm tính toàn vẹn dữ liệu", HttpStatus.CONFLICT),
    FOREIGN_KEY_CONSTRAINT_VIOLATION(2602, "Vi phạm ràng buộc khóa ngoại", HttpStatus.CONFLICT),
    CONCURRENT_MODIFICATION(2603, "Dữ liệu đã được thay đổi bởi người dùng khác", HttpStatus.CONFLICT),

    // Validation errors (27xx)
    INVALID_DATE_FORMAT(2701, "Định dạng ngày không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_BOOLEAN_VALUE(2702, "Giá trị boolean không hợp lệ", HttpStatus.BAD_REQUEST),
    REQUIRED_FIELD_MISSING(2703, "Trường bắt buộc bị thiếu", HttpStatus.BAD_REQUEST),
    FIELD_VALUE_TOO_LONG(2704, "Giá trị trường quá dài", HttpStatus.BAD_REQUEST),
    FIELD_VALUE_TOO_SHORT(2705, "Giá trị trường quá ngắn", HttpStatus.BAD_REQUEST),

    // Class related errors (29xx)
    CLASS_NOT_FOUND(2901, "Không tìm thấy lớp học", HttpStatus.NOT_FOUND),
    CLASS_CODE_ALREADY_EXISTS(2902, "Mã lớp học đã tồn tại", HttpStatus.CONFLICT),
    CLASS_NAME_REQUIRED(2903, "Tên lớp học không được để trống", HttpStatus.BAD_REQUEST),
    CLASS_CODE_REQUIRED(2904, "Mã lớp học không được để trống", HttpStatus.BAD_REQUEST),
    CLASS_MAX_STUDENTS_INVALID(2905, "Số lượng sinh viên tối đa phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    CLASS_HAS_ENROLLED_STUDENTS(2906, "Không thể xóa lớp học vì có sinh viên đang học", HttpStatus.CONFLICT),
    CLASS_CAPACITY_EXCEEDED(2907, "Vượt quá sức chứa tối đa của lớp học", HttpStatus.BAD_REQUEST),
    CLASS_ENROLLMENT_FAILED(2908, "Không thể ghi danh sinh viên vào lớp học", HttpStatus.BAD_REQUEST),
    CLASS_STUDENT_NOT_ENROLLED(2909, "Sinh viên chưa được ghi danh vào lớp học này", HttpStatus.BAD_REQUEST),

    // Course Enrollment related errors (28xx)
    ENROLLMENT_NOT_FOUND(2801, "Không tìm thấy thông tin ghi danh", HttpStatus.NOT_FOUND),
    COURSE_ENROLLMENT_NOT_FOUND(2802, "Không tìm thấy thông tin ghi danh khóa học", HttpStatus.NOT_FOUND),
    COURSE_ENROLLMENT_FAILED(2803, "Không thể ghi danh sinh viên vào khóa học", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_CAPACITY_EXCEEDED(2804, "Vượt quá sức chứa khóa học", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_ALL_ALREADY_ENROLLED(2805, "Tất cả sinh viên đã được ghi danh vào khóa học này", HttpStatus.CONFLICT),
    COURSE_ENROLLMENT_EMPTY_STUDENT_LIST(2806, "Danh sách sinh viên không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_DUPLICATE_STUDENTS(2807, "Tìm thấy sinh viên trùng lặp trong danh sách ghi danh", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_BATCH_SIZE_EXCEEDED(2808, "Vượt quá giới hạn số lượng ghi danh theo lô", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_MISMATCH(2809, "Thông tin ghi danh không thuộc về khóa học được chỉ định", HttpStatus.BAD_REQUEST),
    COURSE_UNENROLLMENT_FAILED(2810, "Không thể hủy ghi danh sinh viên khỏi khóa học", HttpStatus.BAD_REQUEST),

    ASSIGNMENT_NOT_FOUND(1070, "Assignment not found", HttpStatus.BAD_REQUEST),
    SUBMISSION_NOT_FOUND(1071, "Submission not found", HttpStatus.BAD_REQUEST),

    COURSE_NOT_BELONG_TO_EDUCATIONAL_UNIT(1005, "Course does not belong to this educational unit", HttpStatus.BAD_REQUEST),

    INVALID_FILE_NAME(400, "Tên file không hợp lệ", HttpStatus.BAD_REQUEST),
    // Email related errors (30xx)
    EMAIL_SENDING_FAILED(3001, "Gửi email thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}