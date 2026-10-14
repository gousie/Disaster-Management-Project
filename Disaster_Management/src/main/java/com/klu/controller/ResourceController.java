package com.klu.controller;

import com.klu.entity.Resource;
import com.klu.repository.ResourceRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceController {

    private final ResourceRepository repo;

    public ResourceController(
            ResourceRepository repo) {

        this.repo = repo;
    }

    @GetMapping
    public List<Resource> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Resource create(
            @RequestBody Resource resource) {

        return repo.save(resource);
    }

    @PutMapping("/{id}")
    public Resource update(
            @PathVariable Long id,
            @RequestBody Resource data) {

        Resource r =
                repo.findById(id).orElseThrow();

        r.setName(data.getName());
        r.setCategory(data.getCategory());
        r.setQuantity(data.getQuantity());
        r.setLocation(data.getLocation());
        r.setStatus(data.getStatus());

        return repo.save(r);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id) {

        repo.deleteById(id);
    }
}