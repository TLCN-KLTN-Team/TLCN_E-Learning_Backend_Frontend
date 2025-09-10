package com.hcmute.file_handler;

import com.hcmute.file_handler.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FileHandlerApplication {

	public static void main(String[] args) {
		DotenvInitializer.init();
		SpringApplication.run(FileHandlerApplication.class, args);
	}

}
