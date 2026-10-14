package com.klu.controller;

import com.klu.entity.Disaster;
import com.klu.repository.DisasterRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disasters")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DisasterController {

    private final DisasterRepository repo;

    public DisasterController(DisasterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Disaster> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Disaster> getByStatus(@PathVariable String status) {
        return repo.findByStatus(status);
    }

    @PostMapping
    public Disaster create(@RequestBody Disaster disaster) {
        return repo.save(disaster);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Disaster data) {

        Disaster d = repo.findById(id).orElse(null);

        if (d == null) {
            return ResponseEntity.notFound().build();
        }

        d.setTitle(data.getTitle());
        d.setType(data.getType());
        d.setDescription(data.getDescription());
        d.setSeverity(data.getSeverity());
        d.setLocation(data.getLocation());
        d.setLatitude(data.getLatitude());
        d.setLongitude(data.getLongitude());
        d.setStatus(data.getStatus());
        // Persist image so User & Admin always match
        if (data.getImageUrl() != null) {
            d.setImageUrl(data.getImageUrl());
        }

        return ResponseEntity.ok(repo.save(d));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);

        return ResponseEntity.ok("Disaster deleted successfully");
    }
}
