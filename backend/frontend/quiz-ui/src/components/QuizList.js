import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { getQuizzes } from "../services/QuizApi";
import { Button, Card, CardContent, Typography, Stack } from "@mui/material";

export default function QuizList({ onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    getQuizzes().then(setQuizzes);
  }, []);

  return (
    <Stack spacing={2}>
      {quizzes.map(q => (
        <Card key={q.id} variant="outlined">
          <CardContent>
            <Typography variant="h6">{q.title}</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 1 }}
              onClick={() => onSelectQuiz(q.id)}
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

QuizList.propTypes = {
  onSelectQuiz: PropTypes.func.isRequired,
};