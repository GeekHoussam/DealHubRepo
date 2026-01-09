package com.dealhub.agreement.lenderdist;

import com.dealhub.agreement.api.dto.LenderInboxMessageDto;
import com.dealhub.agreement.api.dto.LenderInboxMessageRawDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class LenderInboxClient {

    private final RestClient rest;
    private final ObjectMapper mapper;

    // ✅ call lender-mock service DIRECT (no gateway JWT)
    @Value("${app.lendermock.base-url:http://localhost:8090}")
    private String baseUrl;

    @Value("${app.internal.key:dealhub-internal}")
    private String internalKey;

    public LenderInboxClient(RestClient.Builder builder, ObjectMapper mapper) {
        this.rest = builder.build();
        this.mapper = mapper;
    }

    public List<LenderInboxMessageDto> getInboxForLender(Long lenderId) {
        String url = baseUrl + "/lender-payloads/inbox/" + lenderId;

        LenderInboxMessageRawDto[] raw = rest.get()
                .uri(url)
                .header("X-INTERNAL-KEY", internalKey)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(LenderInboxMessageRawDto[].class);

        if (raw == null || raw.length == 0) return List.of();

        List<LenderInboxMessageDto> out = new ArrayList<>();
        for (LenderInboxMessageRawDto r : Arrays.asList(raw)) {
            JsonNode payloadNode;
            try {
                payloadNode = (r.payload() == null) ? null : mapper.readTree(r.payload());
            } catch (Exception e) {
                payloadNode = mapper.createObjectNode().put("rawPayload", String.valueOf(r.payload()));
            }

            out.add(new LenderInboxMessageDto(
                    r.id(), r.dealName(), r.lenderId(), r.recipientEmail(), r.createdAt(), payloadNode
            ));
        }
        return out;
    }
}
