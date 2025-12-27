# Quiz Portfolio App

A full-stack quiz platform built to showcase production-ready practices across frontend, API design, and secure authentication. The system ships as three deployable parts (React UI + quiz service + auth service), and is structured to be easy to run locally or deploy as separate services.

## Why this project stands out
- **Modern full-stack architecture**: React 19 + Spring Boot 3.x microservices with JWT-based auth.
- **Scalable domain design**: clear separation between authentication and quiz/scoring logic.
- **API-first implementation**: REST endpoints and OpenAPI annotations for easy integration.
- **Security-minded defaults**: BCrypt password hashing, JWT tokens, and role-based access in the API.

## Features
- User registration & login with JWT issuance.
- Create quizzes, add questions/options, and randomize quiz delivery.
- Difficulty-aware scoring and per-question answer checks.
- Audio-enabled questions and randomized options.
- OpenAPI/Swagger documentation for the quiz API.

## Architecture overview
```
frontend/quiz-ui   → React UI (Material UI)
authservice/       → Spring Boot auth API (JWT + BCrypt)
backend/           → Spring Boot quiz API (quizzes, questions, scoring)
```

## Tech stack
**Frontend**
- React 19, React Router, Material UI

**Backend services**
- Java 17, Spring Boot 3.x
- Spring Web, Spring Data JPA, Spring Security
- PostgreSQL
- OpenAPI/Swagger via springdoc

## Local development

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL (or provide your own managed database)

### 1) Configure environment variables
Both services read from environment variables. Example values:

**Auth service** (`authservice/src/main/resources/application.properties`)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`

**Quiz service** (`backend/src/main/resources/application.properties`)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`

### 2) Start the auth service
```bash
cd authservice
./mvnw spring-boot:run
```
Runs on `http://localhost:9001`.

### 3) Start the quiz service
```bash
cd backend
./mvnw spring-boot:run
```
Runs on `http://localhost:8080`.

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 4) Start the frontend
```bash
cd frontend/quiz-ui
npm install
npm start
```
Runs on `http://localhost:3000`.

## API highlights

**Auth Service** (`/api/auth`)
- `POST /register` — create a new account
- `POST /login` — authenticate and receive a JWT

**Quiz Service** (`/api/quizzes`)
- `GET /api/quizzes` — list quizzes
- `POST /api/quizzes` — create a quiz (secured)
- `POST /api/quizzes/{quizId}/questions` — add questions (secured)
- `GET /api/quizzes/{quizId}/questions` — fetch randomized questions
- `POST /api/quizzes/{quizId}/submit` — score a quiz attempt (secured)
- `POST /api/quizzes/{quizId}/questions/{questionId}/check` — check a single answer (secured)

## Project structure
```
QuizPortfolioApp/
├── authservice/        # Authentication microservice
├── backend/            # Quiz & scoring microservice
└── frontend/quiz-ui/   # React web client
```

## Roadmap ideas
- Containerize services with Docker Compose for one-command startup.
- Add role-based admin UI for managing quizzes.
- Add test coverage reports and CI workflow.

---

If you’re evaluating this project for a role, the codebase is intentionally organized to highlight production-ready practices: clear service boundaries, secure authentication, and a frontend that consumes well-structured APIs.
