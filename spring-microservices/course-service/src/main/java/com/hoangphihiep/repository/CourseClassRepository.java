package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, Integer> {

    @Query("SELECT cc FROM CourseClass cc WHERE cc.course.id = :courseId AND cc.isArchived = false")
    List<CourseClass> findByCourseId(Integer courseId);

    Page<CourseClass> findByCourseIdAndIsArchivedFalse(Integer courseId, Pageable pageable);

    boolean existsByClassCode(String classCode);

    @Query("SELECT cc FROM CourseClass cc WHERE cc.course.educationalUnit.id = :educationalUnitId " +
            "AND cc.isArchived = false " +
            "AND (:search IS NULL OR cc.className LIKE %:search% OR cc.classCode LIKE %:search%)")
    Page<CourseClass> findByEducationalUnitIdWithSearch(@Param("educationalUnitId") Integer educationalUnitId,
                                                    @Param("search") String search,
                                                    Pageable pageable);

    @Query("SELECT cc FROM CourseClass cc WHERE cc.course.id = :courseId AND cc.isArchived = false")
    List<CourseClass> findAllByCourseId(int courseId);

    @Query("SELECT cc FROM CourseClass cc WHERE cc.endDate IS NOT NULL AND cc.endDate <= CURRENT_DATE AND cc.isArchived = false")
    List<CourseClass> findExpiredClasses();
}
