package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.EquivalentCourseRequest;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.EquivalentCourse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.mapper.EquivalentCourseMapper;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.EquivalentCourseRepository;
import com.hoangphihiep.repository.PublishedCourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EquivalentCourseService {

    private final EquivalentCourseRepository equivalentCourseRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CourseRepository courseRepository;
    private final EquivalentCourseMapper equivalentCourseMapper;

    public Page<EquivalentCourseResponse> getAllEquivalentCourses(String keyword, Integer targetCourseId, Pageable pageable) {
        return equivalentCourseRepository.searchEquivalentCourses(keyword, targetCourseId, pageable)
                .map(equivalentCourseMapper::toResponse);
    }

    @Transactional
    public EquivalentCourseResponse createEquivalentCourse(EquivalentCourseRequest request) {
        // Validation: Duplicate Check
        if (equivalentCourseRepository.existsBySourceCourseIdAndTargetCourseId(
                request.getSourceCourseId(), request.getTargetCourseId())) {
            throw new RuntimeException("This equivalent course mapping already exists.");
        }

        PublishedCourse sourceCourse = publishedCourseRepository.findById(request.getSourceCourseId())
                .orElseThrow(() -> new RuntimeException("Source course not found with id: " + request.getSourceCourseId()));
        
        Course targetCourse = courseRepository.findById(request.getTargetCourseId())
                .orElseThrow(() -> new RuntimeException("Target course not found with id: " + request.getTargetCourseId()));

        EquivalentCourse equivalentCourse = equivalentCourseMapper.toEntity(request);
        equivalentCourse.setSourceCourse(sourceCourse);
        equivalentCourse.setTargetCourse(targetCourse);

        EquivalentCourse savedCourse = equivalentCourseRepository.save(equivalentCourse);
        return equivalentCourseMapper.toResponse(savedCourse);
    }

    @Transactional
    public EquivalentCourseResponse updateEquivalentCourse(Integer id, EquivalentCourseRequest request) {
        EquivalentCourse equivalentCourse = equivalentCourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equivalent course not found with id: " + id));

        // Check if source/target changed and if it creates duplicate
        if ((!equivalentCourse.getSourceCourse().getId().equals(request.getSourceCourseId()) ||
             !equivalentCourse.getTargetCourse().getId().equals(request.getTargetCourseId())) &&
            equivalentCourseRepository.existsBySourceCourseIdAndTargetCourseId(request.getSourceCourseId(), request.getTargetCourseId())) {
            throw new RuntimeException("This equivalent course mapping already exists.");
        }

        PublishedCourse sourceCourse = publishedCourseRepository.findById(request.getSourceCourseId())
                .orElseThrow(() -> new RuntimeException("Source course not found with id: " + request.getSourceCourseId()));
        
        Course targetCourse = courseRepository.findById(request.getTargetCourseId())
                .orElseThrow(() -> new RuntimeException("Target course not found with id: " + request.getTargetCourseId()));

        equivalentCourseMapper.updateEntity(equivalentCourse, request);
        equivalentCourse.setSourceCourse(sourceCourse);
        equivalentCourse.setTargetCourse(targetCourse);

        EquivalentCourse updatedCourse = equivalentCourseRepository.save(equivalentCourse);
        return equivalentCourseMapper.toResponse(updatedCourse);
    }

    @Transactional
    public void deleteEquivalentCourse(Integer id) {
        if (!equivalentCourseRepository.existsById(id)) {
            throw new RuntimeException("Equivalent course not found with id: " + id);
        }
        equivalentCourseRepository.deleteById(id);
    }
}
