package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Integer> {

    List<Payout> findByStatus(String status);

    @Query("SELECT p FROM Payout p WHERE p.processedDate BETWEEN :startDate AND :endDate")
    List<Payout> findByPayoutDateBetween(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
}
