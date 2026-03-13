package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Integer> {
    Optional<Certificate> findByUserIdAndCourseId(String userId, Integer courseId);
    Optional<Certificate> findByCertificateCode(String certificateCode);
}
