package com.manoj.quiz.repository;

import com.manoj.quiz.model.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionAttemptRepo extends JpaRepository<QuestionAttempt, Long> {}
