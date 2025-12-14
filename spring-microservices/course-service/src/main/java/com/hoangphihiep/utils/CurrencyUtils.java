package com.hoangphihiep.utils;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

@Component
public class CurrencyUtils {

    public String formatAmount(BigDecimal amount, PayPalCurrency currency) {
        int decimalPlaces = currency.getDecimalPlaces();

        // Round về số chữ số thập phân phù hợp
        BigDecimal rounded = amount.setScale(decimalPlaces, RoundingMode.HALF_UP);

        // Format string
        if (decimalPlaces == 0) {
            return String.format("%.0f", rounded);
        } else {
            return String.format("%." + decimalPlaces + "f", rounded);
        }
    }

    public String formatCurrency(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            return getVNDFormat().format(0);
        }
        return getVNDFormat().format(amount);
    }

    public NumberFormat getVNDFormat() {
        return NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
    }
}
