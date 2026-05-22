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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EquivalentCourseService {

    private static final double DEFAULT_CERTIFICATE_WEIGHT = 0.4;
    private static final double DEFAULT_INTERVIEW_WEIGHT = 0.6;
    private static final double DEFAULT_APPROVAL_THRESHOLD = 7.0;

    private final EquivalentCourseRepository equivalentCourseRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CourseRepository courseRepository;
    private final EquivalentCourseMapper equivalentCourseMapper;

    public Page<EquivalentCourseResponse> getAllEquivalentCourses(String keyword, Integer targetCourseId, String expertId, Pageable pageable) {
        return equivalentCourseRepository.searchEquivalentCourses(keyword, targetCourseId, expertId, pageable)
                .map(equivalentCourseMapper::toResponse);
    }

    public Page<EquivalentCourseResponse> getAllEquivalentCourses(String keyword, Integer targetCourseId, Pageable pageable) {
        return getAllEquivalentCourses(keyword, targetCourseId, null, pageable);
    }

    public Page<EquivalentCourseResponse> getAllEquivalentCoursesByEducationalUnit(String keyword, Integer targetCourseId, Integer educationalUnitId, Pageable pageable) {
        return equivalentCourseRepository.searchEquivalentCoursesByEducationalUnit(keyword, targetCourseId, educationalUnitId, pageable)
                .map(equivalentCourseMapper::toResponse);
    }

    @Transactional
    public EquivalentCourseResponse createEquivalentCourse(EquivalentCourseRequest request) {
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Validation: Duplicate Check
        if (equivalentCourseRepository.existsBySourceCourseIdAndTargetCourseId(
                request.getSourceCourseId(), request.getTargetCourseId())) {
            throw new RuntimeException("This equivalent course mapping already exists.");
        }

        PublishedCourse sourceCourse = publishedCourseRepository.findById(request.getSourceCourseId())
                .orElseThrow(() -> new RuntimeException("Source course not found with id: " + request.getSourceCourseId()));
        
        Course targetCourse = courseRepository.findById(request.getTargetCourseId())
                .orElseThrow(() -> new RuntimeException("Target course not found with id: " + request.getTargetCourseId()));

        validateTargetCourseOwnership(targetCourse, currentExpertId);

        EquivalentCourse equivalentCourse = equivalentCourseMapper.toEntity(request);
        equivalentCourse.setSourceCourse(sourceCourse);
        equivalentCourse.setTargetCourse(targetCourse);
        applyDecisionRuleDefaultsAndValidation(equivalentCourse);

        EquivalentCourse savedCourse = equivalentCourseRepository.save(equivalentCourse);
        return equivalentCourseMapper.toResponse(savedCourse);
    }

    @Transactional
    public EquivalentCourseResponse updateEquivalentCourse(Integer id, EquivalentCourseRequest request) {
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();

        EquivalentCourse equivalentCourse = equivalentCourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equivalent course not found with id: " + id));

        validateTargetCourseOwnership(equivalentCourse.getTargetCourse(), currentExpertId);

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

        validateTargetCourseOwnership(targetCourse, currentExpertId);

        equivalentCourseMapper.updateEntity(equivalentCourse, request);
        equivalentCourse.setSourceCourse(sourceCourse);
        equivalentCourse.setTargetCourse(targetCourse);
        applyDecisionRuleDefaultsAndValidation(equivalentCourse);

        EquivalentCourse updatedCourse = equivalentCourseRepository.save(equivalentCourse);
        return equivalentCourseMapper.toResponse(updatedCourse);
    }

    @Transactional
    public void deleteEquivalentCourse(Integer id) {
        String currentExpertId = SecurityContextHolder.getContext().getAuthentication().getName();

        if (!equivalentCourseRepository.existsByIdAndTargetCourseExpertId(id, currentExpertId)) {
            throw new RuntimeException("Equivalent course not found with id: " + id);
        }
        equivalentCourseRepository.deleteById(id);
    }

    private void validateTargetCourseOwnership(Course targetCourse, String expertId) {
        if (targetCourse == null || targetCourse.getExpertId() == null || !targetCourse.getExpertId().equals(expertId)) {
            throw new RuntimeException("You do not have permission to manage this equivalent course.");
        }
    }

    private void applyDecisionRuleDefaultsAndValidation(EquivalentCourse equivalentCourse) {
        Double certificateWeight = equivalentCourse.getCertificateWeight() != null
                ? equivalentCourse.getCertificateWeight()
                : DEFAULT_CERTIFICATE_WEIGHT;

        Double interviewWeight = equivalentCourse.getInterviewWeight() != null
                ? equivalentCourse.getInterviewWeight()
                : DEFAULT_INTERVIEW_WEIGHT;

        Double approvalThreshold = equivalentCourse.getApprovalThreshold() != null
                ? equivalentCourse.getApprovalThreshold()
                : DEFAULT_APPROVAL_THRESHOLD;

        validateWeight(certificateWeight, "certificateWeight");
        validateWeight(interviewWeight, "interviewWeight");

        if (Math.abs((certificateWeight + interviewWeight) - 1.0) > 0.0001) {
            throw new RuntimeException("Tổng certificateWeight và interviewWeight phải bằng 1.0");
        }

        if (approvalThreshold < 0 || approvalThreshold > 10) {
            throw new RuntimeException("approvalThreshold phải nằm trong khoảng 0 đến 10");
        }

        equivalentCourse.setCertificateWeight(certificateWeight);
        equivalentCourse.setInterviewWeight(interviewWeight);
        equivalentCourse.setApprovalThreshold(approvalThreshold);
    }

    private void validateWeight(Double value, String field) {
        if (value < 0 || value > 1) {
            throw new RuntimeException(field + " phải nằm trong khoảng 0 đến 1");
        }
    }
}
