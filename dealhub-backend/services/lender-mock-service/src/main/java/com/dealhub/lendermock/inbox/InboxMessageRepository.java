package com.dealhub.lendermock.inbox;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InboxMessageRepository extends JpaRepository<InboxMessageEntity, Long> {
    List<InboxMessageEntity> findTop50ByLenderIdOrderByCreatedAtDesc(Long lenderId);
}
