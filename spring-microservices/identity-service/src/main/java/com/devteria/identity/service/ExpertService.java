package com.devteria.identity.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devteria.identity.dto.request.ExpertRequest;
import com.devteria.identity.dto.response.ExpertResponse;
import com.devteria.identity.entity.AccountStatus;
import com.devteria.identity.entity.Expert;
import com.devteria.identity.entity.Role;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.ExpertMapper;
import com.devteria.identity.repository.ExpertRepository;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ExpertService {

    ExpertRepository expertRepository;
    UserRepository userRepository;
    ExpertMapper expertMapper;
    PasswordEncoder passwordEncoder;

    public long countByEducationalUnit(Integer educationalUnitId) {
        return expertRepository.countByIdEducational(educationalUnitId);
    }

    @Transactional
    public ExpertResponse createExpert(ExpertRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (expertRepository.existsByExpertId(request.getExpertId())) {
            throw new AppException(ErrorCode.EXPERT_ID_ALREADY_EXISTS);
        }

        Expert expert = Expert.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.EXPERT)
                .expertId(request.getExpertId())
                .idEducational(
                        request.getEducationalUnitId() != null
                                ? Integer.parseInt(request.getEducationalUnitId())
                                : null)
                .description(request.getDescription())
                .accountStatus(AccountStatus.ACTIVE)
                .isEmailVerified(true)
                .build();

        try {
            expert = expertRepository.save(expert);
            return expertMapper.toExpertResponse(expert);
        } catch (DataIntegrityViolationException exception) {
            log.error("Error creating expert: {}", exception.getMessage());
            throw new AppException(ErrorCode.EXPERT_ALREADY_EXISTS);
        }
    }

    @Transactional
    public ExpertResponse updateExpert(String id, ExpertRequest request) {
        log.info("Updating expert with ID: {}", id);

        Expert existingExpert =
                expertRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!existingExpert.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
        }

        if (!existingExpert.getUsername().equals(request.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (!existingExpert.getExpertId().equals(request.getExpertId())
                && expertRepository.existsByExpertId(request.getExpertId())) {
            throw new AppException(ErrorCode.EXPERT_ID_ALREADY_EXISTS);
        }

        try {
            existingExpert.setUsername(request.getUsername());
            existingExpert.setEmail(request.getEmail());
            existingExpert.setFirstName(request.getFirstName());
            existingExpert.setLastName(request.getLastName());
            existingExpert.setExpertId(request.getExpertId());
            existingExpert.setIdEducational(
                    request.getEducationalUnitId() != null ? Integer.parseInt(request.getEducationalUnitId()) : null);
            existingExpert.setDescription(request.getDescription());

            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                existingExpert.setPassword(passwordEncoder.encode(request.getPassword()));
                log.info("Password updated for expert: {}", id);
            }

            Expert updatedExpert = expertRepository.save(existingExpert);
            return expertMapper.toExpertResponse(updatedExpert);

        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.EXPERT_ALREADY_EXISTS);
        }
    }

    public Page<ExpertResponse> getAllExperts(String expertId, String educationalUnitId, Pageable pageable) {

        Integer eduId = educationalUnitId != null ? Integer.parseInt(educationalUnitId) : null;

        Page<Expert> experts = expertRepository.findExpertsWithFilters(expertId, eduId, pageable);
        return experts.map(expertMapper::toExpertResponse);
    }

    public List<ExpertResponse> getExpertsByEducationalUnitId(int educationalUnitId) {
        List<Expert> experts = expertRepository.findByIdEducational(educationalUnitId);
        return expertMapper.toExpertResponseList(experts);
    }

    public Page<ExpertResponse> getExpertsByEducationalUnit(int educationalUnitId, String search, Pageable pageable) {
        log.info("Searching experts for educational unit: {}, search: {}", educationalUnitId, search);
        Page<Expert> experts;
        if (search != null && !search.trim().isEmpty()) {
            experts = expertRepository.findByInstitutionWithSearch(educationalUnitId, search, pageable);
        } else {
            // Reusing search method if standard pagination by edu id isn't explicitly defined separated in repo
            // but I defined findByIdEducational returning List, not Page.
            // repo.findExpertsWithFilters can be used here.
            experts = expertRepository.findExpertsWithFilters(null, educationalUnitId, pageable);
        }
        log.info("Found {} experts", experts.getTotalElements());
        return experts.map(expertMapper::toExpertResponse);
    }

    public ExpertResponse getExpertById(String id) {
        Expert expert = expertRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.EXPERT_NOT_FOUND));
        return expertMapper.toExpertResponse(expert);
    }

    public ExpertResponse getExpertByExpertId(String expertId) {
        Expert expert = expertRepository
                .findByExpertId(expertId)
                .orElseThrow(() -> new AppException(ErrorCode.EXPERT_NOT_FOUND));
        return expertMapper.toExpertResponse(expert);
    }

    @Transactional
    public void deleteExpert(String id) {
        if (!expertRepository.existsById(id)) {
            throw new AppException(ErrorCode.EXPERT_NOT_FOUND);
        }
        expertRepository.deleteById(id);
    }

    public ExpertResponse updateAccountStatus(String id, String status) {
        Expert expert = expertRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        try {
            AccountStatus accountStatus = AccountStatus.valueOf(status);
            expert.setAccountStatus(accountStatus);
            expert = expertRepository.save(expert);
            return expertMapper.toExpertResponse(expert);
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }
}
