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

    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END " +
            "FROM OrderItem oi " +
            "WHERE oi.course.id = :courseId " +
            "AND oi.order.idUser = :userId " +
            "AND oi.order.orderStatus = 'COMPLETED'")
    boolean existsByUserIdAndCourseIdAndOrderCompleted(
            @Param("userId") String userId, 
            @Param("courseId") Integer courseId);

    @Query("SELECT oi FROM OrderItem oi " +
            "WHERE oi.course.course.id = :courseId " +
            "AND oi.order.orderStatus = 'COMPLETED'")
    List<OrderItem> findByOriginalCourseId(@Param("courseId") Integer courseId);
}
