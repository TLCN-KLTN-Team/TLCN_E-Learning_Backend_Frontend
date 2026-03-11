package com.hcmute.ai_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // System Errors (SYS_xxxx)

    SUCCESS("SYS_1000", "Yêu cầu thành công", HttpStatus.OK),

    UNCATEGORIZED_EXCEPTION("SYS_9999", "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    JSON_PROCESSING_ERROR("SYS_9998", "Lỗi xử lý JSON", HttpStatus.INTERNAL_SERVER_ERROR),
    KAFKA_PUBLISH_FAILED("SYS_9997", "Lỗi khi xuất bản sự kiện Kafka", HttpStatus.INTERNAL_SERVER_ERROR),
    FEIGN_CLIENT_ERROR("SYS_9996", "Lỗi Feign Client", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("SYS_1001", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),

    // Authentication & Authorization errors (AUTH_xxxx)
    INVALID_KEY("AUTH_1001", "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("AUTH_1006", "Không có quyền truy cập", HttpStatus.UNAUTHORIZED),
    UNAUTHENTICATED("AUTH_1007", "Chưa được xác thực", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("AUTH_1008", "Bị cấm truy cập", HttpStatus.FORBIDDEN),
    ACCESS_DENIED("AUTH_1009", "Truy cập bị từ chối", HttpStatus.FORBIDDEN),

    // User Management Errors (USER_xxxx)
    EMAIL_EXISTED("USER_1004", "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    USERNAME_EXISTED("USER_1005", "Username đã tồn tại", HttpStatus.BAD_REQUEST),

    // Instructor related errors (INSTRUCTOR_xxxx)
    INSTRUCTOR_NOT_EXISTED("INSTRUCTOR_1002", "Giảng viên không tồn tại", HttpStatus.NOT_FOUND),
    INSTRUCTOR_CODE_EXISTED("INSTRUCTOR_1003", "ID teacher đã tồn tại", HttpStatus.BAD_REQUEST),
    
    // Student related errors (STUDENT_xxxx)
    STUDENT_CODE_EXISTED("STUDENT_1010", "ID student đã tồn tại", HttpStatus.BAD_REQUEST),
    STUDENT_NOT_FOUND("STUDENT_1301", "Không tìm thấy sinh viên", HttpStatus.NOT_FOUND),
    STUDENT_NOT_BELONGS_TO_INSTITUTION("STUDENT_1302", "Sinh viên không thuộc đơn vị đào tạo này", HttpStatus.BAD_REQUEST),
    STUDENT_VALIDATION_FAILED("STUDENT_1303", "Xác thực sinh viên thất bại", HttpStatus.BAD_REQUEST),
    STUDENT_ALREADY_ENROLLED("STUDENT_1304", "Sinh viên đã được ghi danh vào khóa học này", HttpStatus.CONFLICT),

    // Educational Unit related errors (EDU_xxxx)
    EDUCATIONAL_UNIT_NOT_FOUND("EDU_1101", "Không tìm thấy đơn vị đào tạo", HttpStatus.NOT_FOUND),

    // Teacher related errors (TEACHER_xxxx)
    TEACHER_NOT_FOUND("TEACHER_1201", "Không tìm thấy giảng viên", HttpStatus.NOT_FOUND),
    TEACHER_NOT_BELONGS_TO_INSTITUTION("TEACHER_1202", "Giảng viên không thuộc đơn vị đào tạo này", HttpStatus.BAD_REQUEST),
    TEACHER_VALIDATION_FAILED("TEACHER_1203", "Xác thực giảng viên thất bại", HttpStatus.BAD_REQUEST),

    // Department related errors (DEPT_xxxx)
    DEPARTMENT_NOT_FOUND("DEPT_1401", "Không tìm thấy khoa", HttpStatus.NOT_FOUND),
    DEPARTMENT_NAME_REQUIRED("DEPT_1402", "Tên khoa không được để trống", HttpStatus.BAD_REQUEST),
    DEPARTMENT_NAME_TOO_SHORT("DEPT_1403", "Tên khoa phải có ít nhất 2 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_NAME_TOO_LONG("DEPT_1404", "Tên khoa không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_DESCRIPTION_TOO_LONG("DEPT_1405", "Mô tả khoa không được vượt quá 1000 ký tự", HttpStatus.BAD_REQUEST),
    DEPARTMENT_DUPLICATE_NAME("DEPT_1406", "Tên khoa đã tồn tại trong đơn vị đào tạo", HttpStatus.CONFLICT),
    DEPARTMENT_IN_USE("DEPT_1407", "Không thể xóa khoa vì có giáo viên hoặc sinh viên đang thuộc khoa này", HttpStatus.CONFLICT),

    // Section related errors (SECTION_xxxx)
    SECTION_NOT_FOUND("SECTION_2001", "Không tìm thấy phần học", HttpStatus.NOT_FOUND),
    SECTION_TITLE_REQUIRED("SECTION_2002", "Tiêu đề phần học không được để trống", HttpStatus.BAD_REQUEST),
    SECTION_ORDER_INDEX_INVALID("SECTION_2003", "Chỉ số thứ tự phần học không hợp lệ", HttpStatus.BAD_REQUEST),
    SECTION_ALREADY_EXISTS("SECTION_2004", "Phần học đã tồn tại với thứ tự này", HttpStatus.CONFLICT),

    // Course related errors (COURSE_xxxx)
    COURSE_NOT_FOUND("COURSE_2101", "Không tìm thấy khóa học", HttpStatus.NOT_FOUND),
    COURSE_ACCESS_DENIED("COURSE_2102", "Không có quyền truy cập khóa học", HttpStatus.FORBIDDEN),
    COURSE_NAME_REQUIRED("COURSE_2103", "Tên khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_NAME_TOO_LONG("COURSE_2104", "Tên khóa học không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_NAME_TOO_SHORT("COURSE_2105", "Tên khóa học phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_INVALID("COURSE_2106", "Giá khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_NEGATIVE("COURSE_2107", "Giá khóa học không được âm", HttpStatus.BAD_REQUEST),
    COURSE_ALREADY_PUBLISHED("COURSE_2108", "Khóa học đã được xuất bản", HttpStatus.CONFLICT),
    COURSE_NOT_APPROVED("COURSE_2109", "Khóa học chưa được duyệt", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_REQUIRED("COURSE_2110", "ID giảng viên không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_NOT_FOUND("COURSE_2111", "Không tìm thấy giảng viên", HttpStatus.NOT_FOUND),
    COURSE_TYPE_REQUIRED("COURSE_2112", "Loại khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NOT_FOUND("COURSE_2113", "Không tìm thấy loại khóa học", HttpStatus.NOT_FOUND),
    COURSE_VISIBILITY_INVALID("COURSE_2114", "Trạng thái hiển thị khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_STATUS_INVALID("COURSE_2115", "Trạng thái khóa học không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_DUPLICATE_NAME("COURSE_2116", "Tên khóa học đã tồn tại", HttpStatus.CONFLICT),
    COURSE_CANNOT_DELETE_PUBLISHED("COURSE_2117", "Không thể xóa khóa học đã xuất bản", HttpStatus.CONFLICT),
    COURSE_CANNOT_EDIT_PUBLISHED("COURSE_2118", "Không thể chỉnh sửa khóa học đã xuất bản", HttpStatus.CONFLICT),
    COURSE_NOT_PUBLIC("COURSE_2119", "Khóa học không phải là khóa học công khai (có phí)", HttpStatus.BAD_REQUEST),
    COURSE_EMPTY_SECTIONS("COURSE_2119B", "Khóa học phải có ít nhất một phần học", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_TOO_HIGH("COURSE_2120", "Giá khóa học không được vượt quá 10,000,000 VNĐ", HttpStatus.BAD_REQUEST),
    COURSE_DESCRIPTION_TOO_LONG("COURSE_2121", "Mô tả khóa học không được vượt quá 2000 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TEACHER_MISMATCH("COURSE_2122", "Bạn không có quyền chỉnh sửa khóa học này", HttpStatus.FORBIDDEN),
    COURSE_INVALID_SEARCH_CRITERIA("COURSE_2123", "Tiêu chí tìm kiếm không hợp lệ", HttpStatus.BAD_REQUEST),
    COURSE_PAGE_SIZE_INVALID("COURSE_2124", "Kích thước trang phải từ 1 đến 100", HttpStatus.BAD_REQUEST),
    COURSE_PAGE_NUMBER_INVALID("COURSE_2125", "Số trang phải lớn hơn hoặc bằng 0", HttpStatus.BAD_REQUEST),
    COURSE_CAPACITY_EXCEEDED("COURSE_2126", "Vượt quá sức chứa tối đa của khóa học", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_ALREADY_EXISTS("COURSE_2127", "Tên loại khóa học đã tồn tại", HttpStatus.CONFLICT),
    COURSE_TYPE_DUPLICATE_NAME("COURSE_2131", "Tên loại khóa học đã tồn tại", HttpStatus.CONFLICT),
    COURSE_TYPE_NAME_REQUIRED("COURSE_2132", "Tên loại khóa học không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_TOO_SHORT("COURSE_2133", "Tên loại khóa học phải có ít nhất 2 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_NAME_TOO_LONG("COURSE_2134", "Tên loại khóa học không được vượt quá 100 ký tự", HttpStatus.BAD_REQUEST),
    COURSE_TYPE_IN_USE("COURSE_2135", "Không thể xóa loại khóa học vì có khóa học đang sử dụng", HttpStatus.CONFLICT),
    COURSE_NOT_BELONG_TO_EDUCATIONAL_UNIT("COURSE_2136", "Course does not belong to this educational unit", HttpStatus.BAD_REQUEST),
    COURSE_NOT_ENROLLED("COURSE_9001", "Bạn chưa đăng ký hoặc mua khóa học này", HttpStatus.FORBIDDEN),

    // Lesson related errors (LESSON_xxxx)
    LESSON_NOT_FOUND("LESSON_2201", "Không tìm thấy bài học", HttpStatus.NOT_FOUND),
    LESSON_TITLE_REQUIRED("LESSON_2202", "Tiêu đề bài học không được để trống", HttpStatus.BAD_REQUEST),
    LESSON_CONTENT_REQUIRED("LESSON_2203", "Nội dung bài học không được để trống", HttpStatus.BAD_REQUEST),
    LESSON_VIDEO_URL_INVALID("LESSON_2204", "URL video bài học không hợp lệ", HttpStatus.BAD_REQUEST),
    LESSON_NUMBER_ITEM_INVALID("LESSON_2205", "Số thứ tự bài học không hợp lệ", HttpStatus.BAD_REQUEST),

    // Quiz related errors (QUIZ_xxxx)
    QUIZ_NOT_FOUND("QUIZ_2301", "Không tìm thấy bài kiểm tra", HttpStatus.NOT_FOUND),
    QUIZ_TITLE_REQUIRED("QUIZ_2302", "Tiêu đề bài kiểm tra không được để trống", HttpStatus.BAD_REQUEST),
    QUIZ_DURATION_INVALID("QUIZ_2303", "Thời gian làm bài không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPT_LIMIT_INVALID("QUIZ_2304", "Số lần thử không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_PASSING_SCORE_INVALID("QUIZ_2305", "Điểm đạt không hợp lệ", HttpStatus.BAD_REQUEST),
    QUIZ_NO_QUESTIONS("QUIZ_2306", "Bài kiểm tra phải có ít nhất một câu hỏi", HttpStatus.BAD_REQUEST),
    QUIZ_NOT_STARTED("QUIZ_2307", "Quiz has not started yet", HttpStatus.BAD_REQUEST),
    QUIZ_ENDED("QUIZ_2308", "Quiz has ended", HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPT_LIMIT_REACHED("QUIZ_2309", "Quiz attempt limit reached", HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPT_NOT_FOUND("QUIZ_2310", "Quiz attempt not found", HttpStatus.BAD_REQUEST),

    // Question related errors (QUESTION_xxxx)
    QUESTION_NOT_FOUND("QUESTION_2401", "Không tìm thấy câu hỏi", HttpStatus.NOT_FOUND),
    QUESTION_TEXT_REQUIRED("QUESTION_2402", "Nội dung câu hỏi không được để trống", HttpStatus.BAD_REQUEST),
    QUESTION_TYPE_INVALID("QUESTION_2403", "Loại câu hỏi không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_SCORE_INVALID("QUESTION_2404", "Điểm số câu hỏi không hợp lệ", HttpStatus.BAD_REQUEST),
    QUESTION_NO_CORRECT_ANSWER("QUESTION_2405", "Câu hỏi phải có ít nhất một đáp án đúng", HttpStatus.BAD_REQUEST),
    QUESTION_INSUFFICIENT_ANSWERS("QUESTION_2406", "Câu hỏi phải có ít nhất hai đáp án", HttpStatus.BAD_REQUEST),

    // Answer related errors (ANSWER_xxxx)
    ANSWER_NOT_FOUND("ANSWER_2501", "Không tìm thấy đáp án", HttpStatus.NOT_FOUND),
    ANSWER_CONTENT_REQUIRED("ANSWER_2502", "Nội dung đáp án không được để trống", HttpStatus.BAD_REQUEST),
    ANSWER_ORDER_INDEX_INVALID("ANSWER_2503", "Thứ tự đáp án không hợp lệ", HttpStatus.BAD_REQUEST),

    // Data integrity errors (DATA_xxxx)
    DATA_INTEGRITY_VIOLATION("DATA_2601", "Vi phạm tính toàn vẹn dữ liệu", HttpStatus.CONFLICT),
    FOREIGN_KEY_CONSTRAINT_VIOLATION("DATA_2602", "Vi phạm ràng buộc khóa ngoại", HttpStatus.CONFLICT),
    CONCURRENT_MODIFICATION("DATA_2603", "Dữ liệu đã được thay đổi bởi người dùng khác", HttpStatus.CONFLICT),

    // Validation errors (VALID_xxxx)
    INVALID_DATE_FORMAT("VALID_2701", "Định dạng ngày không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_BOOLEAN_VALUE("VALID_2702", "Giá trị boolean không hợp lệ", HttpStatus.BAD_REQUEST),
    REQUIRED_FIELD_MISSING("VALID_2703", "Trường bắt buộc bị thiếu", HttpStatus.BAD_REQUEST),
    FIELD_VALUE_TOO_LONG("VALID_2704", "Giá trị trường quá dài", HttpStatus.BAD_REQUEST),
    FIELD_VALUE_TOO_SHORT("VALID_2705", "Giá trị trường quá ngắn", HttpStatus.BAD_REQUEST),
    INVALID_SCORE("VALID_1041", "Score is invalid or exceeds maximum allowed", HttpStatus.BAD_REQUEST),

    // Class related errors (CLASS_xxxx)
    CLASS_NOT_FOUND("CLASS_2901", "Không tìm thấy lớp học", HttpStatus.NOT_FOUND),
    CLASS_CODE_ALREADY_EXISTS("CLASS_2902", "Mã lớp học đã tồn tại", HttpStatus.CONFLICT),
    CLASS_NAME_REQUIRED("CLASS_2903", "Tên lớp học không được để trống", HttpStatus.BAD_REQUEST),
    CLASS_CODE_REQUIRED("CLASS_2904", "Mã lớp học không được để trống", HttpStatus.BAD_REQUEST),
    CLASS_MAX_STUDENTS_INVALID("CLASS_2905", "Số lượng sinh viên tối đa phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    CLASS_HAS_ENROLLED_STUDENTS("CLASS_2906", "Không thể xóa lớp học vì có sinh viên đang học", HttpStatus.CONFLICT),
    CLASS_CAPACITY_EXCEEDED("CLASS_2907", "Vượt quá sức chứa tối đa của lớp học", HttpStatus.BAD_REQUEST),
    CLASS_ENROLLMENT_FAILED("CLASS_2908", "Không thể ghi danh sinh viên vào lớp học", HttpStatus.BAD_REQUEST),
    CLASS_STUDENT_NOT_ENROLLED("CLASS_2909", "Sinh viên chưa được ghi danh vào lớp học này", HttpStatus.BAD_REQUEST),
    COURSE_CLASS_NOT_FOUND("CLASS_3101", "Không tìm thấy lớp học", HttpStatus.NOT_FOUND),

    // Course Enrollment related errors (ENROLL_xxxx)
    ENROLLMENT_NOT_FOUND("ENROLL_2801", "Không tìm thấy thông tin ghi danh", HttpStatus.NOT_FOUND),
    COURSE_ENROLLMENT_NOT_FOUND("ENROLL_2802", "Không tìm thấy thông tin ghi danh khóa học", HttpStatus.NOT_FOUND),
    COURSE_ENROLLMENT_FAILED("ENROLL_2803", "Không thể ghi danh sinh viên vào khóa học", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_CAPACITY_EXCEEDED("ENROLL_2804", "Vượt quá sức chứa khóa học", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_ALL_ALREADY_ENROLLED("ENROLL_2805", "Tất cả sinh viên đã được ghi danh vào khóa học này", HttpStatus.CONFLICT),
    COURSE_ENROLLMENT_EMPTY_STUDENT_LIST("ENROLL_2806", "Danh sách sinh viên không được để trống", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_DUPLICATE_STUDENTS("ENROLL_2807", "Tìm thấy sinh viên trùng lặp trong danh sách ghi danh", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_BATCH_SIZE_EXCEEDED("ENROLL_2808", "Vượt quá giới hạn số lượng ghi danh theo lô", HttpStatus.BAD_REQUEST),
    COURSE_ENROLLMENT_MISMATCH("ENROLL_2809", "Thông tin ghi danh không thuộc về khóa học được chỉ định", HttpStatus.BAD_REQUEST),
    COURSE_UNENROLLMENT_FAILED("ENROLL_2810", "Không thể hủy ghi danh sinh viên khỏi khóa học", HttpStatus.BAD_REQUEST),
    USER_NOT_ENROLLED("ENROLL_9001", "Bạn chưa đăng ký hoặc mua khóa học này", HttpStatus.FORBIDDEN),

    // Assignment related errors (ASSIGN_xxxx)
    ASSIGNMENT_NOT_FOUND("ASSIGN_1070", "Assignment not found", HttpStatus.BAD_REQUEST),
    SUBMISSION_NOT_FOUND("ASSIGN_1071", "Submission not found", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_ALREADY_SUBMITTED("ASSIGN_1072", "Assignment already submitted", HttpStatus.BAD_REQUEST),
    SUBMISSION_ALREADY_GRADED("ASSIGN_1073", "Submission already graded, cannot be modified", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_DEADLINE_PASSED("ASSIGN_1074", "Assignment deadline has passed", HttpStatus.BAD_REQUEST),
    DEADLINE_PASSED("ASSIGN_1075", "Deadline has passed", HttpStatus.BAD_REQUEST),

    // Published Course related errors (PUBLISH_xxxx)
    PUBLISHED_COURSE_CANNOT_UPDATE("PUBLISH_2302", "Cannot update published course in current status", HttpStatus.BAD_REQUEST),
    PUBLISHED_COURSE_ALREADY_SUBMITTED("PUBLISH_2303", "Published course already submitted for approval", HttpStatus.BAD_REQUEST),
    PUBLISHED_COURSE_NOT_PENDING("PUBLISH_2304", "Published course is not in pending status", HttpStatus.BAD_REQUEST),
    COURSE_DETAIL_REQUIRED("PUBLISH_2305", "Course detail is required for publishing", HttpStatus.BAD_REQUEST),
    COURSE_DETAIL_DESCRIPTION_REQUIRED("PUBLISH_2306", "Course detail description is required", HttpStatus.BAD_REQUEST),
    COURSE_DETAIL_INTRODUCTION_REQUIRED("PUBLISH_2307", "Course detail introduction is required", HttpStatus.BAD_REQUEST),
    COURSE_NO_PUBLISHED_CONTENT("PUBLISH_2308", "Course must have at least one published section with content", HttpStatus.BAD_REQUEST),
    PUBLISHED_COURSE_NOT_FOUND("PUBLISH_3201", "Không tìm thấy khóa học đã xuất bản", HttpStatus.NOT_FOUND),

    // File related errors (FILE_xxxx)
    INVALID_FILE_NAME("FILE_400", "Tên file không hợp lệ", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("FILE_1027", "Failed to upload file", HttpStatus.INTERNAL_SERVER_ERROR),

    // Email related errors (EMAIL_xxxx)
    EMAIL_SENDING_FAILED("EMAIL_3001", "Gửi email thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Payment related errors (PAYMENT_xxxx)
    PAYPAL_CREATE_PAYMENT_FAILED("PAYMENT_4001", "Tạo thanh toán PayPal thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    PAYPAL_CAPTURE_PAYMENT_FAILED("PAYMENT_4002", "Xác nhận thanh toán PayPal thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    UNSUPPORTED_CURRENCY("PAYMENT_4003", "Loại tiền tệ không được hỗ trợ", HttpStatus.BAD_REQUEST),

    // Order related errors (ORDER_xxxx)
    ORDER_NOT_FOUND("ORDER_5001", "Order not found", HttpStatus.NOT_FOUND),

    // Cart related errors (CART_xxxx)
    CART_NOT_FOUND("CART_6001", "Cart not found", HttpStatus.NOT_FOUND),
    COURSE_ALREADY_IN_CART("CART_6002", "Course already in cart", HttpStatus.BAD_REQUEST),
    COURSE_NOT_IN_CART("CART_6003", "Course not in cart", HttpStatus.BAD_REQUEST),
    CART_ALREADY_EXISTS("CART_6004", "Cart already exists", HttpStatus.BAD_REQUEST),

    // Wishlist related errors (WISH_xxxx)
    WISHLIST_NOT_FOUND("WISH_7001", "Wishlist not found", HttpStatus.NOT_FOUND),
    COURSE_ALREADY_IN_WISHLIST("WISH_7002", "Course already in wishlist", HttpStatus.BAD_REQUEST),
    COURSE_NOT_IN_WISHLIST("WISH_7003", "Course not in wishlist", HttpStatus.NOT_FOUND),

    // Elasticsearch related errors (ES_xxxx)
    ELASTICSEARCH_OPERATION_FAILED("ES_8001", "Elasticsearch operation failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // Educational Unit Status related errors (EDU_STATUS_xxxx)
    CHANGE_EDUCATIONAL_UNIT_STATUS_FAILED("EDU_STATUS_9002", "Change educationalUnit status failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // AI Service related errors (AI_xxxx)
    AI_SERVICE_UNAVAILABLE("AI_9001", "AI service không khả dụng", HttpStatus.SERVICE_UNAVAILABLE),
    AI_QUIZ_GENERATION_FAILED("AI_9002", "Không thể tạo quiz từ AI service", HttpStatus.INTERNAL_SERVER_ERROR),
    AI_SERVICE_TIMEOUT("AI_9003", "AI service timeout", HttpStatus.REQUEST_TIMEOUT),
    AI_INVALID_RESPONSE("AI_9004", "Phản hồi từ AI service không hợp lệ", HttpStatus.INTERNAL_SERVER_ERROR),

    FLASHCARD_EXISTING("FLASHCARD_1001", "Bộ flashcard đã tồn tại", HttpStatus.CONFLICT),
    FLASHCARD_NOT_FOUND("FLASHCARD_1002", "Không tìm thấy bộ flashcard", HttpStatus.NOT_FOUND),
    ;

    ErrorCode(String code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final String code;
    private final String message;
    private final HttpStatusCode statusCode;
}