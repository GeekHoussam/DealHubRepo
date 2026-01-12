package com.dealhub.iam.api;

import com.dealhub.iam.api.dto.CreateUserRequest;
import com.dealhub.iam.api.dto.ResetUserPasswordRequest;
import com.dealhub.iam.api.dto.UpdateUserEnabledRequest;
import com.dealhub.iam.api.dto.UserDto;
import com.dealhub.iam.user.Role;
import com.dealhub.iam.user.User;
import com.dealhub.iam.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/admin/users")
public class AdminUsersController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminUsersController(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    private static UserDto toDto(User u) {
        return new UserDto(
                u.getId(),
                u.getEmail(),
                u.getRole() != null ? u.getRole().name() : null,
                u.getLenderId(),
                u.isEnabled()
        );
    }

     //LIST USERS
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> list() {
        return userRepo.findAll().stream()
                .sorted(Comparator.comparing(User::getId).reversed())
                .map(AdminUsersController::toDto)
                .toList();
    }

    //CREATE USER
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto create(@Valid @RequestBody CreateUserRequest req) {

        if (userRepo.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        Role role;
        try {
            role = Role.valueOf(req.role().toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + req.role());
        }

        if (role == Role.LENDER && req.lenderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lenderId is required for LENDER");
        }

        User u = User.builder()
                .email(req.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(role)
                .lenderId(role == Role.LENDER ? req.lenderId() : null)
                .enabled(true)
                .build();

        return toDto(userRepo.save(u));
    }

    // ENABLE / DISABLE USER
    @PatchMapping("/{id}/enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto setEnabled(@PathVariable Long id, @Valid @RequestBody UpdateUserEnabledRequest req) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        u.setEnabled(Boolean.TRUE.equals(req.enabled()));
        return toDto(userRepo.save(u));
    }

    // RESET PASSWORD
    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetUserPasswordRequest req) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        u.setPasswordHash(passwordEncoder.encode(req.password()));
        userRepo.save(u);
    }
}
