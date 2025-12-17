package com.manoj.quiz.model;

public enum Difficulty {
    EASY(20),
    MEDIUM(15),
    HARD(10);

    private final int seconds;

    Difficulty(int seconds) {
        this.seconds = seconds;
    }

    public int getSeconds() {
        return seconds;
    }
}

