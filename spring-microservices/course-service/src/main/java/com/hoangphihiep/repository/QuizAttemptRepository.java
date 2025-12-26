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

    @Query("SELECT COUNT(DISTINCT qa.quiz.id) FROM QuizAttempt qa " +
            "WHERE qa.idUser = :userId " +
            "AND qa.quiz.section.course.id = :courseId")
    int countDistinctQuizzesByUserAndCourse(@Param("userId") String userId,
                                            @Param("courseId") Integer courseId);
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa " +
            "WHERE qa.idUser = :userId " +
            "AND qa.quiz.id = :quizId")
    int countByIdUserAndQuiz_Id(@Param("userId") String userId,
                                @Param("quizId") Integer quizId);

    Optional<QuizAttempt> findTopByQuizIdAndIdUserAndSubmittedAtIsNullOrderByStartedAtDesc(
            Integer quizId, String userId);

    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.quiz.section.course.id = :courseId " +
            "AND qa.idUser IN :userIds " +
            "AND qa.submittedAt IS NOT NULL " +
            "ORDER BY qa.submittedAt DESC")
    List<QuizAttempt> findByQuizCourseIdAndUserIds(@Param("courseId") Integer courseId, @Param("userIds") List<String> userIds);

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
            "AND qa.isPassed = TRUE " +
            "AND qa.submittedAt IS NOT NULL")
    int countCompletedQuizzesByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") Integer courseId);

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

    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.idUser = :userId " +
            "AND qa.quiz.section.course.id = :courseId " +
            "AND qa.submittedAt IS NOT NULL " +
            "ORDER BY qa.submittedAt DESC")
    List<QuizAttempt> findByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") Integer courseId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa " +
            "WHERE qa.idUser = :userId " +
            "AND qa.quiz.section.course.id = :courseId " +
            "AND qa.submittedAt IS NOT NULL")
    int countByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") Integer courseId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa " +
            "WHERE qa.quiz.section.course.id = :courseId " +
            "AND qa.submittedAt IS NOT NULL")
    int countByCourseId(@Param("courseId") Integer courseId);
}