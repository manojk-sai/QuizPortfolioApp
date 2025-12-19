package com.manoj.quiz.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.manoj.quiz.model.QuestionOption;

public interface QuestionOptionRepo extends JpaRepository<QuestionOption, Long> {
}
