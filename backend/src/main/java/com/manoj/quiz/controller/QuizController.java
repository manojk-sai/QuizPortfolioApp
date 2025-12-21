package com.manoj.quiz.controller;

import com.manoj.quiz.dto.AnswerCheckRequest;
import com.manoj.quiz.dto.AnswerCheckResponse;
import com.manoj.quiz.dto.OptionDto;
import com.manoj.quiz.dto.QuestionResponse;
import com.manoj.quiz.dto.QuizResult;
import com.manoj.quiz.model.AnswerSubmission;
import com.manoj.quiz.model.Difficulty;
import com.manoj.quiz.model.Question;
import com.manoj.quiz.model.QuestionOption;
import com.manoj.quiz.model.Quiz;
import com.manoj.quiz.repository.QuestionRepo;
import com.manoj.quiz.repository.QuizRepository;
import com.manoj.quiz.service.QuizService;
import com.manoj.quiz.service.ScoringService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = {"http://localhost:3000", "https://quiz-portfolio-app.vercel.app"})
public class QuizController {

    private final QuizRepository quizRepository;
    private final QuestionRepo questionRepo;
    private final QuizService quizService;
    private final ScoringService scoringService;

    public QuizController(
            QuizRepository quizRepository,
            QuestionRepo questionRepo,
            QuizService quizService,
            ScoringService scoringService
    ) {
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

        // attach quiz
        question.setQuiz(quiz);

        // IMPORTANT: set the owning-side relationship so question_id is NOT null in QuestionOption
        if (question.getOptions() != null) {
            for (QuestionOption opt : question.getOptions()) {
                opt.setQuestion(question);
            }
        }

        if (question.getOptionType() == null || question.getOptionType().isEmpty()) {
            question.setOptionType("TEXT");
        }

        return questionRepo.save(question);

    }

    @GetMapping("/{quizId}/questions")
    public List<QuestionResponse> getQuestions(@PathVariable Long quizId) {
        List<Question> questions = questionRepo.findByQuizId(quizId);

        Collections.shuffle(questions);
        Instant servedAt = Instant.now();

        return questions.stream().map(q -> {

            List<OptionDto> opts = new ArrayList<>();
            if (q.getOptions() != null) {
                for (QuestionOption opt : q.getOptions()) {
                    opts.add(new OptionDto(opt.getLabel(), opt.getImageUrl()));
                }
            }

            Collections.shuffle(opts);

            // DTO order: (id, text, optionType, options, servedAt, audioUrl)
            return new QuestionResponse(
                    q.getId(),
                    q.getText(),
                    q.getOptionType(),
                    opts,
                    servedAt,
                    q.getAudioUrl()
            );
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

        // Safety check: ensure question belongs to quizId
        if (q.getQuiz() == null || !q.getQuiz().getId().equals(quizId)) {
            throw new RuntimeException("Question does not belong to this quiz");
        }
        var result = quizService.checkOneQuestion(
                quizId,
                questionId,
                req.selectedOption(),
                difficulty,
                req.servedAt(),
                req.answeredAt()
        );
        Difficulty diff = Difficulty.valueOf(difficulty.toUpperCase());

        long taken = java.time.Duration.between(req.servedAt(), req.answeredAt()).getSeconds();
        boolean correct = q.getCorrectAnswer().trim().equalsIgnoreCase(req.selectedOption().trim());

        int scoreEarned = scoringService.calculateForOne(correct, taken, diff.getSeconds());

        return new AnswerCheckResponse(result.correct(), result.correctAnswerLabel(), taken, scoreEarned);
    }
}