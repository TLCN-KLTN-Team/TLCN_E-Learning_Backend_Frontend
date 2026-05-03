package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CreditTransfer;
import com.hoangphihiep.utils.CreditTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface CreditTransferRepository extends JpaRepository<CreditTransfer, Integer> {

    @Query("SELECT ct FROM CreditTransfer ct WHERE (:status IS NULL OR ct.status = :status) " +
            "AND (:keyword IS NULL OR ct.studentName LIKE %:keyword% OR ct.description LIKE %:keyword%)")
    Page<CreditTransfer> search(@Param("status") CreditTransferStatus status, @Param("keyword") String keyword, Pageable pageable);

    long countByIdStudentAndStatusIn(String idStudent, java.util.Collection<CreditTransferStatus> statuses);

    Page<CreditTransfer> findByIdStudent(String idStudent, Pageable pageable);
}
