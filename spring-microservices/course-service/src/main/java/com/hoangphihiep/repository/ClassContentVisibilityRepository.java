package com.hoangphihiep.repository;

import com.hoangphihiep.entity.ClassContentVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassContentVisibilityRepository extends JpaRepository<ClassContentVisibility, Integer> {

    List<ClassContentVisibility> findByContentTypeAndContentId(String contentType, Integer contentId);

    void deleteByContentTypeAndContentId(String contentType, Integer contentId);

    // NEW: Thêm method để check visibility theo class
    List<ClassContentVisibility> findByCourseClassIdAndContentTypeAndIsVisible(
            Integer classId, String contentType, Boolean isVisible);

    // NEW: Thêm method để check một content cụ thể
    boolean existsByCourseClassIdAndContentTypeAndContentIdAndIsVisible(
            Integer classId, String contentType, Integer contentId, Boolean isVisible);
}