import PropTypes from "prop-types";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getQuestions, submitTimedQuiz, checkAnswer } from "../services/QuizApi";
import ScorePage from "./ScorePage";
import Confetti from "react-confetti";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";

const TIME_MAP = { easy: 20, medium: 15, hard: 10 };
const FEEDBACK_MS = 900;

export default function QuizPage({ quizId, difficulty }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Final submit payload
  const [answers, setAnswers] = useState([]);
  const answersRef = useRef([]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [timeLeft, setTimeLeft] = useState(TIME_MAP[difficulty]);
  const [score, setScore] = useState(null);

  // UI state
  const [selectedOption, setSelectedOption] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctOption, setCorrectOption] = useState("");

  // Confetti sizing
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Prevent auto-advance firing multiple times for same question index
  const autoAdvancedIndexRef = useRef(-1);

  // Keep track of timers / async to avoid double-advance
  const isAdvancingRef = useRef(false);
  const feedbackTimeoutRef = useRef(null);

  // Audio element ref
  const audioRef = useRef(null);

  // Load questions
  useEffect(() => {
    let alive = true;
    getQuestions(quizId).then((data) => {
      if (!alive) return;
      setQuestions(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption("");
      setShowFeedback(false);
      setCorrectOption("");
      setScore(null);
    });
    return () => {
      alive = false;
    };
  }, [quizId]);

  // Resize listener (confetti)
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Current question
  const question = questions[currentIndex];

  // Compute responsive layout: number of columns (max 4) and sizes
  const optionCount = (question?.options || []).length;
  const cols = Math.min(4, Math.max(1, optionCount));
  // base width per card (e.g. 4 -> 25%)
  const cardWidth = `${100 / cols}%`;
  const imageHeight = cols === 1 ? "48vh" : cols === 2 ? "34vh" : "28vh";

  // Ensure servedAt exists (use backend servedAt if present; else set when displayed)
  useEffect(() => {
    if (!question || score !== null) return;
    if (question.servedAt) return;

    const now = new Date().toISOString();
    setQuestions((prev) => {
      const copy = [...prev];
      copy[currentIndex] = { ...copy[currentIndex], servedAt: now };
      return copy;
    });
  }, [question, currentIndex, score]);

  // Reset timer on question change (only while quiz is running)
  useEffect(() => {
    if (score !== null || !questions.length) return;

    setTimeLeft(TIME_MAP[difficulty]);
    autoAdvancedIndexRef.current = -1;
    isAdvancingRef.current = false;
    setSelectedOption("");
    setShowFeedback(false);
    setCorrectOption("");

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, [currentIndex, questions.length, difficulty, score]);

  const selectAnswer = (option) => {
    if (showFeedback) return;
    setSelectedOption(option);
  };

  // Timer countdown (pause during feedback)
  useEffect(() => {
    if (score !== null || !questions.length || showFeedback) return;
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, questions.length, showFeedback]);

  // --- AUDIO: play if question has audioUrl, stop otherwise ---
  const audioSrc = useMemo(() => {
    const url = question?.audioUrl;
    if (!url) return null;

    // If backend sends "/audio/..." and files are in React public/,
    // this works as a relative URL (frontend origin).
    // If backend sends full URL, it also works.
    return url;
  }, [question?.audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // Always stop current audio first
    el.pause();
    el.currentTime = 0;

    // No audio for this question
    if (!audioSrc || score !== null) return;

    // Set new src and try to autoplay (may be blocked until user interaction)
    el.src = audioSrc;
    el.load();

    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // Autoplay might be blocked by browser. User can click Play.
      });
    }
  }, [audioSrc, score, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }
    };
  }, []);

  const nextQuestion = useCallback(
    async (reason = "manual") => {
      if (!question || score !== null) return;
      if (showFeedback) return;
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      const answeredAt = new Date().toISOString();
      const servedAt = question.servedAt || answeredAt;

      const chosen = selectedOption || ""; // empty = skipped
      const payload = {
        selectedOption: chosen,
        servedAt,
        answeredAt,
      };
      console.log("Answer payload:", payload);
      try {
        // Ask backend for correct answer feedback
        const resp = await checkAnswer(quizId, question.id, payload, difficulty);

        // Show highlight
        setCorrectOption(resp?.correctAnswer || "");
        setShowFeedback(true);

        const newAnswer = {
          questionId: question.id,
          selectedOption: chosen,
          servedAt,
          answeredAt,
        };

        // Save answer locally (use functional update AND ref for final submit)
        setAnswers((prev) => {
          const next = [...prev, newAnswer];
          answersRef.current = next;
          return next;
        });

        feedbackTimeoutRef.current = setTimeout(async () => {
          setShowFeedback(false);
          setSelectedOption("");

          if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setTimeLeft(TIME_MAP[difficulty]); // ensure timer reset immediately
            isAdvancingRef.current = false;
          } else {
            // Submit whole quiz with latest answersRef (includes skipped ones)
            const finalAnswers = answersRef.current;
            const result = await submitTimedQuiz(
              quizId,
              finalAnswers,
              difficulty
            );
            setScore(result?.totalScore ?? result);
            isAdvancingRef.current = false;
          }
        }, FEEDBACK_MS);
      } catch (e) {
        // If checkAnswer fails (network/backend), still move forward safely
        const newAnswer = {
          questionId: question.id,
          selectedOption: selectedOption || "",
          servedAt,
          answeredAt,
        };
        setAnswers((prev) => {
          const next = [...prev, newAnswer];
          answersRef.current = next;
          return next;
        });

        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setTimeLeft(TIME_MAP[difficulty]);
          isAdvancingRef.current = false;
        } else {
          const result = await submitTimedQuiz(
            quizId,
            answersRef.current,
            difficulty
          );
          setScore(result?.totalScore ?? result);
          isAdvancingRef.current = false;
        }
      }
    },
    [
      question,
      score,
      showFeedback,
      selectedOption,
      quizId,
      difficulty,
      currentIndex,
      questions.length,
    ]
  );

  // Auto-advance exactly once when time hits 0
  useEffect(() => {
    if (score !== null || !questions.length || showFeedback) return;

    if (timeLeft === 0 && autoAdvancedIndexRef.current !== currentIndex) {
      autoAdvancedIndexRef.current = currentIndex;
      nextQuestion("timeout");
    }
  }, [timeLeft, score, questions.length, showFeedback, currentIndex, nextQuestion]);

  if (!questions.length) return <Typography>Loading...</Typography>;
  if (!question) return <Typography>Loading question...</Typography>;

  // Full-page timer bar
  const totalTime = TIME_MAP[difficulty] || 20;
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
            opacity: 0.18,
            zIndex: 0,
            transition: "width 1s linear, background-color 1s linear",
          }}
        />
      )}

      {/* Hidden audio element (plays if audioUrl exists) */}
      <audio ref={audioRef} preload="auto" loop />

      {/* MAIN CONTENT LAYER */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          pb: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            bgcolor: "background.paper",
            borderRadius: 0,
            boxShadow: 0,
            p: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
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

                {/* Optional: show small hint if audio exists */}
                {audioSrc ? (
                  <Typography variant="caption" color="text.secondary">
                    🔊 Audio playing
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    (No audio for this question)
                  </Typography>
                )}
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

              {/* OPTIONS */}
              <Box
                role="radiogroup"
                aria-label="Answer choices"
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  // Force a single row: no wrapping, let items shrink to fit
                  flexWrap: "nowrap",
                  gap: 2,
                  mt: 2,
                  overflowX: "hidden",
                  p: 0,
                  alignItems: "stretch",
                  justifyContent: "space-between",
                }}
              >
                {(question.options || []).map((opt) => {
                  const label = typeof opt === "string" ? opt : opt?.label;
                  const imageUrl = typeof opt === "string" ? null : opt?.imageUrl;
                  if (!label) return null;

                  const isImage =
                    String(question.optionType).toUpperCase() === "IMAGE";

                  const isCorrect = showFeedback && label === correctOption;
                  const isWrongSelected =
                    showFeedback &&
                    selectedOption === label &&
                    label !== correctOption;
                  const isSelected = selectedOption === label;

                  return (
                    <Card
                      key={label}
                      variant="outlined"
                      onClick={() => {
                        if (showFeedback) return;
                        selectAnswer(label);
                      }}
                      sx={{
                        cursor: showFeedback ? "default" : "pointer",
                        // allow cards to shrink so all fit in one row; keep equal base width
                        flex: `1 1 ${cardWidth}`,
                        minWidth: 0,
                        borderColor: isCorrect
                          ? "success.main"
                          : isWrongSelected
                          ? "error.main"
                          : isSelected
                          ? "primary.main"
                          : "grey.300",
                        boxShadow:
                          isCorrect || isWrongSelected ? 6 : isSelected ? 4 : 1,
                        bgcolor: isCorrect
                          ? "success.light"
                          : isWrongSelected
                          ? "error.light"
                          : isSelected
                          ? "primary.light"
                          : "white",
                        opacity:
                          showFeedback && !isCorrect && !isWrongSelected
                            ? 0.85
                            : 1,
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        {isImage && imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={label}
                              style={{
                                // let image scale down so all cards fit in a single row
                                width: "auto",
                                maxWidth: "70%",
                                height: imageHeight,
                                objectFit: "cover",
                                borderRadius: 8,
                              }}
                            />
                            <Typography sx={{ mt: 1, fontWeight: 600 }}>
                              {label}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {label}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <Button
                variant="contained"
                onClick={() => nextQuestion("manual")}
                disabled={showFeedback}
                sx={{
                  position: 'fixed',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: 16,
                  width: { xs: '92%', sm: '70%', md: '56%' },
                  maxWidth: 760,
                  height: 64,
                  borderRadius: 32,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  boxShadow: 8,
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  px: 3,
                  '&:hover': {
                    transform: 'translateX(-50%) scale(1.02)',
                    boxShadow: 12,
                    bgcolor: 'primary.dark',
                  },
                  transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
                }}
              >
                Next →
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
  quizId: PropTypes.number.isRequired,
  difficulty: PropTypes.string.isRequired,
};