package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByOrderId(int orderId);

    List<Payment> findByPaymentMethod(String paymentMethod);

    List<Payment> findByStatus(String status);

    @Query("SELECT p FROM Payment p WHERE p.processedAt BETWEEN :startDate AND :endDate")
    List<Payment> findByPaymentDateBetween(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
}
