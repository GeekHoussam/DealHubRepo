package com.dealhub.notification.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByLenderIdOrderByCreatedAtDesc(Long lenderId);
}
