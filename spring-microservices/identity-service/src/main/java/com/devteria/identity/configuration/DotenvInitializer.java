package com.devteria.identity.configuration;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DotenvInitializer {
    public static void init() {
        try {
            // Try to find .env file in the identity-service directory
            Path currentPath = Paths.get("").toAbsolutePath();
            Path envPath;

            // Check if we're running from the identity-service directory
            if (currentPath.getFileName().toString().equals("identity-service")) {
                envPath = currentPath.resolve(".env");
            } else {
                // We're probably running from the parent directory, look in identity-service
                envPath = currentPath.resolve("identity-service").resolve(".env");
            }

            log.info("Looking for .env file at: {}", envPath.toString());

            Dotenv dotenv;
            if (new File(envPath.toString()).exists()) {
                // Load from specific directory
                dotenv = Dotenv.configure()
                        .directory(envPath.getParent().toString())
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
            } else {
                // Fallback: try to load from current directory or classpath
                dotenv = Dotenv.configure().ignoreIfMissing().load();
            }

            // Set system properties
            dotenv.entries().forEach(entry -> {
                String existingValue = System.getProperty(entry.getKey());
                if (existingValue == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                    log.debug("Set system property: {}", entry.getKey());
                } else {
                    log.debug("System property {} already exists, keeping existing value", entry.getKey());
                }
            });

            log.info("Successfully loaded environment variables from .env file");

        } catch (DotenvException e) {
            log.warn(
                    "Could not load .env file: {}. Using system environment variables and application defaults.",
                    e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error while loading .env file: {}", e.getMessage(), e);
        }
    }
}
