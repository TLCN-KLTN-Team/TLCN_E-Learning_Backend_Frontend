package com.hoangphihiep.repository;

import com.hoangphihiep.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Integer> {

    List<RefundRequest> findByStatus(String status);

    @Query("SELECT rr FROM RefundRequest rr WHERE rr.requestDate BETWEEN :startDate AND :endDate")
    List<RefundRequest> findByRequestDateBetween(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    @Query("SELECT COUNT(rr) FROM RefundRequest rr WHERE rr.status = 'PENDING'")
    long countPendingRefundRequests();
}
