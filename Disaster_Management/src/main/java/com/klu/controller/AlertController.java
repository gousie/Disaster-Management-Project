package com.klu.controller;

import com.klu.entity.Alert;
import com.klu.repository.AlertRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class AlertController {

    private final AlertRepository repo;

    public AlertController(AlertRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Alert> getAll() {
        return repo.findAll();
    }

    @GetMapping("/active")
    public List<Alert> getActive() {
        return repo
                .findByActiveTrueOrderByCreatedAtDesc();
    }

    @PostMapping
    public Alert create(
            @RequestBody Alert alert) {

        alert.setActive(true);

        return repo.save(alert);
    }

    @PutMapping("/{id}")
    public Alert update(
            @PathVariable Long id,
            @RequestBody Alert data) {

        Alert a = repo.findById(id).orElseThrow();

        a.setTitle(data.getTitle());
        a.setMessage(data.getMessage());
        a.setSeverity(data.getSeverity());
        a.setLocation(data.getLocation());
        a.setActive(data.isActive());

        return repo.save(a);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id) {

        repo.deleteById(id);
    }
}