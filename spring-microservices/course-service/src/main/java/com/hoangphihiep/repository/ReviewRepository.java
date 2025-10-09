package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByCourseId(int courseId);

    @Query("SELECT r FROM Review r WHERE r.course.id = :courseId ORDER BY r.createdAt DESC")
    Page<Review> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") int courseId, Pageable pageable);

    @Query("SELECT AVG(r.rate) FROM Review r WHERE r.course.id = :courseId")
    Double calculateAverageRatingByCourseId(@Param("courseId") int courseId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.course.id = :courseId")
    long countByCourseId(@Param("courseId") int courseId);

    @Query("SELECT r FROM Review r WHERE r.createdById = :userId")
    List<Review> findByUserId(String userId);
}
