package com.manoj.quiz.DTO;

import java.time.Instant;
import java.util.List;

public record QuestionResponse(
    Long id,
    String text,
    String optionType,
    List<OptionDto> options,
    Instant servedAt,
    String audioUrl){}
