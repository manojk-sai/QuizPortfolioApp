package com.manoj.quiz.model;

import java.time.Instant;

public record AnswerSubmission(
        Long questionId,
        String selectedOption,
        Instant servedAt,
        Instant answeredAt
) {}
