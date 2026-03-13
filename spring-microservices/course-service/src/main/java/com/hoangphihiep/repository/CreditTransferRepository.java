package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CreditTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface CreditTransferRepository extends JpaRepository<CreditTransfer, Integer> {

    @Query("SELECT ct FROM CreditTransfer ct WHERE (:status IS NULL OR ct.status = :status) " +
            "AND (:keyword IS NULL OR ct.studentName LIKE %:keyword% OR ct.description LIKE %:keyword%)")
    Page<CreditTransfer> search(@Param("status") String status, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT ct FROM CreditTransfer ct WHERE ct.idStudent = :userId AND ct.status = :status")
    List<CreditTransfer> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") String status);

    long countByIdStudentAndStatus(String idStudent, String status);

    Page<CreditTransfer> findByIdStudent(String idStudent, Pageable pageable);
}
