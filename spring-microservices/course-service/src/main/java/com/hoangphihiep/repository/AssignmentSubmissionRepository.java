package com.hoangphihiep.repository;

import com.hoangphihiep.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Integer> {
    List<AssignmentSubmission> findByAssignmentId(Integer assignmentId);
    List<AssignmentSubmission> findByIdUser(String idUser); // Sửa từ UserId thành IdUser
    Optional<AssignmentSubmission> findByAssignmentIdAndIdUser(Integer assignmentId, String idUser); // Thay userId thành idUser
}