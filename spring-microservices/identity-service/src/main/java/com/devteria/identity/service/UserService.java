package com.devteria.identity.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.dto.request.ChangePasswordRequest;
import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.PaginatedResponse;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.AccountStatus;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.ProfileMapper;
import com.devteria.identity.mapper.UserMapper;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;
import com.devteria.identity.repository.httpclient.ProfileClient;
import com.devteria.identity.repository.httpclient.RemoveImageApi;
import com.devteria.identity.repository.httpclient.UploadImageApi;

import io.micrometer.common.util.StringUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    ProfileMapper profileMapper;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    KafkaTemplate<String, Object> kafkaTemplate;
    UploadImageApi uploadFileApi;
    RemoveImageApi removeFileApi;
    OTPService otpService;

    public void sendEmailVerification(RegisterRequest request) {
        if (!isValidPassword(request.getPassword())) {
            log.error("Weak password provided for email: {}", request.getEmail());
            throw new AppException(ErrorCode.PASSWORD_WEAK);
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            log.error("Password confirmation mismatch for email: {}", request.getEmail());
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Email already exists: {}", request.getEmail());
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (request.getUsername() != null && userRepository.existsByUsername(request.getUsername())) {
            log.error("Username already exists: {}", request.getUsername());
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        try {
            // Send OTP with registration data as context
            otpService.sendEmailVerificationOtp(request.getEmail(), request);
            log.info("Email verification OTP sent successfully to: {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send email verification OTP to: {}", request.getEmail(), e);
            throw new AppException(ErrorCode.SYSTEM_ERROR);
        }
    }

    public UserResponse createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        HashSet<Role> roles = new HashSet<>();

        roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);

        Set<String> requestedRoles = request.getRoles();
        if (requestedRoles != null && !requestedRoles.isEmpty()) {
            requestedRoles.stream().forEach(role -> {
                Role existingRole =
                        roleRepository.findById(role).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                roles.add(existingRole);
            });
        }

        user.setRoles(roles);
        user.setAccountStatus(AccountStatus.ACTIVE);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        //        NotificationEvent notificationEvent = NotificationEvent.builder()
        //                .channel("EMAIL")
        //                .recipient(request.getEmail())
        //                .subject("Welcome to bookteria")
        //                .body("Hello, " + request.getUsername())
        //                .build();
        //
        //        // Publish message to kafka
        //        kafkaTemplate.send("notification-delivery", notificationEvent);

        var userCreationResponse = userMapper.toUserResponse(user);

        return userCreationResponse;
    }

    boolean isValidPassword(String password) {
        // At least one digit, one lowercase letter, one uppercase letter, one special character, no whitespace, at
        // least 6 characters
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{6,}$";
        return password.matches(regex);
    }

    @CachePut(value = "myInfo")
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String id = context.getAuthentication().getName();

        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UserResponse response = userMapper.toUserResponse(user);
        response.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));

        return response;
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userMapper.updateUser(user, request);
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        var roles = roleRepository.findAllById(request.getRoles());
        user.setRoles(new HashSet<>(roles));

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public void updateProfile(UserUpdateRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User updatedUser = userMapper.updateUser(user, request);

        // handle file to avatarUrl
        userRepository.save(updatedUser);
    }

    public String uploadAvatar(MultipartFile file) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        if (user.getAvatarUrl() == null) {
            // upload new avatar
            try {
                Map<String, String> response = uploadFileApi.uploadFile(file);
                user.setCloudinaryPublicId(response.get("publicId"));
                user.setAvatarUrl(response.get("url"));
                userRepository.save(user);
                return response.get("url");
            } catch (Exception e) {
                throw new AppException(ErrorCode.NON_EXECUTE);
            }
        }

        // remove old avatar if exists
        String existingPublicId = user.getCloudinaryPublicId();
        if (existingPublicId != null) {
            removeFileApi.removeFile(existingPublicId);
            try {
                Map<String, String> response = uploadFileApi.uploadFile(file);
                user.setCloudinaryPublicId(response.get("publicId"));
                user.setAvatarUrl(response.get("url"));
                userRepository.save(user);
                return response.get("url");
            } catch (Exception e) {
                throw new AppException(ErrorCode.NON_EXECUTE);
            }
        }
        return null;
    }

    @Cacheable(value = "changePassword", key = "#root.authentication.name")
    public void changePassword(ChangePasswordRequest request) {
        log.info("Call to db, not cached");
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_OLD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    //    @PreAuthorize("hasRole('ADMIN')")
    //    public UserResponse updateUserRoles(RoleUpdateRequest req) {
    //        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
    //        User user = userRepository.findById(userId).orElseThrow(() -> new
    // AppException(ErrorCode.USER_NOT_EXISTED));
    //
    //        var roles = roleRepository.findAllById(req.roles());
    //        user.setRoles(new HashSet<>(roles));
    //
    //        return userMapper.toUserResponse(userRepository.save(user));
    //    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    public void softDeleteUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAccountStatus(AccountStatus.INACTIVE);
        userRepository.save(user);
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Cacheable(value = "allUsers")
    public PaginatedResponse<UserResponse> getUsers(int page, int size, String sortBy, String sortDirection) {
        log.info("Vo day va chua cache");
        Sort sort = Sort.by("ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> users = userRepository.findAll(pageable);
        List<UserResponse> userList = users.getContent().stream()
                .map(user -> {
                    UserResponse res = userMapper.toUserResponse(user);
                    Set<String> userRoles =
                            user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
                    res.setRoles(userRoles);
                    return res;
                })
                .toList();

        PaginatedResponse<UserResponse> response = PaginatedResponse.<UserResponse>builder()
                .content(userList)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .first(users.isFirst())
                .last(users.isLast())
                .hasNext(users.hasNext())
                .hasPrevious(users.hasPrevious())
                .build();

        return response;
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Cacheable(value = "user", key = "#id")
    public UserResponse getUser(String id) {
        log.info("Call to db");
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
    }
}
