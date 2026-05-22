package com.hoangphihiep.repository;

import com.hoangphihiep.entity.EquivalentCourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EquivalentCourseRepository extends JpaRepository<EquivalentCourse, Integer> {
    
    boolean existsBySourceCourseIdAndTargetCourseId(Integer sourceCourseId, Integer targetCourseId);

    boolean existsByIdAndTargetCourseExpertId(Integer id, String expertId);

    @Query("SELECT e FROM EquivalentCourse e WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "lower(e.sourceCourse.courseName) LIKE lower(concat('%', :keyword, '%')) OR " +
           "lower(e.targetCourse.courseName) LIKE lower(concat('%', :keyword, '%'))) AND " +
           "(:targetCourseId IS NULL OR e.targetCourse.id = :targetCourseId) AND " +
           "(:expertId IS NULL OR :expertId = '' OR e.targetCourse.expertId = :expertId)")
    Page<EquivalentCourse> searchEquivalentCourses(@Param("keyword") String keyword, 
                                                  @Param("targetCourseId") Integer targetCourseId, 
                                                  @Param("expertId") String expertId,
                                                  Pageable pageable);

    @Query("SELECT e FROM EquivalentCourse e WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "lower(e.sourceCourse.courseName) LIKE lower(concat('%', :keyword, '%')) OR " +
           "lower(e.targetCourse.courseName) LIKE lower(concat('%', :keyword, '%'))) AND " +
           "(:targetCourseId IS NULL OR e.targetCourse.id = :targetCourseId) AND " +
           "e.targetCourse.educationalUnit.id = :educationalUnitId")
    Page<EquivalentCourse> searchEquivalentCoursesByEducationalUnit(@Param("keyword") String keyword,
                                                                    @Param("targetCourseId") Integer targetCourseId,
                                                                    @Param("educationalUnitId") Integer educationalUnitId,
                                                                    Pageable pageable);
}
