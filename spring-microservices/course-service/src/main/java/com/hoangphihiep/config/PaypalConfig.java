package com.hoangphihiep.config;

import com.paypal.core.PayPalEnvironment;
import com.paypal.core.PayPalHttpClient;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class PaypalConfig {
    @Value("${paypal.client.id}")
    private String clientId;
    @Value("${paypal.client.secret}")
    private String clientSecret;
    @Value("${paypal.mode}")
    private String mode;
    @Value("${paypal.return-url}")
    private String paypalReturnUrl;
    @Value("${paypal.cancel-url}")
    private String paypalCancelUrl;

    @Bean
    public PayPalHttpClient payPalHttpClient() {
        PayPalEnvironment env;
        if ("sandbox".equalsIgnoreCase(mode)){
            env = new PayPalEnvironment.Sandbox(clientId, clientSecret);
        } else {
            env = new PayPalEnvironment.Live(clientId, clientSecret);
        }
        return new PayPalHttpClient(env);
    }

}
