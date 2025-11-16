package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    @Query("SELECT c FROM Cart c WHERE c.idUser = :userId AND c.courses IS NOT EMPTY")
    List<Cart> findActiveCartsByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(c) FROM Cart c WHERE c.idUser = :userId")
    long countByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM Cart c WHERE c.idUser = :userId")
    Optional<Cart> findByUserId(String userId);
}
