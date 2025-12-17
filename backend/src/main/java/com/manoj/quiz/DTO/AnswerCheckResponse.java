package com.manoj.quiz.DTO;

public record AnswerCheckResponse(
        boolean correct,
        String correctAnswer,
        long timeTakenSeconds,
        int scoreEarned
) {}