package com.hoangphihiep.repository;

import com.hoangphihiep.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Integer> {

    @Query("SELECT sp FROM SubscriptionPlan sp WHERE sp.id = :id")
    SubscriptionPlan findSubscriptionPlanById(@Param("id") Long id);

    @Query("SELECT sp FROM SubscriptionPlan sp WHERE sp.price BETWEEN :minPrice AND :maxPrice")
    List<SubscriptionPlan> findByPriceBetween(@Param("minPrice") double minPrice, @Param("maxPrice") double maxPrice);

    @Query("SELECT sp FROM SubscriptionPlan sp ORDER BY sp.price ASC")
    List<SubscriptionPlan> findAllOrderByPriceAsc();
}
