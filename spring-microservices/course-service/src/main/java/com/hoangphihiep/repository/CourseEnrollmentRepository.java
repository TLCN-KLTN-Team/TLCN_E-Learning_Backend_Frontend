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
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    // Class-based enrollment methods
    Page<CourseEnrollment> findByCourseClassId(Integer classId, Pageable pageable);

    Page<CourseEnrollment> findByStudentId(String studentId, Pageable pageable);

    Optional<CourseEnrollment> findByCourseClassIdAndStudentId(Integer classId, String studentId);

    boolean existsByCourseClassIdAndStudentId(Integer classId, String studentId);

    int countByCourseClassId(Integer classId);

    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId")
    List<String> findStudentIdsByClassId(@Param("classId") Integer classId);

    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId AND ce.status = :status")
    List<CourseEnrollment> findByCourseClassIdAndStatus(@Param("classId") Integer classId, @Param("status") String status);

    void deleteByCourseClassIdAndStudentId(Integer classId, String studentId);

    // Legacy methods for backward compatibility (can be removed if not used elsewhere)
    @Deprecated
    Page<CourseEnrollment> findByCourseId(Integer courseId, Pageable pageable);

    @Deprecated
    Optional<CourseEnrollment> findByCourseIdAndStudentId(Integer courseId, String studentId);

    @Deprecated
    boolean existsByCourseIdAndStudentId(Integer courseId, String studentId);

    @Deprecated
    int countByCourseId(Integer courseId);

    @Deprecated
    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.course.id = :courseId")
    List<String> findStudentIdsByCourseId(@Param("courseId") Integer courseId);

    @Deprecated
    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.course.id = :courseId AND ce.status = :status")
    List<CourseEnrollment> findByCourseIdAndStatus(@Param("courseId") Integer courseId, @Param("status") String status);

    @Deprecated
    void deleteByCourseIdAndStudentId(Integer courseId, String studentId);

    // Convenience methods for class-based operations
    default Page<CourseEnrollment> findByClassId(Integer classId, Pageable pageable) {
        return findByCourseClassId(classId, pageable);
    }

    default boolean existsByClassIdAndStudentId(Integer classId, String studentId) {
        return existsByCourseClassIdAndStudentId(classId, studentId);
    }

    default int countByClassId(Integer classId) {
        return countByCourseClassId(classId);
    }

    default void deleteByClassIdAndStudentId(Integer classId, String studentId) {
        deleteByCourseClassIdAndStudentId(classId, studentId);
    }
}