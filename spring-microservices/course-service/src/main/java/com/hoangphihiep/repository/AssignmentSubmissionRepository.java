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

    /**
     * Find all submissions for a course and specific students
     */
    @Query("SELECT s FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "ORDER BY s.submittedAt DESC")
    List<AssignmentSubmission> findByAssignmentCourseIdAndStudentIds(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );

    /**
     * Find submissions for specific assignment and students
     */
    @Query("SELECT s FROM AssignmentSubmission s " +
            "WHERE s.assignment.id = :assignmentId " +
            "AND s.idUser IN :studentIds " +
            "ORDER BY s.submittedAt DESC")
    List<AssignmentSubmission> findByAssignmentIdAndStudentIds(
            @Param("assignmentId") Integer assignmentId,
            @Param("studentIds") List<String> studentIds
    );

    /**
     * Count total submissions for course and students
     */
    @Query("SELECT COUNT(s) FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "AND s.status IN ('SUBMITTED', 'LATE', 'GRADED')")
    int countByAssignmentCourseIdAndStudentIds(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );

    /**
     * Count graded submissions
     */
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

    /**
     * Find pending submissions (not graded yet) for a class
     */
    @Query("SELECT s FROM AssignmentSubmission s " +
            "WHERE s.assignment.section.course.id = :courseId " +
            "AND s.idUser IN :studentIds " +
            "AND s.score IS NULL " +
            "AND s.status IN ('SUBMITTED', 'LATE') " +
            "ORDER BY s.submittedAt ASC")
    List<AssignmentSubmission> findPendingSubmissionsByCourseAndStudents(
            @Param("courseId") Integer courseId,
            @Param("studentIds") List<String> studentIds
    );
}