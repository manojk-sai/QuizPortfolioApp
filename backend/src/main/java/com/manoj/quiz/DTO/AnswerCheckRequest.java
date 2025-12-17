package com.manoj.quiz.DTO;

import java.time.Instant;

public record AnswerCheckRequest(
        String selectedOption,
        Instant servedAt,
        Instant answeredAt
) {}
