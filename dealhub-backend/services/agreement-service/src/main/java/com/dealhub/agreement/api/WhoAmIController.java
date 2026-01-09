package com.dealhub.agreement.api;

import com.dealhub.agreement.security.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/debug")
public class WhoAmIController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        Object principal = (auth != null ? auth.getPrincipal() : null);

        if (principal instanceof AuthenticatedUser u) {
            return Map.of(
                    "userId", u.userId(),
                    "email", u.email(),
                    "role", u.role(),
                    "lenderId", u.lenderId()
            );
        }

        return Map.of(
                "principalClass", principal == null ? null : principal.getClass().getName(),
                "principalValue", String.valueOf(principal)
        );
    }
}
