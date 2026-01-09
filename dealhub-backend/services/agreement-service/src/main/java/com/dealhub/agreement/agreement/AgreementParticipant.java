package com.dealhub.agreement.agreement;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="agreement_participants",
        uniqueConstraints = @UniqueConstraint(columnNames={"agreementId","lenderId"}))
@Getter @Setter @NoArgsConstructor
public class AgreementParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long agreementId;
    private Long lenderId;

    public AgreementParticipant(Long agreementId, Long lenderId) {
        this.agreementId = agreementId;
        this.lenderId = lenderId;
    }
}
