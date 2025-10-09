package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Integer> {

    List<Section> findByCourseId(int courseId);

    @Query("SELECT s FROM Section s WHERE s.course.id = :courseId ORDER BY s.orderIndex")
    List<Section> findByCourseIdOrderByOrderIndex(@Param("courseId") int courseId);

    @Query("SELECT s FROM Section s WHERE LOWER(s.title) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Section> findBySectionNameContaining(@Param("name") String name);
}
