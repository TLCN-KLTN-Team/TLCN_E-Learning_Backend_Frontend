package com.hoangphihiep.service;

import com.hoangphihiep.utils.PayPalCurrency;

import java.math.BigDecimal;
import java.util.Map;

public interface ExchangeRateService {
    BigDecimal getRate(String from, String to);
    BigDecimal convertFromVND(BigDecimal amountVND, PayPalCurrency targetCurrency);
    Map<String, BigDecimal> getAllRates();
}
