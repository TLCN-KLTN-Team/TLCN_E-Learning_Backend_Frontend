package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CreditTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditTransferRepository extends JpaRepository<CreditTransfer, Integer> {

    @Query("SELECT ct FROM CreditTransfer ct WHERE ct.idStudent = :userId AND ct.status = :status")
    List<CreditTransfer> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") String status);
}
