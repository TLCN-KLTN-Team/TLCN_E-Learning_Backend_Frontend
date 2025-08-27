package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseDetailRepository extends JpaRepository<CourseDetail, Integer> {

    @Query("SELECT cd FROM CourseDetail cd WHERE cd.publicCourse.id = :courseId")
    Optional<CourseDetail> findByCourseId(@Param("courseId") int courseId);
}
