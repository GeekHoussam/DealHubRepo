package com.dealhub.agreement.lenderregistry;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class LenderResolverService {

    public enum MatchType { CANONICAL_EXACT, ALIAS_EXACT, FUZZY, UNRESOLVED }

    public record Resolution(
            MatchType matchType,
            Long lenderId,
            String recipientEmail,
            String rawName,
            String normalizedName,
            String matchedName,
            Double score,
            String reason
    ) {}

    // ✅ Hackathon-safe deterministic registry (replace later with DB tables)
    // Key = normalized name, value = lenderId + email
    private final Map<String, Entry> registry = new HashMap<>();

    private record Entry(Long lenderId, String email, String displayName) {}

    public LenderResolverService() {
        // TODO: replace with DB later
        register(7L, "BNP.Paribas@dealhub.com", "BNP Paribas",
                "BNP Paribas SA",
                "BNP PARIBAS",
                "BNP Paribas, London Branch");

        register(8L, "Danske.Bank@dealhub.com", "Danske Bank A/S",
                "DANSKE BANK",
                "Danske Bank",
                "Danske Bank AS");

        // add SEB etc...
    }

    private void register(Long lenderId, String email, String canonical, String... aliases) {
        String canonNorm = LenderNameNormalizer.normalize(canonical);
        registry.put(canonNorm, new Entry(lenderId, email, canonical));
        for (String a : aliases) {
            registry.put(LenderNameNormalizer.normalize(a), new Entry(lenderId, email, canonical));
        }
    }

    public Resolution resolve(String extractedLenderName) {
        String raw = extractedLenderName == null ? "" : extractedLenderName.trim();
        String norm = LenderNameNormalizer.normalize(raw);

        if (norm.isEmpty()) {
            return new Resolution(MatchType.UNRESOLVED, null, null, raw, norm, null, null, "Empty lender name");
        }

        Entry exact = registry.get(norm);
        if (exact != null) {
            return new Resolution(MatchType.ALIAS_EXACT, exact.lenderId, exact.email, raw, norm,
                    exact.displayName, 1.0, "Exact normalized match (registry)");
        }

        // Optional fuzzy on the registry keys (controlled)
        double best = 0.0;
        double second = 0.0;
        Entry bestEntry = null;
        String bestKey = null;

        for (var e : registry.entrySet()) {
            double s = Similarity.jaccardTokens(norm, e.getKey());
            if (s > best) {
                second = best;
                best = s;
                bestEntry = e.getValue();
                bestKey = e.getKey();
            } else if (s > second) {
                second = s;
            }
        }

        double threshold = 0.92;
        double margin = 0.04;

        if (bestEntry != null && best >= threshold && (best - second) >= margin) {
            return new Resolution(MatchType.FUZZY, bestEntry.lenderId, bestEntry.email, raw, norm,
                    bestEntry.displayName, best, "Fuzzy Jaccard match (high confidence + unambiguous)");
        }

        return new Resolution(MatchType.UNRESOLVED, null, null, raw, norm, null, best,
                "No deterministic match; fuzzy below threshold or ambiguous");
    }
}
