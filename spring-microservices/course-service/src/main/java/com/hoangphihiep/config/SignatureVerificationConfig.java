package com.hoangphihiep.config;

import com.hoangphihiep.utils.RevocationTimeoutPolicy;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "signature-verification")
@Data
public class SignatureVerificationConfig {
    private List<String> trustedIssuerKeywords = new ArrayList<>(List.of("NEAC", "VNPT", "VIETTEL", "FPT"));
    private Integer revocationTimeoutMs = 3000;
    private RevocationTimeoutPolicy revocationTimeoutPolicy = RevocationTimeoutPolicy.MANUAL_REVIEW;
}
