package com.manoj.quiz.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class QuestionAttempt {

    @Id
    @GeneratedValue
    private Long id;

    private Long questionId;
    private String selectedOption;
    private boolean correct;

    private long timeTakenSeconds;
    private int scoreEarned;

    private Instant servedAt;
    private Instant answeredAt;

    @ManyToOne
    private QuizAttempt quizAttempt;
}