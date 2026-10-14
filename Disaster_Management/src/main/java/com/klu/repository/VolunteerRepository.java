package com.klu.repository;

import com.klu.entity.Volunteer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VolunteerRepository
        extends JpaRepository<Volunteer, Long> {
}