package com.manoj.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Aggregated score for a completed quiz")
public class QuizResult {

    @Schema(description = "Total score earned for this quiz attempt", example = "1200")
    private int totalScore;

    public QuizResult(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalScore() {
        return totalScore;
    }
}
