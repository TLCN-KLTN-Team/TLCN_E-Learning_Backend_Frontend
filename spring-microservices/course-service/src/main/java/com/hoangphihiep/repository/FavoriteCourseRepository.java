package com.hoangphihiep.repository;

import com.hoangphihiep.entity.FavoriteCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteCourseRepository extends JpaRepository<FavoriteCourse, Integer> {

    @Query("SELECT fc FROM FavoriteCourse fc JOIN fc.courses c WHERE c.id = :courseId")
    List<FavoriteCourse> findByCourseId(@Param("courseId") int courseId);

    @Query("SELECT fc FROM FavoriteCourse fc WHERE fc.idUser = :userId AND :courseId MEMBER OF fc.courses")
    Optional<FavoriteCourse> findByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") int courseId);

    @Query("SELECT fc FROM FavoriteCourse fc WHERE fc.idUser = :userId")
    List<FavoriteCourse> findByUserId(String userId);
}
