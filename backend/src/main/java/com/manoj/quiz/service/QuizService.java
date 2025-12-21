package com.manoj.quiz.service;

import com.manoj.quiz.dto.QuizResult;
import com.manoj.quiz.model.*;
import com.manoj.quiz.repository.QuestionRepo;
import com.manoj.quiz.repository.QuizAttemptRepo;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class QuizService {

    private final QuestionRepo questionRepo;
    private final QuizAttemptRepo quizAttemptRepo;
    private final ScoringService scoringService;

    public QuizService(QuestionRepo questionRepo, QuizAttemptRepo quizAttemptRepo,
                       ScoringService scoringService) {
        this.questionRepo = questionRepo;
        this.quizAttemptRepo = quizAttemptRepo;
        this.scoringService = scoringService;
    }

    private boolean isCorrectAnswer(Question q, String selectedOptionLabel) {
        String selected = selectedOptionLabel == null ? "" : selectedOptionLabel;
        String correct = q.getCorrectAnswer();
        if (correct == null) correct = "";

        // Direct match (TEXT quiz or IMAGE quiz already stored as label)
        if (correct.equalsIgnoreCase(selected)) return true;

        // If this is IMAGE question and DB stored imageUrl as correctAnswer, map label → imageUrl and compare
        if (q.getOptionType() != null && "IMAGE".equalsIgnoreCase(q.getOptionType())) {
            String selectedImageUrl = q.getOptions().stream()
                    .filter(o -> o.getLabel() != null && o.getLabel().equalsIgnoreCase(selectedOptionLabel))
                    .map(QuestionOption::getImageUrl)
                    .findFirst()
                    .orElse(null);

            if (selectedImageUrl != null && correct.equalsIgnoreCase(selectedImageUrl)) return true;
        }

        return false;
    }

    private String getCorrectAnswerLabel(Question q) {
        String correct = q.getCorrectAnswer();
        if (correct == null) return "";

        // If correct is already a label
        boolean matchesLabel = q.getOptions().stream()
                .anyMatch(o -> o.getLabel() != null && o.getLabel().equalsIgnoreCase(correct));
        if (matchesLabel) return correct;

        // If correct is an imageUrl, convert it to label
        String label = q.getOptions().stream()
                .filter(o -> o.getImageUrl() != null && o.getImageUrl().equalsIgnoreCase(correct))
                .map(QuestionOption::getLabel)
                .findFirst()
                .orElse(correct);

        return label;
    }

    public QuizResult evaluateTimedQuiz(Long quizId,
                                        List<AnswerSubmission> answers,
                                        Difficulty diff) {

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setStartTime(answers.get(0).servedAt());
        attempt.setDifficulty(diff.name());

        int total = 0;

        for (var ans : answers) {
            Question q = questionRepo.findById(ans.questionId()).orElseThrow();

            long taken = Duration.between(ans.servedAt(), ans.answeredAt()).getSeconds();

            boolean correct = isCorrectAnswer(q, ans.selectedOption());

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

    public AnswerCheckResult checkOneQuestion(Long quizId, Long questionId, String selectedOptionLabel, String difficulty,
                                              Instant servedAt, Instant answeredAt) {

        Question q = questionRepo.findById(questionId).orElseThrow();

        boolean correct = isCorrectAnswer(q, selectedOptionLabel);

        // Always send correct as LABEL
        String correctLabel = getCorrectAnswerLabel(q);

        return new AnswerCheckResult(correct, correctLabel);
    }

    // Simple internal return type
    public record AnswerCheckResult(boolean correct, String correctAnswerLabel) {}
}
