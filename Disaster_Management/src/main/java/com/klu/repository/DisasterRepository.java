package com.klu.repository;

import com.klu.entity.Disaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisasterRepository
        extends JpaRepository<Disaster, Long> {

    List<Disaster> findByStatus(String status);
}