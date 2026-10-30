package com.klu.controller;

import com.klu.entity.DisasterMedia;
import com.klu.repository.DisasterMediaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
})
public class MediaController {

    private final DisasterMediaRepository repo;
    private final Path uploadPath = Paths.get("uploads");

    /**
     * Base URL other devices use to open files.
     * Set in application.properties, e.g.:
     *   app.base-url=http://192.168.1.10:8081
     *   app.base-url=https://your-domain.com
     * Do NOT use only localhost if phones/other PCs must load media.
     */
    @Value("${app.base-url:http://localhost:8081}")
    private String baseUrl;

    public MediaController(DisasterMediaRepository repo) throws IOException {
        this.repo = repo;
        Files.createDirectories(uploadPath);
    }

    private String absoluteUrl(String relativePath) {
        String base = baseUrl == null ? "" : baseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (!relativePath.startsWith("/")) {
            relativePath = "/" + relativePath;
        }
        return base + relativePath;
    }

    @GetMapping("/disaster/{id}")
    public List<DisasterMedia> getMedia(@PathVariable Long id) {
        return repo.findByDisasterId(id);
    }

    /**
     * Standalone upload for disaster cover images AND videos.
     * Returns a permanent URL reachable from other devices when app.base-url is set correctly.
     */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadStandalone(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        boolean isImage = contentType.startsWith("image/");
        boolean isVideo = contentType.startsWith("video/");
        if (!isImage && !isVideo) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Only image or video files are allowed"
            ));
        }

        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            original = isVideo ? "video.mp4" : "image.jpg";
        }

        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            ext = original.substring(dot).toLowerCase();
        }
        if (ext.isEmpty() || ext.length() > 8) {
            ext = isVideo ? ".mp4" : ".jpg";
        }

        String name = UUID.randomUUID() + ext;
        Path target = uploadPath.resolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/uploads/" + name;
        String absolute = absoluteUrl(fileUrl);

        Map<String, Object> body = new HashMap<>();
        body.put("fileUrl", fileUrl);
        body.put("url", absolute);
        body.put("fileName", original);
        body.put("fileType", contentType);
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/disaster/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        String original = file.getOriginalFilename();
        String name = UUID.randomUUID() + "_" + (original != null ? original : "file");
        Path target = uploadPath.resolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String relative = "/uploads/" + name;

        DisasterMedia media = new DisasterMedia();
        media.setDisasterId(id);
        media.setFileName(original);
        // Store absolute URL so other devices can load the file
        media.setFileUrl(absoluteUrl(relative));
        media.setFileType(contentType);

        return ResponseEntity.ok(repo.save(media));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
