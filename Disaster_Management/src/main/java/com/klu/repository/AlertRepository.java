package com.klu.repository;

import com.klu.entity.Alert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository
        extends JpaRepository<Alert, Long> {

    List<Alert> findByActiveTrueOrderByCreatedAtDesc();
}