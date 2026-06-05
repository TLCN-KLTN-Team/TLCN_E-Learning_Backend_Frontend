package com.hoangphihiep.repository;

import com.hoangphihiep.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrderId(int orderId);

    List<OrderItem> findByCourseId(int courseId);

    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END " +
            "FROM OrderItem oi " +
            "WHERE oi.course.id = :courseId " +
            "AND oi.order.idUser = :userId " +
            "AND oi.order.orderStatus = 'COMPLETED' " +
            "AND oi.paymentStatus = 'PAID'")
    boolean existsByUserIdAndCourseIdAndOrderCompleted(
            @Param("userId") String userId, 
            @Param("courseId") Integer courseId);

    @Query("SELECT oi FROM OrderItem oi " +
            "WHERE oi.course.course.id = :courseId " +
            "AND oi.order.orderStatus = 'COMPLETED' " +
            "AND oi.paymentStatus = 'PAID'")
    List<OrderItem> findByOriginalCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT oi FROM OrderItem oi " +
            "WHERE oi.course.course.idTeacher = :teacherId " +
            "AND oi.order.orderStatus = 'COMPLETED' " +
            "AND oi.paymentStatus = 'PAID' " +
            "ORDER BY oi.order.orderDate DESC")
    List<OrderItem> findAllByCourse_Course_IdTeacher(@Param("teacherId") String teacherId);

    List<OrderItem> findByPaymentStatus(com.hoangphihiep.utils.PaymentStatus paymentStatus);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.course.course.educationalUnit.id = :eduId AND oi.order.orderStatus = 'COMPLETED' AND oi.paymentStatus = 'PAID' ORDER BY oi.order.orderDate DESC")
    Page<OrderItem> findRecentByEducationalUnitId(@Param("eduId") Integer eduId, Pageable pageable);
}
