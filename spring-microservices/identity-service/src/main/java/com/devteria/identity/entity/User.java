package com.devteria.identity.entity;

import java.io.Serializable;
import java.time.LocalDate;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@Inheritance(strategy = InheritanceType.JOINED)
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "username", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String username;

    String password;

    @Column(name = "email", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String email;

    @Column(name = "phone_number", unique = true)
    String phoneNumber;

    @Column(name = "first_name")
    String firstName;

    @Column(name = "last_name")
    String lastName;

    String dob;

    String avatarUrl;
    String cloudinaryPublicId;
    String bio;

    @Enumerated(EnumType.STRING)
    AccountStatus accountStatus;
    boolean isEmailVerified;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    Role role = Role.USER;

    LocalDate createdAt;
    LocalDate updatedAt;
}
