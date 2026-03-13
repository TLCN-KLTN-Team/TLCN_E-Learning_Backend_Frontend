package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.EquivalentCourseRequest;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EquivalentCourseService {
    Page<EquivalentCourseResponse> getAllEquivalentCourses(String keyword, Integer targetCourseId, Pageable pageable);
    EquivalentCourseResponse createEquivalentCourse(EquivalentCourseRequest request);
    EquivalentCourseResponse updateEquivalentCourse(Integer id, EquivalentCourseRequest request);
    void deleteEquivalentCourse(Integer id);
}
