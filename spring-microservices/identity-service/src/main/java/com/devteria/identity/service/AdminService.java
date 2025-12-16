package com.devteria.identity.service;

import java.util.HashSet;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.UserRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.AccountStatus;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.UserMapper;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createAdmin(UserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (userRepository.existsByUsername(request.getUsername())) {

            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhone())
                .dob(request.getDob())
                .role(Role.ADMIN)
                .accountStatus(AccountStatus.INACTIVE)
                .isEmailVerified(true)
                .build();

        try {
            user = userRepository.save(user);
            return userMapper.toUserResponse(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
    }
}
