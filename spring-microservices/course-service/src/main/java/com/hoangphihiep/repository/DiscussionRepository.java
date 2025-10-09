package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Discussion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Integer> {

    List<Discussion> findByCourseId(int courseId);

    @Query("SELECT d FROM Discussion d WHERE d.course.id = :courseId ORDER BY d.askedAt DESC")
    Page<Discussion> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") int courseId, Pageable pageable);

    @Query("SELECT d FROM Discussion d WHERE d.course.id = :courseId AND d.parent IS NULL")
    List<Discussion> findTopLevelDiscussionsByCourseId(@Param("courseId") int courseId);

}
