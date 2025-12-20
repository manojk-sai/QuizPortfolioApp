import PropTypes from "prop-types";
import { useEffect, useState, useCallback, useRef } from "react";
import { getQuestions, submitTimedQuiz, checkAnswer } from "../services/QuizApi";
import ScorePage from "./ScorePage";
import Confetti from "react-confetti";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";

const TIME_MAP = { easy: 20, medium: 15, hard: 10 };

export default function QuizPage({ quizId, difficulty }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Used for final submit
  const [answers, setAnswers] = useState([]);

  const [timeLeft, setTimeLeft] = useState(TIME_MAP[difficulty]);
  const [score, setScore] = useState(null);

  // UI state
  const [selectedOption, setSelectedOption] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctOption, setCorrectOption] = useState("");

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Prevent auto-advance firing multiple times for same question
  const autoAdvancedIndexRef = useRef(-1);

  // Track which questions have already had servedAt set
  const servedQuestionsRef = useRef(new Set());

  // Confetti sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load questions
  useEffect(() => {
    getQuestions(quizId).then((data) => {
      setQuestions(data);
    });
  }, [quizId]);

  const selectAnswer = (option) => {
    if (showFeedback) return;
    setSelectedOption(option);
  };

  // Reset timer on question change (and only while quiz in progress)
  useEffect(() => {
    if (score !== null || !questions.length) return;

    setTimeLeft(TIME_MAP[difficulty]);
    // Allow auto-advance again for the new question
    autoAdvancedIndexRef.current = -1;
  }, [currentIndex, questions.length, difficulty, score]);

  // Set servedAt when question is first displayed
  useEffect(() => {
    if (!questions.length || score !== null) return;

    const question = questions[currentIndex];
    if (question && !servedQuestionsRef.current.has(currentIndex)) {
      const now = new Date().toISOString();
      servedQuestionsRef.current.add(currentIndex);
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = {
        ...question,
        servedAt: now,
      };
      setQuestions(updatedQuestions);
    }
  }, [currentIndex, questions, score]);

  // Countdown (pause while feedback is showing)
  useEffect(() => {
    if (score !== null || !questions.length || timeLeft === null || showFeedback) return;

    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, questions.length, showFeedback]);

  const question = questions[currentIndex];
  const options = (question?.options || []);

  const nextQuestion = useCallback(async () => {
  if (!question || score !== null || showFeedback) return;

  const answeredAt = new Date().toISOString();

  const payload = {
    selectedOption: selectedOption || "", // empty means skipped
    servedAt: question.servedAt,
    answeredAt,
  };

  // Call backend to validate correctness + return correct answer
  const resp = await checkAnswer(quizId, question.id, payload, difficulty);

  setCorrectOption(resp.correctAnswer);
  setShowFeedback(true);

  const newAnswer = {
    questionId: question.id,
    selectedOption: selectedOption || "",
    servedAt: question.servedAt,
    answeredAt,
  };

  setAnswers((prev) => [...prev, newAnswer]);

  // Show highlight for 1 second, then move on
  setTimeout(async () => {
    setShowFeedback(false);
    setSelectedOption("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      // Extra safety: reset immediately so we never sit on 0
      setTimeLeft(TIME_MAP[difficulty]);
    } else {
      // Submit the whole attempt for total score
      const result = await submitTimedQuiz(quizId, [...answers, newAnswer], difficulty);
      setScore(result.totalScore ?? result);
    }
  }, 1000);
  }, [
    quizId,
    difficulty,
    question,
    currentIndex,
    questions.length,
    selectedOption,
    answers,
    score,
    showFeedback,
  ]);

  // ✅ If time hits 0, auto-advance ONLY ONCE per question index
  useEffect(() => {
    if (score !== null || !questions.length || showFeedback) return;

    if (timeLeft === 0 && autoAdvancedIndexRef.current !== currentIndex) {
      autoAdvancedIndexRef.current = currentIndex;
      nextQuestion();
    }
  }, [timeLeft, score, questions.length, showFeedback, currentIndex, nextQuestion]);

  if (!questions.length) return <Typography>Loading...</Typography>;
  if (!question) return <Typography>Loading question...</Typography>;

  // Full-page timer bar calculation
  const totalTime = TIME_MAP[difficulty];
  const progressRatio = Math.max(0, Math.min(1, timeLeft / totalTime));
  const progressPercent = progressRatio * 100;

  const backgroundColor = `rgb(
    ${Math.round(255 * (1 - progressRatio))},
    ${Math.round(255 * progressRatio)},
    0
  )`;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#f5f5f5",
      }}
    >
      {/* FULL PAGE TIME BAR (BACKGROUND) */}
      {score === null && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: `${progressPercent}%`,
            backgroundColor,
            opacity: 0.2,
            zIndex: 0,
            transition: "width 1s linear, background-color 1s linear",
          }}
        />
      )}

      {/* MAIN CONTENT LAYER */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        {/* CENTERED QUIZ CARD */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 600,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 10,
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h5" gutterBottom textAlign="center">
            Difficulty: {difficulty.toUpperCase()}
          </Typography>

          {score === null && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Question {currentIndex + 1} / {questions.length}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Time Left: {timeLeft}s
                </Typography>
              </CardContent>
            </Card>
          )}

          {score === null ? (
            <>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, textAlign: "center" }}
              >
                {question.text}
              </Typography>

              {/* Options */}
              <Box
                role="radiogroup"
                aria-label="Answer choices"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 2,
                }}
              >
                {options.map((opt) => {
                  const optionLabel = typeof opt === "string" ? opt : opt.label;
                  const optionImage = typeof opt === "string" ? null : opt.imageUrl;
                  const isCorrect = showFeedback && optionLabel === correctOption;
                  const isWrongSelected =
                    showFeedback && selectedOption === optionLabel && optionLabel !== correctOption;

                  return (
                    <Card
                      key={optionLabel}
                      variant="outlined"
                      onClick={() => selectAnswer(optionLabel)}
                      sx={{
                        cursor: showFeedback ? "default" : "pointer",
                        borderColor: isCorrect
                          ? "success.main"
                          : isWrongSelected
                          ? "error.main"
                          : selectedOption === optionLabel
                          ? "primary.main"
                          : "grey.300",
                        boxShadow:
                          isCorrect || isWrongSelected ? 6 : selectedOption === opt ? 4 : 1,
                        bgcolor: isCorrect
                          ? "success.light"
                          : isWrongSelected
                          ? "error.light"
                          : selectedOption === optionLabel
                          ? "primary.light"
                          : "white",
                        opacity: showFeedback && !isCorrect && !isWrongSelected ? 0.8 : 1,
                        transition: "all 0.2s",
                        "&:focus-visible": {
                          outline: "2px solid",
                          outlineColor: "primary.main",
                        },
                      }}
                      role="radio"
                      tabIndex={0}
                      aria-checked={selectedOption === optionLabel}
                      onKeyDown={(e) => {
                        if (showFeedback) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectAnswer(optionLabel);
                        }
                      }}
                    >
                      <CardContent>
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={optionLabel}
                            sx={{
                              width: "100%",
                              maxHeight: 200,
                              objectFit: "contain",
                              borderRadius: 2,
                              mb: 1,
                            }}
                          />
                        )}
                        <Typography>{optionLabel}</Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                onClick={nextQuestion}
                disabled={!selectedOption || showFeedback}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Confetti width={windowSize.width} height={windowSize.height} />
              <ScorePage score={score} />
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

QuizPage.propTypes = {
  quizId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  difficulty: PropTypes.string.isRequired,
};
