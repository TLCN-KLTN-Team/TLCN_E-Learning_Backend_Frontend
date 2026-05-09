package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Integer> {
    Optional<Certificate> findByUserIdAndPublishedCourse_Id(String userId, Integer publishedCourseId);
    Optional<Certificate> findByCertificateCode(String certificateCode);
    Optional<Certificate> findByCertificateHash(String certificateHash);
}
