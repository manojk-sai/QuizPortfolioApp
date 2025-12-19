package com.manoj.quiz.dto;

import java.time.Instant;

public record AnswerCheckRequest(
        String selectedOption,
        Instant servedAt,
        Instant answeredAt
) {}
