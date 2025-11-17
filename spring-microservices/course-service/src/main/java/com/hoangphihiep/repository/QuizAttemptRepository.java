package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {

    List<QuizAttempt> findByQuizIdAndIdUserOrderBySubmittedAtDesc(Integer quizId, String userId);

    int countByQuizIdAndIdUser(Integer quizId, String userId);

    Optional<QuizAttempt> findTopByQuizIdAndIdUserAndSubmittedAtIsNullOrderByStartedAtDesc(
            Integer quizId, String userId);

    /**
     * Find all attempts for a course and specific users
     */
    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.quiz.section.course.id = :courseId " +
            "AND qa.idUser IN :userIds " +
            "AND qa.submittedAt IS NOT NULL " +
            "ORDER BY qa.submittedAt DESC")
    List<QuizAttempt> findByQuizCourseIdAndUserIds(@Param("courseId") Integer courseId, @Param("userIds") List<String> userIds);

    /**
     * Find attempts for specific quiz and users
     */
    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.quiz.id = :quizId " +
            "AND qa.idUser IN :userIds " +
            "AND qa.submittedAt IS NOT NULL " +
            "ORDER BY qa.submittedAt DESC")
    List<QuizAttempt> findByQuizIdAndUserIds(@Param("quizId") Integer quizId, @Param("userIds") List<String> userIds
    );

    @Query("SELECT COUNT(DISTINCT qa.quiz.id) FROM QuizAttempt qa " +
            "WHERE qa.idUser = :studentId " +
            "AND qa.quiz.section.course.id = :courseId " +
            "AND qa.submittedAt IS NOT NULL")
    int countCompletedQuizzesByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") Integer courseId);

    /**
     * Get average quiz score (percentage) for a student in a course
     * Uses the best attempt for each quiz
     */
    @Query("SELECT AVG(bestScores.percentage) FROM " +
            "(SELECT qa.quiz.id as quizId, MAX(qa.score * 100.0 / qa.totalScore) as percentage " +
            "FROM QuizAttempt qa " +
            "WHERE qa.idUser = :studentId " +
            "AND qa.quiz.section.course.id = :courseId " +
            "AND qa.submittedAt IS NOT NULL " +
            "AND qa.totalScore > 0 " +
            "GROUP BY qa.quiz.id) as bestScores")
    Double getAverageScoreByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") Integer courseId
    );

    /**
     * Alternative: Get average score using latest attempt (if needed)
     */
    @Query("SELECT AVG(qa.score * 100.0 / qa.totalScore) " +
            "FROM QuizAttempt qa " +
            "WHERE qa.id IN (" +
            "  SELECT MAX(qa2.id) FROM QuizAttempt qa2 " +
            "  WHERE qa2.idUser = :studentId " +
            "  AND qa2.quiz.section.course.id = :courseId " +
            "  AND qa2.submittedAt IS NOT NULL " +
            "  AND qa2.totalScore > 0 " +
            "  GROUP BY qa2.quiz.id" +
            ")")
    Double getAverageScoreByStudentAndCourseLatestAttempt(@Param("studentId") String studentId, @Param("courseId") Integer courseId
    );
}