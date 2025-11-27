package com.devteria.identity.configuration;

import java.util.HashSet;
import java.util.Set;

import com.devteria.identity.entity.AccountStatus;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
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
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
        log.info("Initializing application.....");

        return args -> {

            // 1) Tạo 5 roles nếu chưa tồn tại
            createRoleIfNotExist(roleRepository, "USER");
            createRoleIfNotExist(roleRepository, "STUDENT");
            createRoleIfNotExist(roleRepository, "TEACHER");
            createRoleIfNotExist(roleRepository, "ADMIN");
            Role superAdminRole = createRoleIfNotExist(roleRepository, "SUPER_ADMIN");

//            Set<Role> rolesOfSuperAdmin = new HashSet<>();
//            rolesOfSuperAdmin.add(superAdminRole);

            // 2) Tạo tài khoản SUPER_ADMIN mặc định
            if (userRepository.findByEmail(SUPER_ADMIN_EMAIL).isEmpty()) {
                User user = User.builder()
                        .email(SUPER_ADMIN_EMAIL)
                        .accountStatus(AccountStatus.ACTIVE)
                        .isEmailVerified(true)
                        .firstName("Super")
                        .lastName("Admin")
                        .phoneNumber("+1234567890")
                        .password(passwordEncoder.encode(SUPER_ADMIN_PASSWORD))
                        .roles(Set.of(superAdminRole))
                        .build();

                userRepository.save(user);

                log.warn("Default SUPER_ADMIN created with email: {}, password: {}",
                        SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
            }

            log.info("Application initialization completed.");
        };
    }

    private Role createRoleIfNotExist(RoleRepository repo, String roleName) {
        return repo.findByName((roleName)).orElseGet(() -> {
            Role role = Role.builder()
                    .name(roleName)
                    .build();
            return repo.save(role);
        });
    }

}
