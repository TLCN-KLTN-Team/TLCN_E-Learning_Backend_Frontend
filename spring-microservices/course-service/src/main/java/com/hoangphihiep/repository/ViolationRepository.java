package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {
    
    @Query("SELECT COUNT(v) FROM Violation v WHERE v.status = 'PENDING' AND " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR v.course.educationalUnit.type = :educationType)")
    Long countPendingViolations(@Param("educationType") String educationType);
    
    @Query("SELECT COUNT(v) FROM Violation v WHERE v.status = 'PENDING' AND " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR v.course.educationalUnit.type = :educationType) AND " +
            "v.reportedAt >= :startDate AND v.reportedAt <= :endDate")
    Long countPendingViolationsInPeriod(@Param("educationType") String educationType,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);
}
