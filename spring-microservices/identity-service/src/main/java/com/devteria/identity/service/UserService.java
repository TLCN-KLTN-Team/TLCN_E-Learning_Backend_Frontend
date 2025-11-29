package com.devteria.identity.service;

import java.time.LocalDate;
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
import org.springframework.transaction.annotation.Transactional;
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
    PasswordEncoder passwordEncoder;
    UploadImageApi uploadFileApi;
    RemoveImageApi removeFileApi;
    OTPService otpService;
    EmailVerificationService emailVerificationService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void adminVerifyAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    public void verifyAccount(String email, String otpCode){
        try {
            emailVerificationService.verifyOtp(email, otpCode);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setEmailVerified(true);
            userRepository.save(user);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.NON_EXECUTE);
        }
    }

    public void sendEmailVerification(RegisterRequest request) {
        if (!isValidPassword(request.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_WEAK);
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (request.getPhoneNumber() != null && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        try {
            // Send OTP with registration data as context
            otpService.sendEmailVerificationOtp(request.getEmail(), request);
            log.info("Email verification OTP sent successfully to: {}", request.getEmail());
        } catch (Exception e) {
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    @Transactional
    public String createUser(RegisterRequest request) {
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        user.setEmailVerified(false);
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

        this.sendEmailVerification(request);
        try {
            userRepository.save(user);
            return user.getEmail();
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
    }

    boolean isValidPassword(String password) {
        // At least one digit, one lowercase letter, one uppercase letter, one special character, no whitespace, at
        // least 6 characters
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{6,}$";
        return password.matches(regex);
    }

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

    // update account status
    public void changeAccountStatus(String userId, String status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        try {
            AccountStatus newStatus = AccountStatus.valueOf(status.toUpperCase());
            user.setAccountStatus(newStatus);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_ACCOUNT_STATUS);
        }
    }

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
    public PaginatedResponse<UserResponse> getUsers(int page, int size, String keyword, String role, String status) {
        log.info("Vo day va chua cache");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users = userRepository.findByFilters(keyword,role,status,pageable);
        List<UserResponse> userList = users.getContent().stream()
                .map(user -> {
                    UserResponse res = userMapper.toUserResponse(user);
                    Set<String> userRoles =
                            user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
                    String createdAt = user.getCreatedAt() != null ? user.getCreatedAt().toString() : LocalDate.now().toString();
                    res.setRoles(userRoles);
                    res.setCreatedAt(createdAt);
                    res.setAccountStatus(user.getAccountStatus().toString());
                    return res;
                })
                .toList();



        PaginatedResponse<UserResponse> response = PaginatedResponse.<UserResponse>builder()
                .content(userList)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .build();

        return response;
    }

    private static boolean isMatchKeyword(String keyword, User user) {
        boolean matchKeyword = true;
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase().trim();
            matchKeyword = (user.getUsername() != null && user.getUsername().toLowerCase().contains(lowerKeyword)) ||
                    (user.getEmail() != null && user.getEmail().toLowerCase().contains(lowerKeyword)) ||
                    (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(lowerKeyword)) ||
                    (user.getLastName() != null && user.getLastName().toLowerCase().contains(lowerKeyword));
        }
        return matchKeyword;
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')")
    public UserResponse getUser(String id) {
        log.info("Call to db");
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
    }
}
