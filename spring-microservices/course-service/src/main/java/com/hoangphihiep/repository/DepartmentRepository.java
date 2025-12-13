package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    @Query("SELECT d FROM Department d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Department> findByDepartmentNameContaining(@Param("name") String name);

    @Query("SELECT d FROM Department d WHERE d.educationalUnit.id = :institutionId " +
            "AND (:search IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Department> findByEducationalUnitWithSearch(@Param("institutionId") int institutionId,
                                                 @Param("search") String search,
                                                 Pageable pageable);

    @Query("SELECT d FROM Department d WHERE d.id = :departmentId AND d.educationalUnit.id = :institutionId")
    Optional<Department> findByIdAndEducationalUnitId(@Param("departmentId") int departmentId,
                                                  @Param("institutionId") int institutionId);

    @Query("SELECT COUNT(d) > 0 FROM Department d WHERE LOWER(d.name) = LOWER(:name) AND d.educationalUnit.id = :institutionId")
    boolean existsByNameAndEducationalUnit(@Param("name") String name, @Param("institutionId") int institutionId);
    
    @Query("SELECT COUNT(d) FROM Department d WHERE d.educationalUnit.id = :educationalUnitId")
    long countByEducationalUnitId(@Param("educationalUnitId") Integer educationalUnitId);
}
