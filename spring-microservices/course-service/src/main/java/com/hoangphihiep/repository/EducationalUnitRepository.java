package com.hoangphihiep.repository;

import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.utils.EducationalUnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface EducationalUnitRepository extends JpaRepository<EducationalUnit, Integer> {

    Optional<EducationalUnit> findByIdAdmin(String adminId);

    boolean existsByName(String name);

    @Query("SELECT COUNT(eu) > 0 FROM EducationalUnit eu WHERE eu.name = :name AND eu.id != :id")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("id") Integer id);
    
    // Dashboard KPI queries
    @Query("SELECT COUNT(eu) FROM EducationalUnit eu WHERE " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR eu.type = :educationType) AND " +
            "eu.createdAt >= :startDate AND eu.createdAt <= :endDate")
    Long countOrganizationsInPeriod(@Param("educationType") String educationType,
                                     @Param("startDate") Date startDate,
                                     @Param("endDate") Date endDate);
    
    @Query("SELECT COUNT(eu) FROM EducationalUnit eu WHERE " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR eu.type = :educationType)")
    Long countTotalOrganizations(@Param("educationType") String educationType);
    
    @Query("SELECT COUNT(eu) FROM EducationalUnit eu WHERE " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR eu.type = :educationType) AND " +
            "eu.status = :status")
    Long countOrganizationsByStatus(@Param("educationType") String educationType,
                                     @Param("status") EducationalUnitStatus status);
}
