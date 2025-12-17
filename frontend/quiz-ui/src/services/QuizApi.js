const BASE_URL = "http://localhost:8080/api/quizzes";

export const getQuizzes = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const getQuestions = async (quizId) => {
  const res = await fetch(`${BASE_URL}/${quizId}/questions`);
  return res.json();
};

export const submitTimedQuiz = async (quizId, answers, difficulty) => {
  const res = await fetch(`${BASE_URL}/${quizId}/submit?difficulty=${difficulty}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  return res.json();
};

export const checkAnswer = async (quizId, questionId, payload, difficulty) => {
  const res = await fetch(
    `${BASE_URL}/${quizId}/questions/${questionId}/check?difficulty=${difficulty}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return res.json();
};