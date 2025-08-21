package com.hoangphihiep.repository;

import com.hoangphihiep.entity.RevenueShareConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RevenueShareConfigRepository extends JpaRepository<RevenueShareConfig, Integer> {


}
