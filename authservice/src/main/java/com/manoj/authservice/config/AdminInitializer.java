package com.manoj.authservice.config;

import com.manoj.authservice.model.User;
import com.manoj.authservice.repo.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default admin user so the frontend admin panel can authenticate
 * and manage quizzes without manual database setup.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepo userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public AdminInitializer(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public void run(String... args) {
        if (userRepo.existsByEmail(adminEmail)) {
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .passwordHash(encoder.encode(adminPassword))
                .role("ADMIN")
                .build();

        userRepo.save(admin);
    }
}
