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

    @Query("SELECT q FROM Quiz q WHERE LOWER(q.title) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Quiz> findByQuizNameContaining(@Param("name") String name);

    @Query("SELECT q FROM Quiz q WHERE q.section.id = :sectionId")
    List<Quiz> findBySectionId(@Param("sectionId") int sectionId);
}
