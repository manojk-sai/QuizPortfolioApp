package com.manoj.quiz.model;

public enum GuessCategory {
    HERO,
    HEROINE,
    MUSIC_DIRECTOR,
    CINEMA;

    public static GuessCategory random() {
        GuessCategory[] values = values();
        int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(values.length);
        return values[idx];
    }
}
