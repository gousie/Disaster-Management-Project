
package com.klu.controller;

import com.klu.entity.User;
import com.klu.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5176",
        "http://localhost:5177",
        "https://disaster-management-project-seven.vercel.app",
        "https://disaster-management-project-lime.vercel.app"
})
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // Get all registered users (ADMIN only)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {

        List<User> users = userRepo.findAll();

        // Hide passwords before returning user details
        users.forEach(user -> user.setPassword(null));

        return ResponseEntity.ok(users);
    }

    // Get user by ID (ADMIN only)
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id) {

        return userRepo.findById(id)
                .map(user -> {
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // Delete user by ID (ADMIN only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {

        if (!userRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepo.deleteById(id);

        return ResponseEntity.ok(
                java.util.Map.of(
                        "success", true,
                        "message", "User deleted successfully"
                )
        );
    }
}
