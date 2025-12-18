package com.manoj.quiz.controller;

import com.manoj.quiz.DTO.AnswerCheckRequest;
import com.manoj.quiz.DTO.AnswerCheckResponse;
import com.manoj.quiz.DTO.QuizResult;
import com.manoj.quiz.service.QuizService;
import com.manoj.quiz.model.*;
import com.manoj.quiz.repository.QuestionRepo;
import com.manoj.quiz.repository.QuizRepository;
import com.manoj.quiz.service.ScoringService;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "http://localhost:3000")
public class QuizController {

    private final QuizRepository quizRepository;
    private final QuestionRepo questionRepo;
    private final QuizService quizService;
    private final ScoringService scoringService;
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    public QuizController(QuizRepository quizRepository, QuestionRepo questionRepo, QuizService quizService, ScoringService scoringService) {
        this.quizRepository = quizRepository;
        this.questionRepo = questionRepo;
        this.quizService = quizService;
        this.scoringService = scoringService;
    }

    @PostMapping
    public Quiz createQuiz(@RequestBody Quiz quiz) {
        return quizRepository.save(quiz);
    }

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    @PostMapping("/{quizId}/questions")
    public Question addQuestion(@PathVariable Long quizId, @RequestBody Question question) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        question.setQuiz(quiz);
        return questionRepo.save(question);
    }

    @GetMapping("/{quizId}/questions")
    public List<QuestionResponse> getQuestions(@PathVariable Long quizId) {
        List<Question> questions = questionRepo.findByQuizId(quizId);

        Collections.shuffle(questions);

        Instant servedAt = Instant.now();

        return questions.stream().map(q -> {
            List<String> opts = new java.util.ArrayList<>(q.getOptions());
            java.util.Collections.shuffle(opts);

            return new QuestionResponse(q.getId(), q.getText(), opts, servedAt);
        }).toList();
    }

    @PostMapping("/{quizId}/submit")
    public QuizResult submitTimedQuiz(
            @PathVariable Long quizId,
            @RequestBody List<AnswerSubmission> answers,
            @RequestParam String difficulty
    ) {
        return quizService.evaluateTimedQuiz(quizId, answers, Difficulty.valueOf(difficulty.toUpperCase()));
    }

    @PostMapping("/{quizId}/questions/{questionId}/check")
    public AnswerCheckResponse checkAnswer(
            @PathVariable Long quizId,
            @PathVariable Long questionId,
            @RequestParam String difficulty,
            @RequestBody AnswerCheckRequest req
    ) {
        Question q = questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // (Optional) Safety check: ensure question belongs to quizId
        if (q.getQuiz() == null || !q.getQuiz().getId().equals(quizId)) {
            throw new RuntimeException("Question does not belong to this quiz");
        }

        Difficulty diff = Difficulty.valueOf(difficulty.toUpperCase());

        long taken = java.time.Duration.between(req.servedAt(), req.answeredAt()).getSeconds();
        boolean correct = q.getCorrectAnswer().trim().equalsIgnoreCase(req.selectedOption().trim());

        int scoreEarned = scoringService.calculateForOne(correct, taken, diff.getSeconds());

        return new AnswerCheckResponse(correct, q.getCorrectAnswer(), taken, scoreEarned);
    }
}
