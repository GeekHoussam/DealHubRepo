package com.dealhub.agreement.version;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AgreementVersionRepository extends JpaRepository<AgreementVersion, Long> {

    // You already have this:
    @Query("""
        select v
        from AgreementVersion v
        where v.agreementId in :agreementIds
          and v.createdAt = (
            select max(v2.createdAt)
            from AgreementVersion v2
            where v2.agreementId = v.agreementId
          )
        """)
    List<AgreementVersion> findLatestForAgreements(@Param("agreementIds") List<Long> agreementIds);

    // ✅ NEW: latest DRAFT per agreement
    @Query("""
        select v
        from AgreementVersion v
        where v.agreementId in :agreementIds
          and v.status = com.dealhub.agreement.version.AgreementStatus.DRAFT
          and v.createdAt = (
            select max(v2.createdAt)
            from AgreementVersion v2
            where v2.agreementId = v.agreementId
              and v2.status = com.dealhub.agreement.version.AgreementStatus.DRAFT
          )
        """)
    List<AgreementVersion> findLatestDraftForAgreements(@Param("agreementIds") List<Long> agreementIds);

    // ✅ NEW: latest VALIDATED per agreement
    @Query("""
        select v
        from AgreementVersion v
        where v.agreementId in :agreementIds
          and v.status = com.dealhub.agreement.version.AgreementStatus.VALIDATED
          and v.validatedAt = (
            select max(v2.validatedAt)
            from AgreementVersion v2
            where v2.agreementId = v.agreementId
              and v2.status = com.dealhub.agreement.version.AgreementStatus.VALIDATED
          )
        """)
    List<AgreementVersion> findLatestValidatedForAgreements(@Param("agreementIds") List<Long> agreementIds);
}
