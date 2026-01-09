package com.dealhub.iam.auth;

import com.dealhub.iam.api.dto.RegisterRequest;
import com.dealhub.iam.security.JwtService;
import com.dealhub.iam.user.Role;
import com.dealhub.iam.user.User;
import com.dealhub.iam.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public User register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (req.role() == Role.LENDER && req.lenderId() == null) {
            throw new IllegalArgumentException("lenderId is required for LENDER");
        }

        User u = User.builder()
                .email(req.email().toLowerCase())
                .passwordHash(encoder.encode(req.password()))
                .role(req.role())
                .lenderId(req.role() == Role.LENDER ? req.lenderId() : null)
                .enabled(true)
                .build();

        return users.save(u);
    }

    public String login(String email, String password) {
        User u = users.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!u.isEnabled() || !encoder.matches(password, u.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return jwt.generate(u);
    }
}
