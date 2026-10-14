package com.klu.controller;

import com.klu.entity.DisasterMedia;
import com.klu.repository.DisasterMediaRepository;

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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class MediaController {

    private final DisasterMediaRepository repo;

    private final Path uploadPath = Paths.get("uploads");

    public MediaController(DisasterMediaRepository repo) throws IOException {
        this.repo = repo;
        Files.createDirectories(uploadPath);
    }

    @GetMapping("/disaster/{id}")
    public List<DisasterMedia> getMedia(@PathVariable Long id) {
        return repo.findByDisasterId(id);
    }

    /**
     * Standalone image upload — returns a permanent URL.
     * Use this for disaster cover images so they persist (no data-URL).
     */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadStandalone(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
        }

        String original = file.getOriginalFilename();
        if (original == null) original = "image.jpg";
        // sanitize extension
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot).toLowerCase();
        if (ext.isEmpty() || ext.length() > 6) ext = ".jpg";

        String name = UUID.randomUUID() + ext;
        Path target = uploadPath.resolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/uploads/" + name;

        Map<String, Object> body = new HashMap<>();
        body.put("fileUrl", fileUrl);
        body.put("url", "http://localhost:8081" + fileUrl);
        body.put("fileName", original);
        body.put("fileType", contentType);
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/disaster/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String original = file.getOriginalFilename();
        String name = UUID.randomUUID() + "_" + (original != null ? original : "file");
        Path target = uploadPath.resolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        DisasterMedia media = new DisasterMedia();
        media.setDisasterId(id);
        media.setFileName(original);
        media.setFileUrl("/uploads/" + name);
        media.setFileType(file.getContentType());

        return ResponseEntity.ok(repo.save(media));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
