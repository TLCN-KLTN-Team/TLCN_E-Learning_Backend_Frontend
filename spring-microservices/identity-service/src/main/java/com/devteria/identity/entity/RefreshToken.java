package com.devteria.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.validator.constraints.UUID;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "refresh_tokens")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String userId;
    String tokenHash;
    LocalDateTime expiryAt;
    LocalDateTime createdAt;
    LocalDateTime lastUsedAt;
    boolean revoked;
    String ipAddress;
}
