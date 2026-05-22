package com.hcmute.ai_service;

import com.hcmute.ai_service.config.InitConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiServiceApplication {

	public static void main(String[] args) {
		InitConfig.init();
		SpringApplication.run(AiServiceApplication.class, args);
	}

}
