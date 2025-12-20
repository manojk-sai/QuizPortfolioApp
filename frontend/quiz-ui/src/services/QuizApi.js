export const SONG_QUIZ_ID = "song-quiz";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const BASE_URL = API_BASE + "/api/quizzes";
const SONG_BASE_URL = API_BASE + "/api/song-quiz";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getQuizzes = async () => {
  const res = await fetch(BASE_URL, { headers: { ...authHeaders() } });
  const baseQuizzes = await res.json();
  return [
    ...baseQuizzes,
    {
      id: SONG_QUIZ_ID,
      title: "Song Guessing Challenge",
    },
  ];
};

export const getQuestions = async (quizId) => {
  if (quizId === SONG_QUIZ_ID) {
    const res = await fetch(`${SONG_BASE_URL}/questions`, {
      headers: { ...authHeaders() },
    });
    return res.json();
  }

  const res = await fetch(`${BASE_URL}/${quizId}/questions`, {
    headers: { ...authHeaders() },
  });
  return res.json();
};

export const submitTimedQuiz = async (quizId, answers, difficulty) => {
  if (quizId === SONG_QUIZ_ID) {
    const res = await fetch(`${SONG_BASE_URL}/submit?difficulty=${difficulty}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(answers),
    });
    return res.json();
  }

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
  if (quizId === SONG_QUIZ_ID) {
    const res = await fetch(
      `${SONG_BASE_URL}/questions/${questionId}/check?difficulty=${difficulty}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      }
    );
    return res.json();
  }

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
