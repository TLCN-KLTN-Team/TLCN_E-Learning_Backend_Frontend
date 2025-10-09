package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {

    List<Lesson> findBySectionId(int sectionId);

    @Query("SELECT l FROM Lesson l WHERE l.section.id = :sectionId ORDER BY l.numberItem")
    List<Lesson> findBySectionIdOrderByOrderIndex(@Param("sectionId") int sectionId);

    @Query("SELECT l FROM Lesson l WHERE l.section.course.id = :courseId")
    List<Lesson> findByCourseId(@Param("courseId") int courseId);

    @Query("SELECT l FROM Lesson l WHERE LOWER(l.title) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Lesson> findByLessonNameContaining(@Param("name") String name);
}
