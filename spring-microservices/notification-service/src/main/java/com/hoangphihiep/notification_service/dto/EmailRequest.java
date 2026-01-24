package com.hoangphihiep.notification_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {
    @Email
    @NotBlank
    private String to;
    
    @NotBlank
    private String subject;
    
    @NotBlank
    private String content; // HTML or Text
    
    private boolean isHtml;
}
