package com.manoj.quiz.DTO;

public class QuizResult {

    private int totalScore;

    public QuizResult(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalScore() {
        return totalScore;
    }
}
