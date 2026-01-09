package com.dealhub.iam;

import com.dealhub.iam.api.dto.RegisterRequest;
import com.dealhub.iam.auth.AuthService;
import com.dealhub.iam.user.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedData {

    @Bean
    CommandLineRunner seed(AuthService auth) {
        return args -> {
            try { auth.register(new RegisterRequest("admin@dealhub.com","admin", Role.ADMIN, null)); } catch (Exception ignored) {}
            try { auth.register(new RegisterRequest("agent@dealhub.com","agent", Role.AGENT, null)); } catch (Exception ignored) {}
            try { auth.register(new RegisterRequest("lender1@dealhub.com","lender", Role.LENDER, 101L)); } catch (Exception ignored) {}
        };
    }
}
