package com.devteria.identity.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.Expert;

@Repository
public interface ExpertRepository extends JpaRepository<Expert, String> {
    Optional<Expert> findByExpertId(String expertId);

    boolean existsByExpertId(String expertId);

    @Query("SELECT e FROM Expert e WHERE " + "(:expertId IS NULL OR e.expertId LIKE %:expertId%) AND "
            + "(:educationalUnitId IS NULL OR e.idEducational = :educationalUnitId)")
    Page<Expert> findExpertsWithFilters(
            @Param("expertId") String expertId,
            @Param("educationalUnitId") Integer educationalUnitId,
            Pageable pageable);

    List<Expert> findByIdEducational(int educationalUnitId);

    @Query("SELECT e FROM Expert e WHERE e.idEducational = :educationalUnitId AND "
            + "(:search IS NULL OR :search = '' OR "
            + "LOWER(e.expertId) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Expert> findByInstitutionWithSearch(
            @Param("educationalUnitId") int educationalUnitId, @Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(e) FROM Expert e WHERE e.idEducational = :educationalUnitId")
    long countByIdEducational(@Param("educationalUnitId") Integer educationalUnitId);
}
