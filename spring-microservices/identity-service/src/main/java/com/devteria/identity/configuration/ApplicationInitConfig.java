package com.devteria.identity.configuration;

import java.util.Set;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.devteria.identity.entity.AccountStatus;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    private final PasswordEncoder passwordEncoder;

    static final String SUPER_ADMIN_EMAIL = "superadmin@example.com";
    static final String SUPER_ADMIN_PASSWORD = "superadmin";

    @Bean
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driverClassName",
            havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        log.info("Initializing application.....");

        return args -> {

            // 1) Tạo tài khoản SUPER_ADMIN mặc định
            if (userRepository.findByEmail(SUPER_ADMIN_EMAIL).isEmpty()) {
                User user = User.builder()
                        .email(SUPER_ADMIN_EMAIL)
                        .accountStatus(AccountStatus.ACTIVE)
                        .isEmailVerified(true)
                        .firstName("Super")
                        .lastName("Admin")
                        .phoneNumber("+1234567890")
                        .password(passwordEncoder.encode(SUPER_ADMIN_PASSWORD))
                        .role(Role.SUPER_ADMIN)
                        .build();

                userRepository.save(user);

                log.warn(
                        "Default SUPER_ADMIN created with email: {}, password: {}",
                        SUPER_ADMIN_EMAIL,
                        SUPER_ADMIN_PASSWORD);
            }

            log.info("Application initialization completed.");
        };
    }

}
