package com.manoj.quiz.repository;


import com.manoj.quiz.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepo extends JpaRepository<Question, Long> {
    List<Question> findByQuizId(Long quizId);

    @Query("select q from Question q left join fetch q.options where q.id = :id")
    Question findByIdWithOptions(@Param("id") Long id);
}
