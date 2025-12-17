package com.manoj.quiz.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
public class QuizAttempt {

    @Id
    private Long id;

    private Long quizId;
    private String userId;
    private String difficulty;

    private Instant startTime;
    private Instant endTime;

    private int totalScore;

    @OneToMany(mappedBy = "quizAttempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionAttempt> questionAttempts = new ArrayList<>();

    @PrePersist
    private void ensureId() {
        if (id == null) {
            id = Math.abs(UUID.randomUUID().getMostSignificantBits());
        }
    }
}