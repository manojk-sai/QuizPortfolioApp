package com.manoj.quiz.dto;

public record AnswerCheckResponse(
        boolean correct,
        String correctAnswer,
        long timeTakenSeconds,
        int scoreEarned
) {}