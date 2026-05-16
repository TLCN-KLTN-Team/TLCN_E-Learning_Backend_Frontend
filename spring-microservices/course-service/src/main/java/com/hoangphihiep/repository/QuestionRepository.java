package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {
    @Query("SELECT q FROM Question q WHERE q.teacherId = :teacherId")
    Page<Question> findLibraryQuestionsByTeacher(@Param("teacherId") String teacherId, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.teacherId = :teacherId " +
           "AND (:search IS NULL OR :search = '' OR " +
           "LOWER(q.questionText) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.tags) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.questionType) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Question> searchLibraryQuestions(@Param("teacherId") String teacherId, 
                                          @Param("search") String search, 
                                          Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.teacherId = :teacherId " +
           "AND q.questionType = :questionType")
    Page<Question> findLibraryQuestionsByType(@Param("teacherId") String teacherId, 
                                               @Param("questionType") String questionType, 
                                               Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.teacherId = :teacherId " +
           "AND q.difficultyLevel = :difficultyLevel")
    Page<Question> findLibraryQuestionsByDifficulty(@Param("teacherId") String teacherId, 
                                                     @Param("difficultyLevel") String difficultyLevel, 
                                                     Pageable pageable);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.answers WHERE q.id = :id")
    Optional<Question> findByIdWithAnswers(@Param("id") Integer id);
}
