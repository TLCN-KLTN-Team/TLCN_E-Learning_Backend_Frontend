package com.hoangphihiep.repository;

import com.hoangphihiep.entity.EducationalUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationalUnitRepository extends JpaRepository<EducationalUnit, Integer> {

    @Query("SELECT eu FROM EducationalUnit eu WHERE LOWER(eu.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<EducationalUnit> findByUnitNameContaining(@Param("name") String name);
}
