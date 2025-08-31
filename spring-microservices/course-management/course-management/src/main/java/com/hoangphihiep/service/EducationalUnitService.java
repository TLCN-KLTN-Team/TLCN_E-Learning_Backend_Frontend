package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.EducationalUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EducationalUnitService {

    private final EducationalUnitRepository educationalUnitRepository;
    public EducationalUnitResponse getInstitutionByAdminId(String adminId) {
        if (adminId == null || adminId.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        try {
            Optional<EducationalUnit> institution = educationalUnitRepository.findByIdAdmin(adminId);

            if (institution.isEmpty()) {
                log.warn("No institution found for admin ID: {}", adminId);
                return null;
            }

            EducationalUnit edu = institution.get();
            log.info("Found institution {} for admin ID: {}", edu.getName(), adminId);

            return EducationalUnitResponse.builder()
                    .id(String.valueOf(edu.getId()))
                    .name(edu.getName())
                    .type(edu.getType())
                    .address(edu.getAddress())
                    .phone(edu.getPhone())
                    .email(edu.getEmail())
                    .website(edu.getWebsite())
                    .logo(edu.getLogo())
                    .description(edu.getDescription())
                    .establishedYear(edu.getEstablishedYear())
                    .isActive(edu.isActive())
                    .subscriptionStartDate(edu.getSubscriptionStartDate())
                    .subscriptionEndDate(edu.getSubscriptionEndDate())
                    .createdAt(edu.getCreatedAt())
                    .build();

        } catch (Exception e) {
            log.error("Error occurred while checking institution for admin: {}", adminId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
