package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.EducationalUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    @Query("SELECT c FROM Course c WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(c.courseName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> findBySearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.educationalUnit.id = :educationalUnitId AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(c.courseName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> findByEducationalUnitWithSearch(@Param("educationalUnitId") int educationalUnitId, @Param("search") String search, Pageable pageable);

    List<Course> findByIdTeacher(String teacherId);

    boolean existsByCourseName(String courseName);

    @Query("SELECT COUNT(c) > 0 FROM Course c WHERE c.courseName = :courseName AND c.educationalUnit.id = :institutionId")
    boolean existsByCourseNameAndEducationalUnit(@Param("courseName") String courseName, @Param("institutionId") int institutionId);
}
