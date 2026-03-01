package com.banking.studentbank.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Student Bank Account Management API",
                version = "1.0",
                description = "REST API for managing student bank accounts with JWT authentication"
        )
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT Bearer token authentication",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new io.swagger.v3.oas.models.info.Info()
                        .title("Student Bank Account Management API")
                        .version("1.0.0")
                        .description("A comprehensive REST API for managing student bank accounts. " +
                                "Features include account creation, deposits, withdrawals, transfers, " +
                                "transaction history, and JWT-based authentication.")
                        .contact(new Contact()
                                .name("Banking System")
                                .email("admin@banking.com"))
                        .license(new License()
                                .name("MIT License")));
    }
}
