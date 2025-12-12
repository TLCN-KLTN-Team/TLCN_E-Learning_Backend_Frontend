package com.hoangphihiep.repository;

import com.hoangphihiep.entity.PublishedCourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PublishedCourseRepository extends JpaRepository<PublishedCourse, Integer> {

    Optional<PublishedCourse> findByCourseId(Integer courseId);

    boolean existsByCourseId(Integer courseId);

    @Query("SELECT pc FROM PublishedCourse pc WHERE pc.course.educationalUnit.id = :educationalUnitId")
    Page<PublishedCourse> findByEducationalUnitId(
            @Param("educationalUnitId") Integer educationalUnitId,
            Pageable pageable);

    @Query("SELECT pc FROM PublishedCourse pc " +
            "WHERE pc.course.educationalUnit.id = :educationalUnitId " +
            "AND pc.status = :status")
    Page<PublishedCourse> findByEducationalUnitIdAndStatus(
            @Param("educationalUnitId") Integer educationalUnitId,
            @Param("status") Integer status,
            Pageable pageable);

    @Query("SELECT pc FROM PublishedCourse pc WHERE pc.course.idTeacher = :teacherId")
    Page<PublishedCourse> findByTeacherId(
            @Param("teacherId") String teacherId,
            Pageable pageable);

    @Query("SELECT pc FROM PublishedCourse pc " +
            "WHERE pc.course.idTeacher = :teacherId " +
            "AND pc.status = :status")
    Page<PublishedCourse> findByTeacherIdAndStatus(
            @Param("teacherId") String teacherId,
            @Param("status") Integer status,
            Pageable pageable);

    @Query("SELECT pc FROM PublishedCourse pc " +
            "LEFT JOIN pc.orderItems oi " +
            "GROUP BY pc.id " +
            "ORDER BY COUNT(oi) DESC")
    List<PublishedCourse> findTopBestSellingCourses(Pageable pageable);


    @Query("SELECT pc FROM PublishedCourse pc WHERE pc.status = 2") // 2 = Approved
    Page<PublishedCourse> findAllApproved(Pageable pageable);
    
    // Count approved courses by teacher
    @Query("SELECT COUNT(pc) FROM PublishedCourse pc WHERE pc.course.idTeacher = :teacherId AND pc.status = 2")
    long countApprovedCoursesByTeacherId(@Param("teacherId") String teacherId);
    
    // Get all approved courses by teacher for statistics
    @Query("SELECT pc FROM PublishedCourse pc WHERE pc.course.idTeacher = :teacherId AND pc.status = 2")
    List<PublishedCourse> findApprovedCoursesByTeacherId(@Param("teacherId") String teacherId);

    @Query("SELECT pc FROM PublishedCourse pc " +
            "WHERE pc.status = 2 " +
            "AND pc.courseType.id = :courseTypeId")
    Page<PublishedCourse> findAllApprovedByCourseType(
            @Param("courseTypeId") Integer courseTypeId,
            Pageable pageable);
}
