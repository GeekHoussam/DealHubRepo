package com.dealhub.iam.api;

import com.dealhub.iam.user.Role;
import com.dealhub.iam.user.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/internal")
public class InternalIamController {

    private final UserRepository userRepo;

    public InternalIamController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/lenders/{lenderId}/emails")
    public List<String> lenderEmails(
            @PathVariable Long lenderId,
            @RequestHeader(name = "X-INTERNAL-KEY", required = false) String key
    ) {
        if (key == null || key.isBlank() || !key.equals("dealhub-internal")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing/invalid internal key");
        }

        return userRepo.findByRoleAndLenderId(Role.LENDER, lenderId)
                .stream()
                .map(u -> u.getEmail())
                .toList();
    }
}
