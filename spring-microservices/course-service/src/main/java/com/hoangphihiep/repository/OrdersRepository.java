package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface OrdersRepository extends JpaRepository<Orders, Integer> {

    @Query("SELECT o FROM Orders o WHERE o.idUser = :userId ORDER BY o.orderDate DESC")
    Page<Orders> findByUserIdOrderByOrderDateDesc(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT o FROM Orders o WHERE o.orderDate BETWEEN :startDate AND :endDate")
    List<Orders> findByOrderDateBetween(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

}
