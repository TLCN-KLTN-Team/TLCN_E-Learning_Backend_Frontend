package com.hoangphihiep.repository;

import com.hoangphihiep.entity.PublishedCourse;
<<<<<<< HEAD
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublishedCourseRepository extends JpaRepository<PublishedCourse, Long> {

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

    @Query("SELECT pc FROM PublishedCourse pc WHERE pc.status = 2") // 2 = Approved
    Page<PublishedCourse> findAllApproved(Pageable pageable);

    @Query("SELECT pc FROM PublishedCourse pc " +
            "WHERE pc.status = 2 " +
            "AND pc.courseType.id = :courseTypeId")
    Page<PublishedCourse> findAllApprovedByCourseType(
            @Param("courseTypeId") Integer courseTypeId,
            Pageable pageable);
}
=======
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PublishedCourseRepository extends JpaRepository<PublishedCourse, Long> {
}
>>>>>>> 21c8c7a ((e-learning features): load all published courses, watch detail course, and some pages for this apis)
