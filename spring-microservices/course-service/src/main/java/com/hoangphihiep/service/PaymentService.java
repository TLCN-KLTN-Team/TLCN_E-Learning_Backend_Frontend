package com.hoangphihiep.service;

import com.hoangphihiep.config.PaypalConfig;
import com.hoangphihiep.config.VNPayConfig;
import com.hoangphihiep.dto.request.CreationOrderRequest;
import com.hoangphihiep.dto.request.OrderPreviewRequest;
import com.hoangphihiep.dto.request.PaymentRequest;
import com.hoangphihiep.dto.response.OrderPreviewResponse;
import com.hoangphihiep.dto.response.PaypalOrderResponse;
import com.hoangphihiep.dto.response.VNPayReturnResponse;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.PublishedCourseRepository;
import com.hoangphihiep.utils.CurrencyUtils;
import com.hoangphihiep.utils.PayPalCurrency;
import com.hoangphihiep.utils.PaypalAmountInfo;
import com.hoangphihiep.utils.VNPayUtils;
import com.paypal.core.PayPalHttpClient;
import com.paypal.http.HttpResponse;
import com.paypal.orders.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final VNPayConfig vnPayConfig;
    private final VNPayUtils vnPayUtils;
    private final PaypalConfig paypalConfig;
    private final PayPalHttpClient payPalHttpClient;
    private final OrderService orderService;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CurrencyUtils currencyUtils;
    private final ExchangeRateService exchangeRateService;

    // Tạo URL thanh toán VNPay khi user nhấn "Process Payment" on frontend
    public String createVNPayPaymentUrl(PaymentRequest request, HttpServletRequest httpRequest) throws Exception {
        BigDecimal amount = request.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.DOWN);; // VNPay yêu cầu số tiền nhân 100
        log.info("vnp_Amount sent to VNPay = {}",amount);
        String orderId = UUID.randomUUID().toString();
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount)); // Nhân 100
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", orderId);
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

        // create order with status PENDING
        CreationOrderRequest orderRequest = CreationOrderRequest.builder()
                .orderId(orderId)
                .createTime(new Date(System.currentTimeMillis()))
                .orderItems(request.getOrderItems())
                .currency("VND")
                .build();

        System.out.println ("Các item 1: " + request.getOrderItems());
        orderService.createOrder(orderRequest);

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

    // Xử lý callback từ VNPay
    public VNPayReturnResponse handleVNPayCallback(HttpServletRequest request){
        Map<String, String> fields = vnPayUtils.getQueryParams(request);

        String vnpSecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");
        String calculatedHash = vnPayUtils.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());

        if (!calculatedHash.equals(vnpSecureHash)) {
            return VNPayReturnResponse.builder()
                    .success(false)
                    .message("Invalid signature - Data may have been tampered")
                    .build();
        }

        if ("00".equals(fields.get("vnp_ResponseCode"))) {
            // create order and save to database if needed
            String orderId = fields.get("vnp_TxnRef");
            var order = orderService.updateSuccessOrder(orderId);
            return VNPayReturnResponse.builder()
                    .success(true)
                    .amount(currencyUtils.formatCurrency(order.getAmount()))
                    .currency(order.getPaymentCurrency())
                    .message("OK")
                    .build();
        } else {
            return VNPayReturnResponse.builder()
                    .success(false)
                    .message("Payment failed with response code: " + fields.get("vnp_ResponseCode"))
                    .build();
        }
    }

    // Implement paypal payment
    // create paypal payment khi user nhấn "Process Payment" on frontend
    public String processPaypalPayment(PaymentRequest paymentRequest) {
        try {
            OrderRequest orderRequest = new OrderRequest();
            orderRequest.checkoutPaymentIntent("CAPTURE");

            // Setup amount
            PaypalAmountInfo amountInfo = preparePayPalAmount(paymentRequest);

            AmountWithBreakdown amountWithBreakdown = new AmountWithBreakdown()
                    .currencyCode(amountInfo.getCurrencyCode())
                    .value(amountInfo.getValue());

            // Purchase unit
            PurchaseUnitRequest purchaseUnitRequest = new PurchaseUnitRequest()
                    .amountWithBreakdown(amountWithBreakdown);

            orderRequest.purchaseUnits(Collections.singletonList(purchaseUnitRequest));

            // Application context
            ApplicationContext applicationContext = new ApplicationContext()
                    .returnUrl(paypalConfig.getPaypalReturnUrl())
                    .cancelUrl(paypalConfig.getPaypalCancelUrl());
            orderRequest.applicationContext(applicationContext);

            // Create order
            OrdersCreateRequest request = new OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody(orderRequest);

            HttpResponse<Order> response = payPalHttpClient.execute(request);
            Order order = response.result();

            // Lấy approval link
            for (LinkDescription link : order.links()) {
                if ("approve".equals(link.rel())) {
                    // create order with status PENDING
                    CreationOrderRequest orderCreationRequest = CreationOrderRequest.builder()
                            .orderId(order.id())
                            .createTime(new Date(System.currentTimeMillis()))
                            .orderItems(paymentRequest.getOrderItems())
                            .currency(amountInfo.getCurrencyCode())
                            .build();
                    orderService.createOrder(orderCreationRequest);
                    return link.href();
                }
            }

            return null;
        } catch (IOException e) {
            throw new AppException(ErrorCode.PAYPAL_CREATE_PAYMENT_FAILED);
        }
    }

    // capture paypal order khi user hoàn tất thanh toán trên paypal
    public PaypalOrderResponse capturePaypalOrder(String orderId) {
        OrdersCaptureRequest request = new OrdersCaptureRequest(orderId);
        request.requestBody(new OrderRequest());

        try {
            HttpResponse<Order> response = payPalHttpClient.execute(request);
            Order order = response.result();

            // Cập nhật trạng thái đơn hàng trong hệ thống
            var dbOrder = orderService.updateSuccessOrder(orderId);

            PaypalAmountInfo amountInfo = preparePayPalAmount(
                    PaymentRequest.builder()
                            .amount(dbOrder.getAmount())
                            .currency(dbOrder.getPaymentCurrency())
                            .build()
            );

            return PaypalOrderResponse.builder()
                    .status(order.status())
                    .orderId(orderId)
                    .amount(amountInfo.getValue())
                    .currency(dbOrder.getPaymentCurrency())
                    .build();
        } catch (IOException e) {
            throw new AppException(ErrorCode.PAYPAL_CAPTURE_PAYMENT_FAILED);
        }
    }

    private PaypalAmountInfo preparePayPalAmount(PaymentRequest paymentRequest) {
        // Validate currency
        PayPalCurrency targetCurrency = PayPalCurrency.fromCode(paymentRequest.getCurrency());

        // Số tiền gốc (VND)
        BigDecimal amountVND = paymentRequest.getAmount();

        // Convert sang tiền tệ đích
        BigDecimal convertedAmount = exchangeRateService.convertFromVND(amountVND, targetCurrency);

        // Format theo số chữ số thập phân của tiền tệ
        String formattedValue = currencyUtils.formatAmount(convertedAmount, targetCurrency);

        // Lấy tỉ giá để log/tracking
        BigDecimal exchangeRate = exchangeRateService.getAllRates().get(targetCurrency.getCode());

        return new PaypalAmountInfo(
                targetCurrency.getCode(),
                formattedValue,
                amountVND,
                exchangeRate
        );
    }

    public OrderPreviewResponse getOrderPreview(OrderPreviewRequest request) {
        List<PublishedCourse> courses = publishedCourseRepository.findAllById(request.getCourseIds());

        // get price follow currency
        PayPalCurrency targetCurrency = PayPalCurrency.fromCode(request.getCurrency());
        BigDecimal exchangeRate = exchangeRateService.getAllRates().get(targetCurrency.getCode());

        BigDecimal originalPrice = courses.stream()
                .map(course -> course.getCoursePrice()
                        .multiply(BigDecimal.valueOf(1.5))
                        .add(course.getCoursePrice())
                )
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = courses.stream()
                .map(PublishedCourse::getCoursePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscountedAmount = courses.stream()
                .map(course -> course.getCoursePrice().multiply(BigDecimal.valueOf(1.5)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OrderPreviewResponse.CourseItem> items = courses.stream()
                        .map(course -> {
                                    BigDecimal convertedAmount = exchangeRateService.convertFromVND(course.getCoursePrice(), targetCurrency);
                                    OrderPreviewResponse.CourseItem item = OrderPreviewResponse.CourseItem.builder()
                                .id(course.getId())
                                .courseName(course.getCourseName()!=null ? course.getCourseName():course.getCourse().getCourseName())
                                .price("VND".equals(request.getCurrency()) ? currencyUtils.formatCurrency(course.getCoursePrice()) : convertedAmount.toString())
                                .amount(course.getCoursePrice())
                                .discountedPrice(currencyUtils.formatCurrency(
                                        course.getCoursePrice().multiply(BigDecimal.valueOf(1.5))
                                ))
                                .imageUrl(course.getCourseImage())
                                .build();
                            return item;
                        }
                        ).toList();


        return OrderPreviewResponse.builder()
                .items(items)
                .originalPrice(currencyUtils.formatCurrency(originalPrice))
                .totalPrice(currencyUtils.formatCurrency(totalAmount))
                .amount(totalAmount)
                .discountedPrice(currencyUtils.formatCurrency(totalDiscountedAmount))
                .build();

    }
}