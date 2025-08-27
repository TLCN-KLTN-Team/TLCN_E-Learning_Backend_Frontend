package com.hoangphihiep.repository;

import com.hoangphihiep.entity.EducationalUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EducationalUnitRepository extends JpaRepository<EducationalUnit, Integer> {

    Optional<EducationalUnit> findByIdAdmin(String adminId);

    @Query("SELECT eu FROM EducationalUnit eu WHERE eu.isActive = true")
    List<EducationalUnit> findAllActive();

    boolean existsByName(String name);

    @Query("SELECT COUNT(eu) > 0 FROM EducationalUnit eu WHERE eu.name = :name AND eu.id != :id")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("id") Integer id);
}
