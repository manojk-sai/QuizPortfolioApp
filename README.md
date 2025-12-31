# Quiz Portfolio App

A full-stack quiz platform built to showcase production-ready practices across frontend, API design, and secure authentication. The system ships as three deployable parts (React UI + quiz service + auth service), and is structured to be easy to run locally or deploy as separate services.

## Why this project stands out
- **Production-style architecture**: React 19 frontend with Spring Boot 3.x microservices and stateless JWT authentication.
- **Clear service boundaries**: authentication isolated from quiz and scoring logic to reflect real microservice deployments.
- **API-first design**: well defined REST contracts with OpenAPI documentation for frontend and third-party consumers.
- **Security-first defaults**: BCrypt password hashing, signed JWTs, and role-based access enforced at the API layer.

## Features
- User registration & login with JWT issuance.
- Create quizzes, add questions/options, and randomize quiz delivery.
- Difficulty aware scoring and per question answer checks.
- Audio-enabled questions and randomized options.
- Role based admin UI for managing quizzes.
- OpenAPI/Swagger documentation for the quiz API.

## Architecture overview
```
frontend/quiz-ui   → React UI (Material UI)
authservice/       → Spring Boot auth API (JWT + BCrypt)
backend/           → Spring Boot quiz API (quizzes, questions, scoring)
```
## Key engineering decisions
- **Separate auth service**: keeps authentication concerns isolated and reusable across future services.
- **JWT-based stateless auth**: enables horizontal scaling without shared session state.
- **Server-side scoring & validation**: prevents client side tampering of quiz results.
- **Randomized question delivery**: reduces answer pattern memorization and replay bias.

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
- Add test coverage reports and CI workflow.
- Quiz analytics (attempt trends, difficulty insights).

## Demo
Live demo: https://quiz-portfolio-app.vercel.app/

> Note: Backend services may be in sleep mode on first load depending on hosting.
