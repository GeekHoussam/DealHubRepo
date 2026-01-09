package com.dealhub.agreement.lenderregistry;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

public final class LenderNameNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^A-Z0-9& ]+");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");

    private static final Set<String> STOP_TOKENS = Set.of(
            "SA","SAS","SARL","SPA","PLC","LTD","LIMITED","INC","CORP","CO","COMPANY","LLC",
            "AG","GMBH","BV","NV","AB","ASA","AS",
            "BRANCH"
    );

    private LenderNameNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.isEmpty()) return "";

        s = Normalizer.normalize(s, Normalizer.Form.NFKD);
        s = DIACRITICS.matcher(s).replaceAll("");

        s = s.toUpperCase(Locale.ROOT);
        s = s.replace("&", " AND ");

        s = NON_ALNUM.matcher(s).replaceAll(" ");
        s = MULTI_SPACE.matcher(s).replaceAll(" ").trim();

        if (s.isEmpty()) return "";

        List<String> out = new ArrayList<>();
        for (String tok : s.split(" ")) {
            String t = tok.trim();
            if (t.isEmpty()) continue;
            if (t.length() < 2) continue;
            if (STOP_TOKENS.contains(t)) continue;
            out.add(t);
        }
        return String.join(" ", out).trim();
    }
}
