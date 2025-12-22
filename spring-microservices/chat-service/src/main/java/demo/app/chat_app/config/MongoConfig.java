package demo.app.chat_app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.Arrays;

/**
 * MongoDB configuration for custom converters
 * Note: Connection URI is configured via application.dev.yml and environment variables
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
            // Add custom converters if needed
        ));
    }
}
