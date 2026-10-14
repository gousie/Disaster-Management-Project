package com.klu.controller;

import com.klu.config.JwtUtil;
import com.klu.entity.User;
import com.klu.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(
            UserRepository userRepo,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {

        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {

        if (userRepo.existsByEmail(user.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Email already registered"));
        }

        if (userRepo.existsByMobile(user.getMobile())) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Mobile number already registered"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Public signup creates USER accounts only (ADMIN must be seeded)
        String requestedRole = user.getRole();
        if (requestedRole != null && requestedRole.equalsIgnoreCase("ADMIN")) {
            // Allow admin signup only if no admin exists yet (bootstrap)
            long adminCount = userRepo.findAll().stream()
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                    .count();
            if (adminCount == 0) {
                user.setRole("ADMIN");
            } else {
                user.setRole("USER");
            }
        } else {
            user.setRole("USER");
        }

        User savedUser = userRepo.save(user);
        savedUser.setPassword(null);

        String token = jwtUtil.generateToken(
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getId(),
                savedUser.getName()
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", savedUser);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {

        User user = userRepo
                .findByEmail(loginUser.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "Invalid email or password"));
        }

        if (!passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "Invalid email or password"));
        }

        user.setPassword(null);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getId(),
                user.getName()
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", user);
        return ResponseEntity.ok(resp);
    }

    /** Validate token / get current user */
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
        }
        String email = jwtUtil.extractEmail(token);
        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
