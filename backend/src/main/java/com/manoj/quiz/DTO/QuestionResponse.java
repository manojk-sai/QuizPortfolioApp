package com.manoj.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Question payload sent to clients")
public record QuestionResponse(
    @Schema(description = "Identifier of the question") Long id,
    @Schema(description = "Question text presented to the user") String text,
    @Schema(description = "Type of options rendered (e.g. TEXT, IMAGE, AUDIO)", example = "TEXT") String optionType,
    @Schema(description = "Shuffled answer options for this question") List<OptionDto> options,
    @Schema(description = "Timestamp when this question was served") Instant servedAt,
    @Schema(description = "Optional audio file URL attached to the question") String audioUrl){}
