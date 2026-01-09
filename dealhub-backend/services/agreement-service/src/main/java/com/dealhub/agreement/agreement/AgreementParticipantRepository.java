package com.dealhub.agreement.agreement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgreementParticipantRepository extends JpaRepository<AgreementParticipant, Long> {
    List<AgreementParticipant> findByLenderId(Long lenderId);
    boolean existsByAgreementIdAndLenderId(Long agreementId, Long lenderId);
    // ✅ NEW: used by publishVersion() to notify all lenders in that agreement
    @Query("select distinct p.lenderId from AgreementParticipant p where p.agreementId = :agreementId")
    List<Long> findDistinctLenderIdsByAgreementId(@Param("agreementId") Long agreementId);
}
