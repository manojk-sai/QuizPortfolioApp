package com.manoj.quiz.model;

public record SongMetadata(
        String songTitle,
        PersonInfo hero,
        PersonInfo heroine,
        PersonInfo musicDirector,
        PersonInfo cinema,
        String audioUrl
) {}
