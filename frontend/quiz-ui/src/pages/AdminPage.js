import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addQuestion, createQuiz, getQuizzes } from "../services/QuizApi";

const blankOption = () => ({ label: "", imageUrl: "" });

export default function AdminPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [optionType, setOptionType] = useState("TEXT");
  const [options, setOptions] = useState([blankOption(), blankOption(), blankOption(), blankOption()]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  useEffect(() => {
    getQuizzes().then((data) => {
      setQuizzes(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length) {
        setSelectedQuizId(data[0].id);
      }
    });
  }, []);

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => q.id === selectedQuizId),
    [quizzes, selectedQuizId]
  );

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!quizTitle.trim()) {
      setError("Quiz title is required");
      return;
    }
    try {
      setCreatingQuiz(true);
      const created = await createQuiz({ title: quizTitle.trim() });
      setQuizzes((prev) => [...prev, created]);
      setSelectedQuizId(created.id);
      setQuizTitle("");
      setStatus(`Created quiz "${created.title}"`);
    } catch (err) {
      setError(err.message || "Failed to create quiz");
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleOptionChange = (index, field, value) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addAnotherOption = () => {
    setOptions((prev) => [...prev, blankOption()]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return; // need at least 2 options
    setOptions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (correctIndex >= updated.length) {
        setCorrectIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!selectedQuizId) {
      setError("Select a quiz first");
      return;
    }

    const cleanedOptions = options
      .map((opt) => ({ label: opt.label.trim(), imageUrl: opt.imageUrl.trim() }))
      .filter((opt) => opt.label || opt.imageUrl);

    if (!questionText.trim()) {
      setError("Question text is required");
      return;
    }

    if (cleanedOptions.length < 2) {
      setError("Please provide at least two options");
      return;
    }

    if (!cleanedOptions[correctIndex]) {
      setError("Choose a correct option");
      return;
    }

    const payload = {
      text: questionText.trim(),
      audioUrl: audioUrl.trim() || null,
      optionType,
      correctAnswer: cleanedOptions[correctIndex].label,
      options: cleanedOptions,
    };

    try {
      setSubmittingQuestion(true);
      await addQuestion(selectedQuizId, payload);
      setQuestionText("");
      setAudioUrl("");
      setOptionType("TEXT");
      setOptions([blankOption(), blankOption(), blankOption(), blankOption()]);
      setCorrectIndex(0);
      setStatus("Question added successfully");
    } catch (err) {
      setError(err.message || "Failed to add question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom align="center">
        Admin Panel
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create Quiz
            </Typography>
            <Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={2} onSubmit={handleCreateQuiz}>
              <TextField
                label="Quiz title"
                fullWidth
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
              <Button type="submit" variant="contained" disabled={creatingQuiz}>
                {creatingQuiz ? "Creating..." : "Create"}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Question
            </Typography>

            <Stack spacing={2} component="form" onSubmit={handleSubmitQuestion}>
              <FormControl fullWidth>
                <Select
                  value={selectedQuizId ?? ""}
                  displayEmpty
                  onChange={(e) =>
                    setSelectedQuizId(e.target.value === "" ? null : Number(e.target.value))
                  }
                  renderValue={(val) => {
                    if (val === null || val === "") return "Select a quiz";
                    return selectedQuiz?.title || "Select a quiz";
                  }}
                >
                  <MenuItem value="">
                    <em>Select a quiz</em>
                  </MenuItem>
                  {quizzes.map((quiz) => (
                    <MenuItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Question text"
                fullWidth
                multiline
                minRows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl sx={{ minWidth: 140 }}>
                  <FormLabel>Option type</FormLabel>
                  <Select value={optionType} onChange={(e) => setOptionType(e.target.value)}>
                    <MenuItem value="TEXT">Text</MenuItem>
                    <MenuItem value="IMAGE">Image</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Audio URL (optional)"
                  fullWidth
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
              </Stack>

              <Box>
                <FormLabel component="legend">Options</FormLabel>
                <RadioGroup value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))}>
                  <Stack spacing={2} mt={1}>
                    {options.map((opt, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                          <FormControlLabel
                            value={idx}
                            control={<Radio />}
                            label={
                              <Typography variant="body2">
                                Correct
                              </Typography>
                            }
                          />
                          <TextField
                            label={`Option ${idx + 1} label`}
                            value={opt.label}
                            onChange={(e) => handleOptionChange(idx, "label", e.target.value)}
                            fullWidth
                          />
                          <TextField
                            label={`Option ${idx + 1} image URL`}
                            value={opt.imageUrl}
                            onChange={(e) => handleOptionChange(idx, "imageUrl", e.target.value)}
                            fullWidth
                            placeholder={optionType === "IMAGE" ? "https://..." : "(optional)"}
                          />
                          {options.length > 2 && (
                            <Button color="error" onClick={() => removeOption(idx)}>
                              Remove
                            </Button>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </RadioGroup>
                <Button sx={{ mt: 2 }} onClick={addAnotherOption}>
                  Add another option
                </Button>
              </Box>

              <Button type="submit" variant="contained" disabled={submittingQuestion}>
                {submittingQuestion ? "Saving..." : "Save question"}
              </Button>

              {status && <Alert severity="success">{status}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

