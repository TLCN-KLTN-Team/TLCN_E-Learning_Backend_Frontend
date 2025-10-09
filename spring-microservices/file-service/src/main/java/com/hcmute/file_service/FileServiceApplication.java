package com.hcmute.file_service;

import com.hcmute.file_service.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FileServiceApplication {

	public static void main(String[] args) {
		DotenvInitializer.init();
		SpringApplication.run(FileServiceApplication.class, args);
	}

}
