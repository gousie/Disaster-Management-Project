
package com.klu.controller;

import com.klu.entity.User;
import com.klu.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
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
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepo.findAll();

            // Never expose user passwords
            users.forEach(user -> user.setPassword(null));

            return ResponseEntity.ok(users);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", "Unable to fetch users"
                    )
            );
        }
    }

    // Get user by ID (ADMIN only)
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id) {
        try {
            return userRepo.findById(id)
                    .map(user -> {
                        user.setPassword(null);
                        return ResponseEntity.ok(user);
                    })
                    .orElseGet(() ->
                            ResponseEntity.notFound().build()
                    );

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", "Unable to fetch user"
                    )
            );
        }
    }

    // Delete user by ID (ADMIN only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {
        try {
            if (!userRepo.existsById(id)) {
                return ResponseEntity.status(404).body(
                        Map.of(
                                "success", false,
                                "message", "User not found"
                        )
                );
            }

            userRepo.deleteById(id);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "User deleted successfully"
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", "Unable to delete user"
                    )
            );
        }
    }
}
