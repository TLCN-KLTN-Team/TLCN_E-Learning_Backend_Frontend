package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {

    @Query("SELECT q FROM Quiz q WHERE q.section.course.id = :courseId")
    List<Quiz> findByCourseId(@Param("courseId") int courseId);

    @Query("SELECT q FROM Quiz q WHERE q.section.id = :sectionId")
    List<Quiz> findBySectionId(@Param("sectionId") int sectionId);

    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.section.course.id = :courseId")
    int countByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT COUNT(q) FROM Quiz q " +
            "WHERE q.section.course.id = :courseId " +
            "AND q.isPublished = true")
    int countPublishedQuizzesByCourseId(@Param("courseId") Integer courseId);
}
