package com.dealhub.agreement.agreement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AgreementRepository extends JpaRepository<Agreement, Long> {
    // ✅ Admin/Agent recent: filter in DB
    @Query("""
       select a from Agreement a
       where a.id in (
          select v.agreementId from AgreementVersion v
          where v.createdAt >= :since
       )
    """)
    List<Agreement> findRecent(@Param("since") Instant since);

    // ✅ Lender recent: only agreements linked to lender
    @Query("""
       select a from Agreement a
       where a.id in (
          select p.agreementId from AgreementParticipant p
          where p.lenderId = :lenderId
       )
    """)
    List<Agreement> findByLender(@Param("lenderId") Long lenderId);
}