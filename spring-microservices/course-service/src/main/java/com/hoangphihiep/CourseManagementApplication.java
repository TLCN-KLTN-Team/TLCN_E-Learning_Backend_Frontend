package com.hoangphihiep;

import com.hoangphihiep.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableFeignClients
@EnableJpaRepositories(basePackages = "com.hoangphihiep.repository")
public class CourseManagementApplication {
	public static void main(String[] args) {
		DotenvInitializer.init();
		SpringApplication.run(CourseManagementApplication.class, args);
	}

}
