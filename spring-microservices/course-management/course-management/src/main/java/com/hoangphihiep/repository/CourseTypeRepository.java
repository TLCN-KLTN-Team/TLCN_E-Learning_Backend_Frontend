package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseTypeRepository extends JpaRepository<CourseType, Integer> {

    @Query("SELECT ct FROM CourseType ct WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(ct.courseTypeName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<CourseType> findBySearch(@Param("search") String search, Pageable pageable);

    boolean existsByCourseTypeName(String courseTypeName);
}

