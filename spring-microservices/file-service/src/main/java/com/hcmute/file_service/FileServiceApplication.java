package com.hcmute.file_handler;

import com.hcmute.file_handler.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FileServiceApplication {

	public static void main(String[] args) {
		DotenvInitializer.init();
		SpringApplication.run(FileServiceApplication.class, args);
	}

}
