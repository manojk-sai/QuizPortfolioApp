package com.manoj.quiz.controller;

import com.manoj.quiz.dto.AnswerCheckRequest;
import com.manoj.quiz.dto.AnswerCheckResponse;
import com.manoj.quiz.dto.QuestionResponse;
import com.manoj.quiz.dto.QuizResult;
import com.manoj.quiz.model.AnswerSubmission;
import com.manoj.quiz.model.Difficulty;
import com.manoj.quiz.service.SongQuizService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/song-quiz")
@CrossOrigin(origins = {"http://localhost:3000", "https://quiz-portfolio-app.vercel.app"})
public class SongQuizController {

    private final SongQuizService songQuizService;

    public SongQuizController(SongQuizService songQuizService) {
        this.songQuizService = songQuizService;
    }

    @GetMapping("/questions")
    public List<QuestionResponse> getQuestions(@RequestParam(defaultValue = "10") int count) {
        return songQuizService.generateQuestions(count);
    }

    @PostMapping("/questions/{questionId}/check")
    public AnswerCheckResponse checkAnswer(
            @PathVariable Long questionId,
            @RequestParam String difficulty,
            @RequestBody AnswerCheckRequest req
    ) {
        Difficulty diff = Difficulty.valueOf(difficulty.toUpperCase());
        Instant answeredAt = req.answeredAt() != null ? req.answeredAt() : Instant.now();
        return songQuizService.checkAnswer(questionId, diff, answeredAt, req.selectedOption());
    }

    @PostMapping("/submit")
    public QuizResult submitQuiz(
            @RequestBody List<AnswerSubmission> answers,
            @RequestParam String difficulty
    ) {
        Difficulty diff = Difficulty.valueOf(difficulty.toUpperCase());
        return songQuizService.submitQuiz(answers, diff);
    }
}
