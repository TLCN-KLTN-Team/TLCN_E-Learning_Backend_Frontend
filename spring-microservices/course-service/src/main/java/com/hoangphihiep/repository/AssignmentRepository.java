package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Integer> {
    List<Assignment> findBySectionId(Integer sectionId);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.section.course.id = :courseId")
    int countByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT a FROM Assignment a WHERE a.section.course.id = :courseId ORDER BY a.createdAt DESC")
    List<Assignment> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Integer courseId);
}