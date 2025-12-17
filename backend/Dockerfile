# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn -B -DskipTests clean package

# ---------- RUN STAGE ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Render provides PORT automatically
ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/target/*.jar app.jar

CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
