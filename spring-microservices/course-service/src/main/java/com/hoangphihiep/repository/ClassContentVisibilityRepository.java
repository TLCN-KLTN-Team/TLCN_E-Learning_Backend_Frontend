package com.hoangphihiep.repository;

import com.hoangphihiep.entity.ClassContentVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassContentVisibilityRepository extends JpaRepository<ClassContentVisibility, Integer> {

    List<ClassContentVisibility> findByContentTypeAndContentId(String contentType, Integer contentId);

    List<ClassContentVisibility> findByCourseClassId(Integer classId);

    boolean existsByCourseClassIdAndContentTypeAndContentIdAndIsVisible(
            Integer classId, String contentType, Integer contentId, Boolean isVisible);
}