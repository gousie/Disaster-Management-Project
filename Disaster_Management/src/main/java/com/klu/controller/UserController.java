
package com.klu.controller;

import com.klu.entity.User;
import com.klu.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // Get all registered users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {

        List<User> users = userRepo.findAll();

        users.forEach(user -> user.setPassword(null));

        return ResponseEntity.ok(users);
    }

    // Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id) {

        return userRepo.findById(id)
                .map(user -> {
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete user by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {

        if (!userRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepo.deleteById(id);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "User deleted successfully"
                )
        );
    }
}
