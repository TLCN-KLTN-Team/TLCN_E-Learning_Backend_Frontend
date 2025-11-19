package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Integer> {

    List<Section> findByCourseId(int courseId);

    @Query("SELECT s FROM Section s WHERE s.course.id = :courseId ORDER BY s.orderIndex")
    List<Section> findByCourseIdOrderByOrderIndex(@Param("courseId") int courseId);

    @Query("SELECT s FROM Section s " +
            "WHERE s.course.id = :courseId " +
            "AND EXISTS (" +
            "    SELECT 1 FROM ClassContentVisibility cv " +
            "    WHERE cv.courseClass.id = :classId " +
            "    AND cv.contentType = 'SECTION' " +
            "    AND cv.contentId = s.id " +
            "    AND cv.isVisible = true" +
            ") " +
            "ORDER BY s.orderIndex")
    List<Section> findVisibleSectionsByClassId(@Param("courseId") Integer courseId,
                                               @Param("classId") Integer classId);

    @Query("SELECT s FROM Section s WHERE s.course.id = :courseId AND s.isPublished = true ORDER BY s.orderIndex")
    List<Section> findByCourse_IdAndIsPublishedTrue(@Param("courseId") Integer courseId);

}
