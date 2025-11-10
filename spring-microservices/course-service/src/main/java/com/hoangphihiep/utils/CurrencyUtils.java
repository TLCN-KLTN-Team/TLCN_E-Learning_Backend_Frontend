package com.hoangphihiep.utils;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Component
public class CurrencyUtils {
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
