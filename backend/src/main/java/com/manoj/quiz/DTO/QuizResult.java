package com.manoj.quiz.dto;

public class QuizResult {

    private int totalScore;

    public QuizResult(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalScore() {
        return totalScore;
    }
}
