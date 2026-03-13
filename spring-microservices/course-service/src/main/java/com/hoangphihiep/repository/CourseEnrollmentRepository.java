package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    Page<CourseEnrollment> findByCourseClassId(Integer classId, Pageable pageable);

    Page<CourseEnrollment> findByStudentId(String studentId, Pageable pageable);

    boolean existsByCourseClassIdAndStudentId(Integer classId, String studentId);

    Optional<CourseEnrollment> findByCourseClassIdAndStudentId(Integer classId, String studentId);

    int countByCourseClassId(Integer classId);

    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId")
    List<String> findStudentIdsByClassId(@Param("classId") Integer classId);

    void deleteByCourseClassIdAndStudentId(Integer classId, String studentId);

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

    default boolean existsByClassIdAndStudentId(Integer classId, String studentId) {
        return existsByCourseClassIdAndStudentId(classId, studentId);
    }

    default int countByClassId(Integer classId) {
        return countByCourseClassId(classId);
    }

    default void deleteByClassIdAndStudentId(Integer classId, String studentId) {
        deleteByCourseClassIdAndStudentId(classId, studentId);
    }

    @Query("SELECT COUNT(ce) FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId")
    Integer countTotalStudentsByClassId(@Param("classId") Integer classId);

    @Query("SELECT COUNT(ce) FROM CourseEnrollment ce " +
            "WHERE ce.courseClass.id = :classId AND ce.status = 'ACTIVE'")
    Integer countActiveStudentsByClassId(@Param("classId") Integer classId);

    @Query("SELECT ce.studentId FROM CourseEnrollment ce WHERE ce.courseClass.id = :classId")
    List<String> findStudentIdsForStatistics(@Param("classId") Integer classId);

    @Query("SELECT COUNT(DISTINCT ce.studentId) FROM CourseEnrollment ce " +
            "WHERE (:educationType IS NULL OR :educationType = 'ALL' OR ce.course.educationalUnit.type = :educationType) AND " +
            "ce.enrolledAt >= :startDate AND ce.enrolledAt <= :endDate")
    Long countDistinctStudentsInPeriod(@Param("educationType") String educationType,
                                        @Param("startDate") Date startDate,
                                        @Param("endDate") Date endDate);
}
