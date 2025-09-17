package com.devteria.identity.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.Teacher;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByTeacherId(String teacherId);

    boolean existsByTeacherId(String teacherId);

    @Query("SELECT t FROM Teacher t WHERE " +
            "(:teacherId IS NULL OR t.teacherId LIKE %:teacherId%) AND "
            + "(:departmentId IS NULL OR t.idDepartment = :departmentId) AND "
            + "(:educationalUnitId IS NULL OR t.idEducational = :educationalUnitId)")
    Page<Teacher> findTeachersWithFilters(
            @Param("teacherId") String teacherId,
            @Param("departmentId") String departmentId,
            @Param("educationalUnitId") String educationalUnitId,
            Pageable pageable);

    // Thêm methods mới cho admin
    Page<Teacher> findByIdEducational(int educationalUnitId, Pageable pageable);

    @Query("SELECT t FROM Teacher t WHERE t.idEducational = :institutionId AND " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(t.teacherId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Teacher> findByInstitutionWithSearch(
            @Param("institutionId") int institutionId,
            @Param("search") String search,
            Pageable pageable);
}
