package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByCourseIdOrderByCreatedAtDesc(Integer courseId);

    Optional<Review> findByCourseIdAndCreatedById(Integer courseId, String createdById);

    boolean existsByCourseIdAndCreatedById(Integer courseId, String createdById);

    @Query("SELECT AVG(r.rate) FROM Review r WHERE r.course.id = :courseId")
    Double getAverageRatingByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.course.id = :courseId AND r.rate = :rating")
    Long countByCourseIdAndRating(@Param("courseId") Integer courseId, @Param("rating") Integer rating);

    Long countByCourseId(Integer courseId);
}
