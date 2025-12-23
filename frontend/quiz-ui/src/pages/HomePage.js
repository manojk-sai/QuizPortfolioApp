import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuizList from "../components/QuizList";
import QuizPage from "./QuizPage";
import { Button, Container, Typography, Select, MenuItem, FormControl, InputLabel, Paper, Box } from "@mui/material";

export default function HomePage() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const navigate = useNavigate();

  if(selectedQuizId){
    return <QuizPage quizId={selectedQuizId} difficulty={difficulty} />
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h3" gutterBottom>
            Quiz Application
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            Admin
          </Button>
        </Box>

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
