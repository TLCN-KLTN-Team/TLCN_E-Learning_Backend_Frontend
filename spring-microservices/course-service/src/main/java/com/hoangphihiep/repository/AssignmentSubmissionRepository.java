package com.hoangphihiep.repository;

import com.hoangphihiep.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Integer> {
    List<AssignmentSubmission> findByAssignmentId(Integer assignmentId);
    List<AssignmentSubmission> findByIdUser(String idUser);
    Optional<AssignmentSubmission> findByAssignmentIdAndIdUser(Integer assignmentId, String idUser);

    @Query("SELECT COUNT(DISTINCT asub.assignment.id) FROM AssignmentSubmission asub " +
            "WHERE asub.idUser = :userId " +
            "AND asub.assignment.section.course.id = :courseId")
    int countDistinctAssignmentsByUserAndCourse(@Param("userId") String userId,
                                                @Param("courseId") Integer courseId);
    @Query("SELECT COUNT(asub) FROM AssignmentSubmission asub " +
            "WHERE asub.idUser = :userId " +
            "AND asub.assignment.id = :assignmentId")
    int countByIdUserAndAssignment_Id(@Param("userId") String userId,
                                      @Param("assignmentId") Integer assignmentId);

    @Query("SELECT s FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "ORDER BY s.submittedAt DESC")
    List<AssignmentSubmission> findByAssignmentCourseIdAndStudentIds(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );

    @Query("SELECT COUNT(s) FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "AND s.status IN ('SUBMITTED', 'LATE', 'GRADED')")
    int countByAssignmentCourseIdAndStudentIds(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );

    @Query("SELECT COUNT(s) FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "AND s.score IS NOT NULL")
    int countGradedByAssignmentCourseIdAndStudentIds(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );

    @Query("SELECT COUNT(DISTINCT s.assignment.id) FROM AssignmentSubmission s " +
            "WHERE s.idUser = :studentId " +
            "AND s.assignment.section.course.id = :courseId " +
            "AND s.status IN ('SUBMITTED', 'LATE', 'GRADED')")
    int countSubmittedAssignmentsByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") Integer courseId);

    @Query("SELECT AVG(s.score * 100.0 / s.assignment.maxScore) FROM AssignmentSubmission s " +
            "WHERE s.idUser = :studentId " +
            "AND s.assignment.section.course.id = :courseId " +
            "AND s.score IS NOT NULL " +
            "AND s.assignment.maxScore > 0")
    Double getAverageScoreByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") Integer courseId);

    @Query("SELECT asub FROM AssignmentSubmission asub " +
            "WHERE asub.idUser = :userId " +
            "AND asub.assignment.section.course.id = :courseId " +
            "ORDER BY asub.submittedAt DESC")
    List<AssignmentSubmission> findByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") Integer courseId);

    @Query("SELECT COUNT(asub) FROM AssignmentSubmission asub " +
            "WHERE asub.idUser = :userId " +
            "AND asub.assignment.section.course.id = :courseId")
    int countByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") Integer courseId);

    @Query("SELECT COUNT(asub) FROM AssignmentSubmission asub " +
            "WHERE asub.assignment.section.course.id = :courseId")
    int countByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT COUNT(asub) FROM AssignmentSubmission asub " +
            "WHERE asub.assignment.section.course.id = :courseId " +
            "AND asub.score IS NULL")
    int countByCourseIdAndScoreIsNull(@Param("courseId") Integer courseId);
}