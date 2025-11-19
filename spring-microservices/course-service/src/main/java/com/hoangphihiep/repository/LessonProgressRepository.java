package com.hoangphihiep.repository;

import com.hoangphihiep.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Integer> {

    List<LessonProgress> findByLessonId(int lessonId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.courseProgress.idUser = :userId AND lp.lesson.section.course.id = :courseId")
    List<LessonProgress> findByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") int courseId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.courseProgress.idUser = :userId AND lp.isCompleted = true")
    List<LessonProgress> findCompletedLessonsByUserId(@Param("userId") String userId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.courseProgress.idUser = :userId")
    List<LessonProgress> findByUserId(String userId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.courseProgress.idUser = :userId AND lp.lesson.id = :lessonId")
    Optional<Object> findByUserIdAndLessonId(String userId, Integer lessonId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.courseProgress.id = :courseProgressId AND lp.lesson.id = :lessonId")
    Optional<LessonProgress> findByCourseProgress_IdAndLesson_Id(
            @Param("courseProgressId") Integer courseProgressId,
            @Param("lessonId") Integer lessonId);
}
