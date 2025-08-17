package demo.app.chat_app.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Slf4j
@Configuration
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi groupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("chat-app")
                .packagesToScan("demo.app.chat_app.controller")
                .build();
    }

    @Bean
    public OpenAPI openAPI(
        @Value("${openapi.services.title}") String title,
        @Value("${openapi.services.server}") String server,
        @Value("${openapi.services.version}") String version,
        @Value("${openapi.services.license.name}") String licenseName,
        @Value("${openapi.services.license.url}") String licenseUrl
    ){
        log.info("title: {}, server: {}, version: {}, licenseName: {}, licenseUrl: {}",
                title, server, version, licenseName, licenseUrl);

        final String jwtSchema = "bearerAuth";
        final String oauth2Schema = "oauth2";
        return new OpenAPI()
                .info(new Info()
                        .title(title)
                        .version(version)
                        .description("API documents for Inspector Lawyer service")
                        .license(new License().name(licenseName).url(licenseUrl)))
                .servers(
                        List.of(new Server().url(server)))
                .components(new Components()
                        .addSecuritySchemes(jwtSchema, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                ).security(List.of(new SecurityRequirement().addList(jwtSchema)));
    }
}
