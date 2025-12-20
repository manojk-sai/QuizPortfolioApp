package com.manoj.quiz.service;

import com.manoj.quiz.dto.AnswerCheckResponse;
import com.manoj.quiz.dto.OptionDto;
import com.manoj.quiz.dto.QuestionResponse;
import com.manoj.quiz.dto.QuizResult;
import com.manoj.quiz.model.AnswerSubmission;
import com.manoj.quiz.model.Difficulty;
import com.manoj.quiz.model.GuessCategory;
import com.manoj.quiz.model.PersonInfo;
import com.manoj.quiz.model.SongMetadata;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class SongQuizService {

    private final List<SongMetadata> songBank;
    private final AtomicLong questionIdSequence = new AtomicLong(100_000);
    private final Map<Long, SongQuestionContext> activeQuestions = new ConcurrentHashMap<>();
    private final ScoringService scoringService;

    public SongQuizService(ScoringService scoringService) {
        this.scoringService = scoringService;
        this.songBank = bootstrapSongs();
    }

    public List<QuestionResponse> generateQuestions(int count) {
        List<QuestionResponse> responses = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            SongMetadata song = songBank.get(ThreadLocalRandom.current().nextInt(songBank.size()));
            GuessCategory category = GuessCategory.random();
            responses.add(buildQuestion(song, category));
        }
        return responses;
    }

    public AnswerCheckResponse checkAnswer(Long questionId, Difficulty difficulty, Instant answeredAt, String selectedOption) {
        SongQuestionContext ctx = activeQuestions.get(questionId);
        if (ctx == null) {
            throw new IllegalArgumentException("Unknown question: " + questionId);
        }

        long taken = Duration.between(ctx.servedAt(), answeredAt).getSeconds();
        boolean correct = ctx.correctAnswer().equalsIgnoreCase(selectedOption == null ? "" : selectedOption.trim());

        int scoreEarned = scoringService.calculateForOne(correct, taken, difficulty.getSeconds());

        return new AnswerCheckResponse(correct, ctx.correctAnswer(), taken, scoreEarned);
    }

    public QuizResult submitQuiz(List<AnswerSubmission> answers, Difficulty difficulty) {
        int total = 0;

        for (AnswerSubmission ans : answers) {
            SongQuestionContext ctx = activeQuestions.get(ans.questionId());
            if (ctx == null) {
                continue;
            }

            long taken = Duration.between(ctx.servedAt(), ans.answeredAt()).getSeconds();
            boolean correct = ctx.correctAnswer().equalsIgnoreCase(ans.selectedOption() == null ? "" : ans.selectedOption().trim());

            int sc = scoringService.calculateForOne(correct, taken, difficulty.getSeconds());
            total += sc;
        }

        return new QuizResult(total);
    }

    private QuestionResponse buildQuestion(SongMetadata song, GuessCategory category) {
        long id = questionIdSequence.incrementAndGet();
        Instant servedAt = Instant.now();

        PersonInfo correctPerson = switch (category) {
            case HERO -> song.hero();
            case HEROINE -> song.heroine();
            case MUSIC_DIRECTOR -> song.musicDirector();
            case CINEMA -> song.cinema();
        };

        List<OptionDto> options = buildOptions(category, correctPerson);

        String text = switch (category) {
            case HERO -> "Who is the hero in \"" + song.songTitle() + "\"?";
            case HEROINE -> "Who is the heroine in \"" + song.songTitle() + "\"?";
            case MUSIC_DIRECTOR -> "Who is the music director for \"" + song.songTitle() + "\"?";
            case CINEMA -> "Which cinema does \"" + song.songTitle() + "\" belong to?";
        };

        activeQuestions.put(id, new SongQuestionContext(correctPerson.name(), servedAt));

        return new QuestionResponse(
                id,
                text,
                "IMAGE",
                options,
                servedAt,
                song.audioUrl()
        );
    }

    private List<OptionDto> buildOptions(GuessCategory category, PersonInfo correctPerson) {
        List<PersonInfo> pool = switch (category) {
            case HERO -> songBank.stream().map(SongMetadata::hero).toList();
            case HEROINE -> songBank.stream().map(SongMetadata::heroine).toList();
            case MUSIC_DIRECTOR -> songBank.stream().map(SongMetadata::musicDirector).toList();
            case CINEMA -> songBank.stream().map(SongMetadata::cinema).toList();
        };

        // Deduplicate by name to avoid repeated options
        Map<String, PersonInfo> uniqueByName = pool.stream()
                .collect(Collectors.toMap(PersonInfo::name, p -> p, (existing, replacement) -> existing));

        List<PersonInfo> distractors = new ArrayList<>(uniqueByName.values());
        distractors.removeIf(p -> p.name().equalsIgnoreCase(correctPerson.name()));

        Collections.shuffle(distractors);

        List<OptionDto> opts = new ArrayList<>();
        opts.add(new OptionDto(correctPerson.name(), correctPerson.imageUrl()));

        for (int i = 0; i < distractors.size() && opts.size() < 4; i++) {
            PersonInfo candidate = distractors.get(i);
            opts.add(new OptionDto(candidate.name(), candidate.imageUrl()));
        }

        while (opts.size() < 4 && !pool.isEmpty()) {
            PersonInfo fallback = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
            if (opts.stream().noneMatch(o -> o.label().equalsIgnoreCase(fallback.name()))) {
                opts.add(new OptionDto(fallback.name(), fallback.imageUrl()));
            }
        }

        Collections.shuffle(opts);
        return opts;
    }

    private List<SongMetadata> bootstrapSongs() {
        return List.of(
                new SongMetadata(
                        "Naatu Naatu",
                        new PersonInfo("Ram Charan", "https://via.placeholder.com/240?text=Ram+Charan"),
                        new PersonInfo("Alia Bhatt", "https://via.placeholder.com/240?text=Alia+Bhatt"),
                        new PersonInfo("M. M. Keeravani", "https://via.placeholder.com/240?text=Keeravani"),
                        new PersonInfo("RRR", "https://via.placeholder.com/240?text=RRR"),
                        "https://example.com/audio/naatu-naatu.mp3"
                ),
                new SongMetadata(
                        "Why This Kolaveri Di",
                        new PersonInfo("Dhanush", "https://via.placeholder.com/240?text=Dhanush"),
                        new PersonInfo("Shruti Haasan", "https://via.placeholder.com/240?text=Shruti+Haasan"),
                        new PersonInfo("Anirudh Ravichander", "https://via.placeholder.com/240?text=Anirudh"),
                        new PersonInfo("3", "https://via.placeholder.com/240?text=3+Movie"),
                        "https://example.com/audio/kolaveri.mp3"
                ),
                new SongMetadata(
                        "Rowdy Baby",
                        new PersonInfo("Dhanush", "https://via.placeholder.com/240?text=Dhanush"),
                        new PersonInfo("Sai Pallavi", "https://via.placeholder.com/240?text=Sai+Pallavi"),
                        new PersonInfo("Yuvan Shankar Raja", "https://via.placeholder.com/240?text=Yuvan"),
                        new PersonInfo("Maari 2", "https://via.placeholder.com/240?text=Maari+2"),
                        "https://example.com/audio/rowdy-baby.mp3"
                ),
                new SongMetadata(
                        "Jai Ho",
                        new PersonInfo("Dev Patel", "https://via.placeholder.com/240?text=Dev+Patel"),
                        new PersonInfo("Freida Pinto", "https://via.placeholder.com/240?text=Freida+Pinto"),
                        new PersonInfo("A. R. Rahman", "https://via.placeholder.com/240?text=AR+Rahman"),
                        new PersonInfo("Slumdog Millionaire", "https://via.placeholder.com/240?text=Slumdog+Millionaire"),
                        "https://example.com/audio/jai-ho.mp3"
                ),
                new SongMetadata(
                        "Munbe Vaa",
                        new PersonInfo("Surya", "https://via.placeholder.com/240?text=Surya"),
                        new PersonInfo("Jyothika", "https://via.placeholder.com/240?text=Jyothika"),
                        new PersonInfo("A. R. Rahman", "https://via.placeholder.com/240?text=AR+Rahman"),
                        new PersonInfo("Sillunu Oru Kaadhal", "https://via.placeholder.com/240?text=Sillunu+Oru+Kaadhal"),
                        "https://example.com/audio/munbe-vaa.mp3"
                )
        );
    }

    private record SongQuestionContext(String correctAnswer, Instant servedAt) {}
}
