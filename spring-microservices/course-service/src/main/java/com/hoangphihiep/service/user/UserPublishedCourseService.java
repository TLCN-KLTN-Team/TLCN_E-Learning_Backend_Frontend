package com.hoangphihiep.service.user;

import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.PublishedCourseCardResponse;
import com.hoangphihiep.dto.response.PublishedCourseDetailResponse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.PublishedCourseMapper;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.CurrencyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserPublishedCourseService {
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final PublishedCourseSearchService publishedCourseSearchService;
    private final TeacherRepository teacherApi;

    public PaginatedResponse<PublishedCourseCardResponse> getPublishedCoursesWithPaging(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PublishedCourse> publishedCourses = publishedCourseRepository.findAll(pageable);
        List<PublishedCourseCardResponse> courseCardResponses = publishedCourses.stream()
                .map(publishedCourse -> {
                    PublishedCourseCardResponse response = PublishedCourseCardResponse.builder()
                            .id(publishedCourse.getId())
                            .courseName(publishedCourse.getCourse().getCourseName())
                            .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                            .authorName("...") // Placeholder for author name
                            .build();

                    return response;
                }).toList();

        return PaginatedResponse.<PublishedCourseCardResponse>builder()
                .content(courseCardResponses)
                .size(pageable.getPageSize())
                .page(pageable.getPageNumber())
                .totalElements(publishedCourses.getTotalElements())
                .totalPages(publishedCourses.getTotalPages())
                .build();
    }

    public PublishedCourseDetailResponse getPublishedCourseDetailById(Long publishedCourseId){
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId).orElseThrow(
                () -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND)
        );

        return this.toPublishedCourseDetailResponse(publishedCourse);
    }

    private PublishedCourseDetailResponse toPublishedCourseDetailResponse(PublishedCourse publishedCourse) {
        // calculate duration, rating, student count, etc.

        try {
            var teacher = teacherApi.getTeacherByTeacherId(publishedCourse.getCourse().getIdTeacher()).getResult();

            // build contents
//            PublishedCourseContentResponse contentResponse = PublishedCourseContentResponse.builder()
//
//                    .build();

            PublishedCourseDetailResponse response = PublishedCourseDetailResponse.builder()
                    .courseName(publishedCourse.getCourse().getCourseName())
                    .description(publishedCourse.getCourse().getDescription())
                    .thumbnailUrl(publishedCourse.getCourseDetail().getCourseImage())
                    .whatYouWillLearn(publishedCourse.getCourseDetail().getCourseIntroduction())
                    .targetAudience(publishedCourse.getCourseDetail().getLearnerAchievements())
                    .authorName(teacher.getFirstName() + " " + teacher.getLastName())
                    .coursePrice(currencyUtils.formatCurrency(publishedCourse.getCoursePrice()))
                    .build();

            return response;
        } catch (AppException e) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }
    }


}
