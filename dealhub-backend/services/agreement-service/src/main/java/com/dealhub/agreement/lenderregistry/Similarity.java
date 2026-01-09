package com.dealhub.agreement.lenderregistry;

import java.util.*;

public final class Similarity {
    private Similarity() {}

    public static double jaccardTokens(String a, String b) {
        Set<String> A = new HashSet<>(Arrays.asList(a.split(" ")));
        Set<String> B = new HashSet<>(Arrays.asList(b.split(" ")));
        A.removeIf(String::isBlank);
        B.removeIf(String::isBlank);

        if (A.isEmpty() && B.isEmpty()) return 1.0;
        if (A.isEmpty() || B.isEmpty()) return 0.0;

        Set<String> inter = new HashSet<>(A);
        inter.retainAll(B);

        Set<String> union = new HashSet<>(A);
        union.addAll(B);

        return (double) inter.size() / (double) union.size();
    }
}
