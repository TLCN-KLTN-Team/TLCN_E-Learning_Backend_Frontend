package com.devteria.identity.repository;

import com.devteria.identity.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
}
