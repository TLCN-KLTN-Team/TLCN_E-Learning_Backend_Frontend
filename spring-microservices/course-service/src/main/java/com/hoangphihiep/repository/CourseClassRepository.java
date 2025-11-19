package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Course;
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

    Page<CourseClass> findByCourseId(Integer courseId, Pageable pageable);

    List<CourseClass> findByCourseId(Integer courseId);

    boolean existsByClassCode(String classCode);

    @Query("SELECT cc FROM CourseClass cc WHERE cc.course.educationalUnit.id = :educationalUnitId " +
            "AND (:search IS NULL OR cc.className LIKE %:search% OR cc.classCode LIKE %:search%)")
    Page<CourseClass> findByEducationalUnitIdWithSearch(@Param("educationalUnitId") Integer educationalUnitId,
                                                    @Param("search") String search,
                                                    Pageable pageable);

    List<CourseClass> findAllByCourseId(int courseId);
}
