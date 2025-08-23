package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Course;
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

    List<Course> findByIdTeacher(String teacherId);

    List<Course> findByVisibilityTrue();

    List<Course> findByIsApprovedTrue();

    @Query("SELECT c FROM Course c WHERE c.courseType.id = :courseTypeId")
    List<Course> findByCourseTypeId(@Param("courseTypeId") int courseTypeId);

    boolean existsByCourseName(String courseName);
}
