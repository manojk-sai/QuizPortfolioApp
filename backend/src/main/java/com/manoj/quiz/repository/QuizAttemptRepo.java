package com.manoj.quiz.repository;

import com.manoj.quiz.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepo extends JpaRepository<QuizAttempt, Long> {}

