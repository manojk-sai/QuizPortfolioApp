package com.manoj.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Selectable option for a question")
public record OptionDto(
        @Schema(description = "Label shown to the user", example = "Paris") String label,
        @Schema(description = "Optional image URL that illustrates the option") String imageUrl
){}
