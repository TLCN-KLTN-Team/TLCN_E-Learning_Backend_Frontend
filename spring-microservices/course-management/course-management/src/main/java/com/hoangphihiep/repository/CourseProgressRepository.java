package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Integer> {

    List<CourseProgress> findByCourseId(int courseId);


    @Query("SELECT cp FROM CourseProgress cp WHERE cp.idUser = :userId AND cp.progressPercentage >= :minProgress")
    List<CourseProgress> findByUserIdAndProgressGreaterThanEqual(@Param("userId") String userId, @Param("minProgress") double minProgress);

    @Query("SELECT cp FROM CourseProgress cp WHERE cp.course.id = :courseId AND cp.progressPercentage = 100")
    List<CourseProgress> findCompletedProgressByCourseId(@Param("courseId") int courseId);

    @Query("SELECT cp FROM CourseProgress cp WHERE cp.idUser = :userId")
    List<CourseProgress> findByUserId(String userId);

    @Query("SELECT cp FROM CourseProgress cp WHERE cp.idUser = :userId AND cp.course.id = :courseId")
    Optional<CourseProgress> findByUserIdAndCourseId(String userId, int courseId);
}
