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

    // Class-based enrollment methods
    Page<CourseEnrollment> findByCourseClassId(Long classId, Pageable pageable);

    Page<CourseEnrollment> findByStudentId(String studentId, Pageable pageable);

    Optional<CourseEnrollment> findByCourseClassIdAndStudentId(Long classId, String studentId);

    boolean existsByCourseClassIdAndStudentId(Long classId, String studentId);

    int countByCourseClassId(Long classId);

    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId")
    List<String> findStudentIdsByClassId(@Param("classId") Long classId);

    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId AND ce.status = :status")
    List<CourseEnrollment> findByCourseClassIdAndStatus(@Param("classId") Long classId, @Param("status") String status);

    void deleteByCourseClassIdAndStudentId(Long classId, String studentId);

    // Legacy methods for backward compatibility (can be removed if not used elsewhere)
    @Deprecated
    Page<CourseEnrollment> findByCourseId(int courseId, Pageable pageable);

    @Deprecated
    Optional<CourseEnrollment> findByCourseIdAndStudentId(int courseId, String studentId);

    @Deprecated
    boolean existsByCourseIdAndStudentId(int courseId, String studentId);

    @Deprecated
    int countByCourseId(int courseId);

    @Deprecated
    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.course.id = :courseId")
    List<String> findStudentIdsByCourseId(@Param("courseId") int courseId);

    @Deprecated
    @Query("SELECT ce FROM CourseEnrollment ce WHERE ce.course.id = :courseId AND ce.status = :status")
    List<CourseEnrollment> findByCourseIdAndStatus(@Param("courseId") int courseId, @Param("status") String status);

    @Deprecated
    void deleteByCourseIdAndStudentId(int courseId, String studentId);

    // Convenience methods for class-based operations
    default Page<CourseEnrollment> findByClassId(Long classId, Pageable pageable) {
        return findByCourseClassId(classId, pageable);
    }

    default boolean existsByClassIdAndStudentId(Long classId, String studentId) {
        return existsByCourseClassIdAndStudentId(classId, studentId);
    }

    default int countByClassId(Long classId) {
        return countByCourseClassId(classId);
    }

    default void deleteByClassIdAndStudentId(Long classId, String studentId) {
        deleteByCourseClassIdAndStudentId(classId, studentId);
    }
}