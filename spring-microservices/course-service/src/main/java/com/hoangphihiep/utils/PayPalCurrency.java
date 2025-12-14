package com.hoangphihiep.utils;

import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import lombok.Getter;

@Getter
public enum PayPalCurrency {
    USD("USD", "United States Dollar", 2),
    EUR("EUR", "Euro", 2),
    GBP("GBP", "British Pound Sterling", 2),
    JPY("JPY", "Japanese Yen", 0),
    KRW("KRW", "South Korean Won", 0),
    VND("VND", "Vietnamese Dong", 0);

    private final String code;
    private final String name;
    private final int decimalPlaces;

    PayPalCurrency(String code, String name, int decimalPlaces) {
        this.code = code;
        this.name = name;
        this.decimalPlaces = decimalPlaces;
    }

    public static PayPalCurrency fromCode(String code) {
        for (PayPalCurrency currency : values()) {
            if (currency.code.equals(code)) {
                return currency;
            }
        }
        throw new AppException(ErrorCode.UNSUPPORTED_CURRENCY);
    }
}
