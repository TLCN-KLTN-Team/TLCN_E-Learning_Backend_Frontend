package com.hoangphihiep.service;

import com.hoangphihiep.utils.PayPalCurrency;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class FixedExchangeRateService implements ExchangeRateService {

    // Tỉ giá mẫu (VND làm base currency)
    // Trong thực tế, nên lấy từ API như exchangerate-api.com, fixer.io, etc.
    private static final Map<String, BigDecimal> VND_RATES = new HashMap<>();

    static {
        VND_RATES.put("VND", BigDecimal.ONE);
        VND_RATES.put("USD", new BigDecimal("25300"));  // 1 USD = 25,300 VND
        VND_RATES.put("EUR", new BigDecimal("27500"));  // 1 EUR = 27,500 VND
        VND_RATES.put("GBP", new BigDecimal("32000"));  // 1 GBP = 32,000 VND
        VND_RATES.put("JPY", new BigDecimal("170"));    // 1 JPY = 170 VND
        VND_RATES.put("KRW", new BigDecimal("19"));     // 1 KRW = 19 VND
    }

    /**
     * Chuyển đổi từ VND sang tiền tệ khác
     * @param amountVND Số tiền VND
     * @param targetCurrency Tiền tệ đích
     * @return Số tiền sau khi chuyển đổi
     */
    @Override
    public BigDecimal convertFromVND(BigDecimal amountVND, PayPalCurrency targetCurrency) {
        BigDecimal rate = VND_RATES.get(targetCurrency.getCode());
        if (rate == null) {
            throw new IllegalArgumentException("Exchange rate not found for: " + targetCurrency.getCode());
        }

        // Chia VND cho tỉ giá để ra ngoại tệ
        return amountVND.divide(rate, targetCurrency.getDecimalPlaces() + 2, RoundingMode.HALF_UP);
    }

    /**
     * Lấy tỉ giá hiện tại từ API bên ngoài (optional)
     */
    public void updateExchangeRates() {
        // TODO: Gọi API để cập nhật tỉ giá thực tế
        // Ví dụ: https://api.exchangerate-api.com/v4/latest/VND
    }

    /**
     * Lấy tỉ giá hiển thị cho người dùng
     */
    @Override
    public Map<String, BigDecimal> getAllRates() {
        return new HashMap<>(VND_RATES);
    }

    @Override
    public BigDecimal getRate(String from, String to) {
        return null;
    }
}
