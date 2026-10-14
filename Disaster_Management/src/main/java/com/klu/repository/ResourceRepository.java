package com.klu.repository;

import com.klu.entity.Resource;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository
        extends JpaRepository<Resource, Long> {
}