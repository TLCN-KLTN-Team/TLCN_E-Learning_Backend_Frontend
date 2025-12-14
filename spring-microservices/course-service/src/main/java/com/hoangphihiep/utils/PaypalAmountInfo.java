package com.hoangphihiep.utils;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaypalAmountInfo {
    private String currencyCode;
    private String value;
    private BigDecimal originalAmountVND;
    private BigDecimal exchangeRate;
}
