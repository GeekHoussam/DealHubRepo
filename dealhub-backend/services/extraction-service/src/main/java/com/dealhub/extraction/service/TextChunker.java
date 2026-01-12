package com.dealhub.extraction.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    public List<String> chunk(String text, int maxChars) {
        if (text == null) return List.of();
        String t = text.trim();
        if (t.isEmpty()) return List.of();

        List<String> out = new ArrayList<>();
        int i = 0;

        while (i < t.length()) {
            int end = Math.min(i + maxChars, t.length());

            int lastBreak = t.lastIndexOf("\n\n", end);
            if (lastBreak > i + 2000) {
                end = lastBreak;
            }

            out.add(t.substring(i, end).trim());
            i = end;
        }

        return out;
    }
}
