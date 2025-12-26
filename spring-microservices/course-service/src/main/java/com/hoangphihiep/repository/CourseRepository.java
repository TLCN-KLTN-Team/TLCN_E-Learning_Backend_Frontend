package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.EducationalUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    @Query("SELECT c FROM Course c WHERE c.educationalUnit.id = :educationalUnitId AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(c.courseName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.idTeacher) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> findByEducationalUnitWithSearch(@Param("educationalUnitId") int educationalUnitId, @Param("search") String search, Pageable pageable);

    List<Course> findByIdTeacher(String teacherId);

    @Query("SELECT COUNT(c) > 0 FROM Course c WHERE c.courseName = :courseName AND c.educationalUnit.id = :institutionId")
    boolean existsByCourseNameAndEducationalUnit(@Param("courseName") String courseName, @Param("institutionId") int institutionId);

    // Public courses methods - query through PublishedCourse
    @Query("SELECT c FROM Course c WHERE c.idTeacher = :teacherId AND " +
            "c.publishedCourse IS NOT NULL AND " +
            "c.publishedCourse.coursePrice > :price")
    Page<Course> findByIdTeacherAndPriceGreaterThan(@Param("teacherId") String teacherId, 
                                                      @Param("price") Double price, 
                                                      Pageable pageable);
    
    @Query("SELECT c FROM Course c WHERE c.idTeacher = :teacherId AND " +
            "c.publishedCourse IS NOT NULL AND " +
            "c.publishedCourse.coursePrice > :price")
    List<Course> findByIdTeacherAndPriceGreaterThan(@Param("teacherId") String teacherId, 
                                                     @Param("price") Double price);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.idTeacher = :teacherId")
    Integer countByTeacherId(@Param("teacherId") String teacherId);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.educationalUnit.id = :educationalUnitId")
    long countByEducationalUnitId(@Param("educationalUnitId") Integer educationalUnitId);
    
    @Query("SELECT c FROM Course c WHERE c.educationalUnit.id = :educationalUnitId")
    List<Course> findByEducationalUnitId(@Param("educationalUnitId") Integer educationalUnitId);
    
    // Dashboard KPI queries
    @Query("SELECT COUNT(c) FROM Course c WHERE c.publishedCourse IS NOT NULL AND " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR c.educationalUnit.type = :educationType) AND " +
            "c.createdAt >= :startDate AND c.createdAt <= :endDate")
    Long countActiveCoursesInPeriod(@Param("educationType") String educationType,
                                     @Param("startDate") java.util.Date startDate,
                                     @Param("endDate") java.util.Date endDate);
    
    @Query("SELECT COUNT(c) FROM Course c WHERE c.publishedCourse IS NOT NULL AND " +
            "(:educationType IS NULL OR :educationType = 'ALL' OR c.educationalUnit.type = :educationType)")
    Long countTotalActiveCourses(@Param("educationType") String educationType);
}
