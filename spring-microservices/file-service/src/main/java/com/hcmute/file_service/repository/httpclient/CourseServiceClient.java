package com.hcmute.file_service.repository.httpclient;

import com.hcmute.file_service.config.AuthenticationRequestInterceptor;
import com.hcmute.file_service.dto.response.ApiResponse;
import com.hcmute.file_service.dto.response.EducationalUnitDetailResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "course-service",
        url = "${app.services.course}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface CourseServiceClient {

    @GetMapping(value = "/anonymous/home/educational-units/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<EducationalUnitDetailResponse> getEducationalUnitById(@PathVariable("id") Integer id);
}
