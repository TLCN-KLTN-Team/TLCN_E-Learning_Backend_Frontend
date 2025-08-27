package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    Page<CourseEnrollment> findByCourseId(int courseId, Pageable pageable);

    Page<CourseEnrollment> findByStudentId(String studentId, Pageable pageable);

    Optional<CourseEnrollment> findByCourseIdAndStudentId(int courseId, String studentId);

    boolean existsByCourseIdAndStudentId(int courseId, String studentId);

    int countByCourseId(int courseId);

    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.course.id = :courseId")
    List<String> findStudentIdsByCourseId(@Param("courseId") int courseId);

    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.course.id = :courseId AND ce.status = :status")
    List<CourseEnrollment> findByCourseIdAndStatus(@Param("courseId") int courseId, @Param("status") String status);

    void deleteByCourseIdAndStudentId(int courseId, String studentId);
}
