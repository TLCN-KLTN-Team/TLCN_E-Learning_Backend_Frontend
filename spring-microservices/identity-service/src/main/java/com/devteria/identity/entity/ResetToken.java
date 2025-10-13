package com.devteria.identity.entity;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetToken {
    private String token;
    private String email;
    private LocalDateTime expirationTime;
    private boolean used;

    public ResetToken(String token, String email) {
        this.token = token;
        this.email = email;
        this.expirationTime = LocalDateTime.now().plusMinutes(15); // 15 minutes expiry
        this.used = false;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expirationTime);
    }

    public boolean isValid() {
        return !used && !isExpired();
    }

    public void markAsUsed() {
        this.used = true;
    }
}
