package com.devteria.identity.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Component;

@Component
public class CookiesUtils {
    public String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) if (c.getName().equals(name)) return c.getValue();
        return null;
    }
}
