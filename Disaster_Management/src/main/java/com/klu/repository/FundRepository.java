package com.klu.repository;

import com.klu.entity.Fund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FundRepository extends JpaRepository<Fund, Long> {

    Optional<Fund> findByRazorpayOrderId(String orderId);

    List<Fund> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Fund> findByDonorEmailOrderByCreatedAtDesc(String email);

    List<Fund> findAllByOrderByCreatedAtDesc();
}
