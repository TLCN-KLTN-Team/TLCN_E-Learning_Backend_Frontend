package com.devteria.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

import com.devteria.identity.configuration.DotenvInitializer;

@SpringBootApplication
@EnableFeignClients
public class IdentityServiceApplication {
    public static void main(String[] args) {
        DotenvInitializer.init();
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
