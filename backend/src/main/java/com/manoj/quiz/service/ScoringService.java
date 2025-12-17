package com.manoj.quiz.service;

import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    public int calculateForOne(boolean correct, long timeTaken, int maxTime) {
        if (!correct) return 0;
        if (timeTaken <= maxTime * 0.3) return 10;
        if (timeTaken <= maxTime * 0.6) return 7;
        return 5;
    }
}