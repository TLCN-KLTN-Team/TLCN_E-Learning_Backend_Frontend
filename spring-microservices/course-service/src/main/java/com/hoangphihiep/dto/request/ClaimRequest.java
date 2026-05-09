package com.hoangphihiep.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClaimRequest {
    private String walletAddress;
    private String signature;
    private String message;
}
