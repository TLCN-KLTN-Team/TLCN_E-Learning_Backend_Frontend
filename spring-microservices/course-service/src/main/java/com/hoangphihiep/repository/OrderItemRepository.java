package com.hoangphihiep.repository;

import com.hoangphihiep.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrderId(int orderId);

    List<OrderItem> findByCourseId(int courseId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.idUser = :userId")
    List<OrderItem> findByUserId(@Param("userId") String userId);

    @Query("SELECT SUM(oi.finishedFee) FROM OrderItem oi WHERE oi.order.id = :orderId")
    Double calculateTotalByOrderId(@Param("orderId") int orderId);
}
