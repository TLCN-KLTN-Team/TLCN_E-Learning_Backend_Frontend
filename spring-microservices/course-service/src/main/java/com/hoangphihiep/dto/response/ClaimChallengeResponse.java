package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClaimChallengeResponse {
    private String message;
    private String nonce;
    private Date expiresAt;
}
