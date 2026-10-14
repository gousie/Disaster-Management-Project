package com.klu.controller;

import com.klu.entity.Volunteer;
import com.klu.repository.VolunteerRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
@CrossOrigin(origins = "http://localhost:5173")
public class VolunteerController {

    private final VolunteerRepository repo;

    public VolunteerController(
            VolunteerRepository repo) {

        this.repo = repo;
    }

    @GetMapping
    public List<Volunteer> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Volunteer create(
            @RequestBody Volunteer volunteer) {

        return repo.save(volunteer);
    }

    @PutMapping("/{id}")
    public Volunteer update(
            @PathVariable Long id,
            @RequestBody Volunteer data) {

        Volunteer v =
                repo.findById(id).orElseThrow();

        v.setName(data.getName());
        v.setMobile(data.getMobile());
        v.setEmail(data.getEmail());
        v.setSkill(data.getSkill());
        v.setLocation(data.getLocation());
        v.setAvailability(data.getAvailability());
        v.setStatus(data.getStatus());

        return repo.save(v);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id) {

        repo.deleteById(id);
    }
}