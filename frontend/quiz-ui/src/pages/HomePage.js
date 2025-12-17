import { useState } from "react";
import QuizList from "../components/QuizList";
import QuizPage from "./QuizPage";
import { Container, Typography, Select, MenuItem, FormControl, InputLabel, Paper } from "@mui/material";

export default function HomePage() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");

  if(selectedQuizId){
    return <QuizPage quizId={selectedQuizId} difficulty={difficulty} />
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Quiz Application
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            label="Difficulty"
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <MenuItem value="easy">Easy (20 sec)</MenuItem>
            <MenuItem value="medium">Medium (15 sec)</MenuItem>
            <MenuItem value="hard">Hard (10 sec)</MenuItem>
          </Select>
        </FormControl>

        <QuizList onSelectQuiz={setSelectedQuizId} />
      </Paper>
    </Container>
  );
}