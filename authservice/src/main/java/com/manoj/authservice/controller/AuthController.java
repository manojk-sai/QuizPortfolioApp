package com.manoj.authservice.controller;

import com.manoj.authservice.dto.AuthDtos.*;
import com.manoj.authservice.model.User;
import com.manoj.authservice.repo.UserRepo;
import com.manoj.authservice.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "https://*.vercel.app"})
public class AuthController {

    private final UserRepo userRepo;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepo userRepo, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new RuntimeException("Email already registered");
        }

        User u = User.builder()
                .email(req.email())
                .passwordHash(encoder.encode(req.password()))
                .role("USER")
                .build();
        u = userRepo.save(u);

        String token = jwtUtil.generateToken(u.getId(), u.getEmail(), u.getRole());
        return new AuthResponse(token, "Bearer");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User u = userRepo.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(u.getId(), u.getEmail(), u.getRole());
        return new AuthResponse(token, "Bearer");
    }
}
