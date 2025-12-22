package com.manoj.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Payload for validating a single question answer")
public record AnswerCheckRequest(
        @Schema(description = "Option label chosen by the participant", example = "A") String selectedOption,
        @Schema(description = "Timestamp when the question was shown to the user", example = "2024-01-01T12:00:00Z") Instant servedAt,
        @Schema(description = "Timestamp when the user submitted an answer", example = "2024-01-01T12:00:05Z") Instant answeredAt
) {}
