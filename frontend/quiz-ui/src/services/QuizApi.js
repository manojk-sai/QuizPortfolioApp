const BASE_URL =
  (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/quizzes";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getQuizzes = async () => {
  const res = await fetch(BASE_URL, { headers: {...authHeaders()} });
  return res.json();
};

export const getQuestions = async (quizId) => {
  const res = await fetch(`${BASE_URL}/${quizId}/questions`, {
    headers: { ...authHeaders() },
  });
  return res.json();
};

export const createQuiz = async (quiz) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(quiz),
  });
  return res.json();
};

export const addQuestion = async (quizId, question) => {
  const res = await fetch(`${BASE_URL}/${quizId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(question),
  });
  return res.json();
};

export const submitTimedQuiz = async (quizId, answers, difficulty) => {
  const res = await fetch(
    `${BASE_URL}/${quizId}/submit?difficulty=${difficulty}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(answers),
    }
  );
  return res.json();
};

export const checkAnswer = async (quizId, questionId, payload, difficulty) => {
  const res = await fetch(
    `${BASE_URL}/${quizId}/questions/${questionId}/check?difficulty=${difficulty}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }
  );
  return res.json();
};
