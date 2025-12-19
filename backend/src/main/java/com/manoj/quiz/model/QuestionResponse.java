package com.manoj.quiz.model;

import java.time.Instant;
import java.util.List;

public record QuestionResponse(
        Long id,
        String text,
        List<String> options,
        Instant servedAt,
        String audioUrl,
        String optionType
) {}