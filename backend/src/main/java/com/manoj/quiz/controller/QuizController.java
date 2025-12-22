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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = {"http://localhost:3000", "https://quiz-portfolio-app.vercel.app"})
@Tag(name = "Quizzes", description = "Operations for managing quizzes, questions, and scoring")
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
    @Operation(
            summary = "Create a quiz",
            description = "Creates a new quiz. Use this endpoint from trusted back-office tools.",
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz created", content = @Content(schema = @Schema(implementation = Quiz.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public Quiz createQuiz(@RequestBody Quiz quiz) {
        return quizRepository.save(quiz);
    }

    @GetMapping
    @Operation(
            summary = "List quizzes",
            description = "Retrieves all available quizzes along with their metadata."
    )
    @ApiResponse(responseCode = "200", description = "List of quizzes", content = @Content(array = @ArraySchema(schema = @Schema(implementation = Quiz.class))))
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    @PostMapping("/{quizId}/questions")
    @Operation(
            summary = "Add question to a quiz",
            description = "Adds a question (and its options) to the specified quiz.",
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Question created", content = @Content(schema = @Schema(implementation = Question.class))),
            @ApiResponse(responseCode = "404", description = "Quiz not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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
    @Operation(
            summary = "Get quiz questions",
            description = "Returns the questions for the quiz in a randomized order along with their options and metadata."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of questions", content = @Content(array = @ArraySchema(schema = @Schema(implementation = QuestionResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
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
    @Operation(
            summary = "Submit quiz answers for scoring",
            description = "Evaluates a full quiz attempt for the given difficulty and returns the aggregated score.",
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz scored", content = @Content(schema = @Schema(implementation = QuizResult.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public QuizResult submitTimedQuiz(
            @Parameter(description = "Quiz identifier") @PathVariable Long quizId,
            @RequestBody List<AnswerSubmission> answers,
            @Parameter(description = "Difficulty level to apply", example = "EASY") @RequestParam String difficulty
    ) {
        return quizService.evaluateTimedQuiz(quizId, answers, Difficulty.valueOf(difficulty.toUpperCase()));
    }

    @PostMapping("/{quizId}/questions/{questionId}/check")
    @Operation(
            summary = "Check a single question answer",
            description = "Validates an answer for a single question and returns correctness, correct answer, time taken, and score earned.",
            security = {@SecurityRequirement(name = "bearerAuth")}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Answer evaluated", content = @Content(schema = @Schema(implementation = AnswerCheckResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Question not found")
    })
    public AnswerCheckResponse checkAnswer(
            @Parameter(description = "Quiz identifier") @PathVariable Long quizId,
            @Parameter(description = "Question identifier") @PathVariable Long questionId,
            @Parameter(description = "Difficulty level to apply", example = "MEDIUM") @RequestParam String difficulty,
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