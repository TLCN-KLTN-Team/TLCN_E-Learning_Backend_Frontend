package com.hcmute.file_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthUploadResult {
    String secureUrl;
    String publicId;
    String resourceType;
}
