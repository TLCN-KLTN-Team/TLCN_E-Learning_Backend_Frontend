package com.devteria.identity.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devteria.identity.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {}
