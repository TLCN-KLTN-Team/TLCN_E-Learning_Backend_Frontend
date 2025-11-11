package com.hoangphihiep.service;

import com.hoangphihiep.config.VNPayConfig;
import com.hoangphihiep.dto.request.PaymentRequest;
import com.hoangphihiep.dto.response.VNPayReturnResponse;
import com.hoangphihiep.repository.PaymentRepository;
import com.hoangphihiep.utils.VNPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final VNPayConfig vnPayConfig;
    private final VNPayUtils vnPayUtils;

    public String createVNPayPaymentUrl(PaymentRequest request, HttpServletRequest httpRequest) throws Exception {
        long amount = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue(); // VNPay yêu cầu số tiền nhân 100

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount)); // Nhân 100
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", "Thanh toan thnh cong:" + request.getOrderId());
        vnp_Params.put("vnp_OrderInfo", "info");
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnPayUtils.getIpAddress(httpRequest));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Sắp xếp params và tạo hash
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                if (!fieldName.equals(fieldNames.get(fieldNames.size() - 1))) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String vnp_SecureHash = vnPayUtils.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        return vnPayConfig.getVnp_PayUrl() + "?" + query.toString();
    }

    public VNPayReturnResponse handleVNPayCallback(HttpServletRequest request){
        Map<String, String> fields = vnPayUtils.getQueryParams(request);

        String vnpSecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");
        String calculatedHash = vnPayUtils.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());

        if (!calculatedHash.equals(vnpSecureHash)) {
            log.error("Invalid signature! VNPay hash: {}, Calculated hash: {}", vnpSecureHash, calculatedHash);
            return VNPayReturnResponse.builder()
                    .success(false)
                    .message("Invalid signature - Data may have been tampered")
                    .build();
        }

        if ("00".equals(fields.get("vnp_ResponseCode"))) {
            log.info("Payment successful for order: {}", fields.get("vnp_TxnRef"));
            return VNPayReturnResponse.builder()
                    .success(true)
                    .message("OK")
                    .build();
        } else {
            log.warn("Payment failed with response code: {}", fields.get("vnp_ResponseCode"));
            return VNPayReturnResponse.builder()
                    .success(false)
                    .message("Payment failed with response code: " + fields.get("vnp_ResponseCode"))
                    .build();
        }
    }

}
