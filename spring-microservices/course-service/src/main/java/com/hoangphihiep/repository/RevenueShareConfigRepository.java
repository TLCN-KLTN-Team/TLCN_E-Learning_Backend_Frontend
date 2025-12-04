package com.hoangphihiep.repository;

import com.hoangphihiep.entity.RevenueShareConfig;
import com.hoangphihiep.utils.RecipientType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RevenueShareConfigRepository extends JpaRepository<RevenueShareConfig, Integer> {
    
    List<RevenueShareConfig> findByIsActiveTrue();
    
    Optional<RevenueShareConfig> findByRecipientTypeAndIsActiveTrue(RecipientType recipientType);
}
