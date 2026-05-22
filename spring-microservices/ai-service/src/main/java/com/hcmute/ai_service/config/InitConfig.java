package com.hcmute.ai_service.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.nio.file.Path;

@Slf4j
@Configuration
public class InitConfig {

    public static void init() {

        try {
            // Get full path
            Path currentPath = Path.of("").toAbsolutePath();
            Path envPath;

            if (currentPath.getFileName().toString().equals("ai-service")) {
                envPath = currentPath.resolve(".env");
            } else {
                envPath = currentPath.resolve("ai-service").resolve(".env");
            }

            Dotenv dotenv;
            if (new File(envPath.toString()).exists()) {
                dotenv = Dotenv.configure()
                        .directory(envPath.getParent().toString())
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
            } else {
                dotenv = Dotenv.configure().ignoreIfMissing().load();
            }

            // set system properties for Spring to pick up
            dotenv.entries().forEach(entry -> {
                String existingValue = System.getProperty(entry.getKey());
                if (existingValue == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });

            log.info("Successfully loaded environment variables from .env file for ai-service");
        } catch (Exception e) {
            // Log the error but don't fail the application
            System.err.println("Error loading .env file: " + e.getMessage());
        }

    }

}
