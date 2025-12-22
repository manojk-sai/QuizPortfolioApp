package com.manoj.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of validating a single answer")
public record AnswerCheckResponse(
        @Schema(description = "Whether the submitted answer is correct") boolean correct,
        @Schema(description = "The correct answer label for this question", example = "B") String correctAnswer,
        @Schema(description = "Seconds taken by the participant to answer") long timeTakenSeconds,
        @Schema(description = "Score earned for this question based on difficulty and speed") int scoreEarned
) {}