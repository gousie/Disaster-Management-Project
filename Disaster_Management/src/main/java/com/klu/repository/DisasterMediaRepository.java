package com.klu.repository;

import com.klu.entity.DisasterMedia;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisasterMediaRepository
        extends JpaRepository<DisasterMedia, Long> {

    List<DisasterMedia> findByDisasterId(Long disasterId);
}