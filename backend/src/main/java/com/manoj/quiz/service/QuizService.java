package com.manoj.quiz.service;

import com.manoj.quiz.dto.QuizResult;
import com.manoj.quiz.model.*;
import com.manoj.quiz.repository.QuestionRepo;
import com.manoj.quiz.repository.QuizAttemptRepo;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.List;

@Service
public class QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    private final QuestionRepo questionRepo;
    private final QuizAttemptRepo quizAttemptRepo;
    private final ScoringService scoringService;

    public QuizService(QuestionRepo questionRepo, QuizAttemptRepo quizAttemptRepo,
                       ScoringService scoringService) {
        this.questionRepo = questionRepo;
        this.quizAttemptRepo = quizAttemptRepo;
        this.scoringService = scoringService;
    }

    public QuizResult evaluateTimedQuiz(Long quizId,
                                        List<AnswerSubmission> answers,
                                        Difficulty diff) {
        System.out.println("Inside evaluateTimedQuiz");
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setStartTime(answers.get(0).servedAt());
        attempt.setDifficulty(diff.name());

        int total = 0;

        for (var ans : answers) {
            Question q = questionRepo.findById(ans.questionId()).orElseThrow();
            long taken = Duration.between(ans.servedAt(), ans.answeredAt()).getSeconds();
            boolean correct = q.getCorrectAnswer().equals(ans.selectedOption());

            int sc = scoringService.calculateForOne(correct, taken, diff.getSeconds());

            total += sc;

            QuestionAttempt qa = new QuestionAttempt();
            qa.setAnsweredAt(ans.answeredAt());
            qa.setQuestionId(ans.questionId());
            qa.setCorrect(correct);
            qa.setScoreEarned(sc);
            qa.setTimeTakenSeconds(taken);
            qa.setSelectedOption(ans.selectedOption());
            qa.setServedAt(ans.servedAt());
            qa.setQuizAttempt(attempt);

            attempt.getQuestionAttempts().add(qa);
        }

        attempt.setTotalScore(total);
        quizAttemptRepo.save(attempt);

        return new QuizResult(total);
    }
}

