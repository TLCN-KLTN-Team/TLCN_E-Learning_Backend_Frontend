package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("SELECT o FROM Order o WHERE o.orderId = :orderId")
    Optional<Order> findByOrderId (String orderId);

    @Query("SELECT o FROM Order o WHERE o.idUser = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdOrderByOrderDateDesc(@Param("userId") String userId);

    @Query("SELECT o FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate")
    List<Order> findByOrderDateBetween(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
    
    // Count unique students (users) who purchased courses by a specific teacher
    @Query("SELECT COUNT(DISTINCT o.idUser) FROM Order o JOIN o.orderItems oi WHERE oi.course.course.idTeacher = :teacherId")
    Long countUniqueStudentsByTeacherId(@Param("teacherId") String teacherId);

    @Query("SELECT COUNT(DISTINCT o.idUser) FROM Order o JOIN o.orderItems oi WHERE oi.course.course.idTeacher = :teacherId AND oi.course.id = :courseId")
    Long countUniqueStudentsByTeacherIdAndCoureId(@Param("teacherId") String teacherId, @Param("courseId") Integer courseId);

}
