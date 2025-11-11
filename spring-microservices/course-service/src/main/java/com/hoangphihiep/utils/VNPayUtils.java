package com.hoangphihiep.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Component
public class VNPayUtils {

    public String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }

    public String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(result);
        } catch (Exception e) {
            return "";
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }

    // Sắp xếp params theo thứ tự alphabet
    public Map<String, String> sortedParams(Map<String, String> params) {
        return new TreeMap<>(params);
    }

    public Map<String, String> getQueryParams(HttpServletRequest request) {
        Map<String, String> result = new HashMap<>();
        for (Enumeration<String> e = request.getParameterNames(); e.hasMoreElements();) {
            String key = e.nextElement();
            String value = request.getParameter(key);
            result.put(key, value);
        }
        return result;
    }

    // Encode by US_ASCII
    public String urlEncode(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.US_ASCII.toString());
        } catch (Exception e) {
            return "";
        }
    }

    // create hash code for all fields
    public String hashAllFields(Map<String, String> params, String secretKey) {
        // 1. Build data để hash
        StringBuilder hashData = new StringBuilder();

        for (Map.Entry<String, String> entry : sortedParams(params).entrySet()) {
            if (hashData.length() > 0) hashData.append("&");
            hashData.append(entry.getKey())
                    .append("=")
                    .append(this.urlEncode(entry.getValue()));
        }

        // 2. Ký bằng secretKey
        return this.hmacSHA512(secretKey, hashData.toString());
    }

}
