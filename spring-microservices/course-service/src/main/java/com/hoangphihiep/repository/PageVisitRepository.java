package com.hoangphihiep.repository;

import com.hoangphihiep.entity.PageVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PageVisitRepository extends JpaRepository<PageVisit, Long> {
    
    @Query("SELECT COUNT(pv) FROM PageVisit pv WHERE " +
            "pv.visitTime >= :startDate AND pv.visitTime <= :endDate")
    Long countVisitsInPeriod(@Param("startDate") LocalDateTime startDate,
                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(DISTINCT pv.sessionId) FROM PageVisit pv WHERE " +
            "pv.visitTime >= :startDate AND pv.visitTime <= :endDate")
    Long countUniqueSessionsInPeriod(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);
}
