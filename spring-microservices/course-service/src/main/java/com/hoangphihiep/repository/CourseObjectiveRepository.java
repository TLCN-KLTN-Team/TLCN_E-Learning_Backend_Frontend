package com.hoangphihiep.repository;

import com.hoangphihiep.entity.CourseObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseObjectiveRepository extends JpaRepository<CourseObjective, Integer> {

    @Query("SELECT co FROM CourseObjective co WHERE co.course.id = :courseId ORDER BY co.code")
    List<CourseObjective> findByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT co FROM CourseObjective co WHERE co.course.id = :courseId AND co.code = :code")
    Optional<CourseObjective> findByCourseIdAndCode(@Param("courseId") Integer courseId, @Param("code") String code);

    @Query("SELECT COUNT(co) FROM CourseObjective co WHERE co.course.id = :courseId")
    int countByCourseId(@Param("courseId") Integer courseId);

    @Query("SELECT co FROM CourseObjective co WHERE co.isActive = true AND co.course.idTeacher = :teacherId ORDER BY co.course.id, co.code")
    List<CourseObjective> findActiveByTeacherId(@Param("teacherId") String teacherId);

    @Query("SELECT co FROM CourseObjective co WHERE co.course.id = :courseId AND co.isActive = true ORDER BY co.code")
    List<CourseObjective> findActiveByCourseId(@Param("courseId") Integer courseId);
}
