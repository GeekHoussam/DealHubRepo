package com.dealhub.document.service;

import com.dealhub.document.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.*;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path baseDir;

    public FileStorageService(@Value("${app.storage.base-dir}") String baseDir) {
        if (!StringUtils.hasText(baseDir)) {
            throw new IllegalArgumentException("app.storage.base-dir must be set");
        }
        this.baseDir = Paths.get(baseDir).toAbsolutePath().normalize();
    }

    public StoredFile store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        try {
            Files.createDirectories(baseDir);

            String storedFilename = UUID.randomUUID().toString();
            Path target = baseDir.resolve(storedFilename).normalize();

            if (!target.startsWith(baseDir)) {
                throw new SecurityException("Invalid storage path resolution");
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            try (InputStream raw = file.getInputStream();
                 DigestInputStream in = new DigestInputStream(raw, digest)) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            String sha256 = HexFormat.of().formatHex(digest.digest());

            return new StoredFile(storedFilename, target.toAbsolutePath(), sha256);
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    public Path resolve(String storedFilename) {
        if (!StringUtils.hasText(storedFilename)) {
            throw new IllegalArgumentException("storedFilename must not be blank");
        }
        Path resolved = baseDir.resolve(storedFilename).normalize();

        if (!resolved.startsWith(baseDir)) {
            throw new SecurityException("Invalid storedFilename");
        }

        return resolved;
    }

    public void deleteIfExists(String storedFilename) {
        try {
            Files.deleteIfExists(resolve(storedFilename));
        } catch (Exception ignored) {
        }
    }

    public record StoredFile(String storedFilename, Path absolutePath, String sha256) {}
}
