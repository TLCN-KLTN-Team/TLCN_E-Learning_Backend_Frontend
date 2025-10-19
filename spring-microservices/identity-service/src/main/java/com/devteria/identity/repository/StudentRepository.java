package com.devteria.identity.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {

    Optional<Student> findByStudentId(String studentId);

    boolean existsByStudentId(String studentId);

    @Query("SELECT s FROM Student s WHERE " + "(:studentId IS NULL OR s.studentId LIKE %:studentId%) AND "
            + "(:departmentId IS NULL OR s.idDepartment = :departmentId) AND "
            + "(:educationalUnitId IS NULL OR s.idEducational = :educationalUnitId)")
    Page<Student> findStudentsWithFilters(
            @Param("studentId") String studentId,
            @Param("departmentId") String departmentId,
            @Param("educationalUnitId") String educationalUnitId,
            Pageable pageable);

    Page<Student> findByIdEducational(int educationalUnitId, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.idEducational = :educationalUnitId AND "
            + "(:search IS NULL OR :search = '' OR "
            + "LOWER(s.studentId) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(s.className) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Student> findByEducationalUnitWithSearch(
            @Param("institutionId") int educationalUnitId, @Param("search") String search, Pageable pageable);

    List<Student> findByIdEducational(int educationalUnitId);
}
