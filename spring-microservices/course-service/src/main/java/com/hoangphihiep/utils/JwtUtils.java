package com.hoangphihiep.utils;

import org.springframework.security.core.context.SecurityContextHolder;

public class JwtUtils {
    public static String getCurrentUserId(){
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
