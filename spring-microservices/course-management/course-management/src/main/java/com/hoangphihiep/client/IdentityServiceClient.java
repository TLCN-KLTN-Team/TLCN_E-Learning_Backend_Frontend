package com.hoangphihiep.client;

import com.hoangphihiep.dto.request.*;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdentityServiceClient {

    private final RestTemplate restTemplate;
    private final JwtService jwtService;

    @Value("${app.services.identity}")
    private String identityServiceUrl;

    @Value("${identity.service.mock.enabled:false}")
    private boolean mockEnabled;

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String token = jwtService.generateServiceToken();
        headers.setBearerAuth(token);
        return headers;
    }

    public ApiResponse<List<TeacherResponse>> getAllTeachers(int page, int size, String search) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(identityServiceUrl + "/users")
                    .queryParam("page", page)
                    .queryParam("size", size)
                    .queryParam("search", search)
                    .toUriString();

            HttpEntity<?> entity = new HttpEntity<>(createAuthHeaders());

            ResponseEntity<ApiResponse<List<TeacherResponse>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<ApiResponse<List<TeacherResponse>>>() {}
            );

            ApiResponse<List<TeacherResponse>> apiResponse = response.getBody();

            if (apiResponse != null && apiResponse.getResult() != null) {
                List<TeacherResponse> filteredTeachers = apiResponse.getResult().stream()
                        .filter(user -> user.getRoles() != null &&
                                user.getRoles().stream()
                                        .anyMatch(role -> "TEACHER".equals(role.getName())))
                        .toList();

                return ApiResponse.<List<TeacherResponse>>builder()
                        .code(apiResponse.getCode())
                        .message(apiResponse.getMessage())
                        .result(filteredTeachers)
                        .build();
            }

            return apiResponse;
        } catch (Exception e) {
            log.error("Error calling identity service to get all teachers", e);
            throw new RuntimeException("Failed to get teachers from identity service", e);
        }
    }

    public ApiResponse<TeacherResponse> getTeacherById(String id) {

        try {
            String url = identityServiceUrl + "/users/" + id;

            HttpEntity<?> entity = new HttpEntity<>(createAuthHeaders());

            ResponseEntity<ApiResponse<TeacherResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<ApiResponse<TeacherResponse>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to get teacher by id: {}", id, e);
            throw new RuntimeException("Failed to get teacher from identity service", e);
        }
    }

    public ApiResponse<TeacherResponse> createTeacher(TeacherCreateRequest request) {

        try {
            // Step 1: Create User
            UserCreationRequest userRequest = UserCreationRequest.builder()
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .confirmPassword(request.getPassword())
                    .email(request.getEmail())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .dob(LocalDate.parse(request.getDob()))
                    .build();

            String userUrl = identityServiceUrl + "/users/registration";
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<UserCreationRequest> userEntity = new HttpEntity<>(userRequest, headers);

            ResponseEntity<ApiResponse<UserResponse>> userResponse = restTemplate.exchange(
                    userUrl,
                    HttpMethod.POST,
                    userEntity,
                    new ParameterizedTypeReference<ApiResponse<UserResponse>>() {}
            );

            if (userResponse.getBody() == null || userResponse.getBody().getResult() == null) {
                throw new RuntimeException("Failed to create user");
            }

            String userId = userResponse.getBody().getResult().getId();

            // Step 2: Create Teacher with userId
            TeacherCreationRequest teacherRequest = TeacherCreationRequest.builder()
                    .userId(userId)
                    .teacherId(request.getTeacherId())
                    .departmentId(request.getDepartmentId())
                    .educationalUnitId(request.getEducationalUnitId())
                    .description(request.getDescription())
                    .socialUrl(request.getSocialUrl())
                    .bankAccountNumber(request.getBankAccountNumber())
                    .build();

            String teacherUrl = identityServiceUrl + "/teachers";
            HttpEntity<TeacherCreationRequest> teacherEntity = new HttpEntity<>(teacherRequest, headers);

            ResponseEntity<ApiResponse<TeacherResponse>> response = restTemplate.exchange(
                    teacherUrl,
                    HttpMethod.POST,
                    teacherEntity,
                    new ParameterizedTypeReference<ApiResponse<TeacherResponse>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to create teacher", e);
            throw new RuntimeException("Failed to create teacher in identity service", e);
        }
    }
    public ApiResponse<TeacherResponse> updateTeacher(String id, TeacherUpdateRequest request) {

        try {
            String url = identityServiceUrl + "/users/" + id;

            HttpHeaders headers = createAuthHeaders();
            HttpEntity<TeacherUpdateRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<ApiResponse<TeacherResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    new ParameterizedTypeReference<ApiResponse<TeacherResponse>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to update teacher: {}", id, e);
            throw new RuntimeException("Failed to update teacher in identity service", e);
        }
    }

    public ApiResponse<Void> deleteTeacher(String id) {
        if (mockEnabled) {
            log.info("Mock: Deleted teacher with id: {}", id);
            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Teacher deleted successfully")
                    .build();
        }

        try {
            String url = identityServiceUrl + "/users/" + id;

            HttpEntity<?> entity = new HttpEntity<>(createAuthHeaders());

            ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    new ParameterizedTypeReference<ApiResponse<Void>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to delete teacher: {}", id, e);
            throw new RuntimeException("Failed to delete teacher in identity service", e);
        }
    }

    public ApiResponse<Void> lockTeacher(String id) {
        if (mockEnabled) {
            log.info("Mock: Locked teacher with id: {}", id);
            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Teacher locked successfully")
                    .build();
        }

        try {
            String url = identityServiceUrl + "/teachers/" + id + "/lock";

            ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    null,
                    new ParameterizedTypeReference<ApiResponse<Void>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to lock teacher: {}", id, e);
            throw new RuntimeException("Failed to lock teacher in identity service", e);
        }
    }

    public ApiResponse<Void> unlockTeacher(String id) {
        if (mockEnabled) {
            log.info("Mock: Unlocked teacher with id: {}", id);
            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Teacher unlocked successfully")
                    .build();
        }

        try {
            String url = identityServiceUrl + "/teachers/" + id + "/unlock";

            ResponseEntity<ApiResponse<Void>> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    null,
                    new ParameterizedTypeReference<ApiResponse<Void>>() {}
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling identity service to unlock teacher: {}", id, e);
            throw new RuntimeException("Failed to unlock teacher in identity service", e);
        }
    }

    private void assignTeacherRole(String userId, String password) {
        try {
            String url = identityServiceUrl + "/users/" + userId;

            UserUpdateRequest updateRequest = UserUpdateRequest.builder()
                    .password(password) // Keep the same password
                    .roles(List.of("TEACHER")) // Assign TEACHER role
                    .build();

            HttpHeaders headers = createAuthHeaders();
            HttpEntity<UserUpdateRequest> entity = new HttpEntity<>(updateRequest, headers);

            restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    new ParameterizedTypeReference<ApiResponse<TeacherResponse>>() {}
            );

            log.info("Successfully assigned TEACHER role to user: {}", userId);
        } catch (Exception e) {
            log.error("Error assigning TEACHER role to user: {}", userId, e);
            // Don't throw exception here to avoid breaking the user creation process
        }
    }


}
