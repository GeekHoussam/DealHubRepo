package com.dealhub.iam.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // ✅ NEW: used by /internal/lenders/{lenderId}/emails
    List<User> findByRoleAndLenderId(Role role, Long lenderId);
}
