import React, { useState, useEffect, useCallback, useMemo } from "react";
import USAMap from "react-usa-map";
import { statesData } from "./data/statesData";

export default function App() {
  const [gameActive, setGameActive] = useState(false);
  const [timer, setTimer] = useState(0); // Start at 0
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [message, setMessage] = useState("Ready for the Challenge?");
  const [difficulty, setDifficulty] = useState("easy");
  const [highScores, setHighScores] = useState([]);
  const [wrongState, setWrongState] = useState(null); // For the red flash
  const [isProcessing, setIsProcessing] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  // Load High Scores on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("jedara_scores") || "[]");
    setHighScores(saved);
  }, []);
  // 1. Updated Next Question Logic
  const startNextQuestion = useCallback(() => {
    // Use a functional update to check the LATEST questionCount
    setWasCorrect(false); // <--- Reset for the new round
    setQuestionCount((prevCount) => {
      if (prevCount >= 10) {
        setGameActive(false);
        const currentFinalScore = score; // Capture score in closure
        setHighScores((prev) => {
          const newScores = [...prev, currentFinalScore]
            .sort((a, b) => b - a)
            .slice(0, 5);
          localStorage.setItem("jedara_scores", JSON.stringify(newScores));
          return newScores;
        });
        setMessage(`Game Over! Final Score: ${currentFinalScore}`);
        return prevCount;
      }

      const randomState =
        statesData[Math.floor(Math.random() * statesData.length)];
      const pool = randomState[difficulty] || randomState.easy;
      const randomFact = pool[Math.floor(Math.random() * pool.length)];

      setCurrentQuestion(randomState);
      setWrongState(null);
      setMessage(`Find: "${randomFact}"`);
      setTimer(10); // Restart the clock
      return prevCount + 1;
    });
  }, [difficulty, score]);

  // 2. Updated Timer Effect
  useEffect(() => {
    let interval;
    if (gameActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (gameActive && timer === 0) {
      // Only show "Time's Up" if they haven't already answered correctly
      if (!wasCorrect) {
        setMessage(`Time's up! That was ${currentQuestion?.name}.`);
        setWrongState(currentQuestion?.id);

        const timeout = setTimeout(() => {
          startNextQuestion();
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }

    return () => clearInterval(interval);
  }, [timer, gameActive, startNextQuestion, currentQuestion, wasCorrect]);
  const mapHandler = (event) => {
    if (!gameActive || timer <= 0) return;
    const clicked = event.target.dataset.name;

    if (clicked === currentQuestion.id) {
      setWasCorrect(true); // <--- Mark as success
      const points = (difficulty === "hard" ? 200 : 100) * timer;
      setScore((s) => s + points);
      setMessage(`Correct! That is ${currentQuestion.name}.`);

      setTimer(0);
      setTimeout(startNextQuestion, 1200);
    } else {
      // ... rest of your wrong answer logic
      setWrongState(clicked);
      setTimer((prev) => Math.max(0, prev - 2));
      setTimeout(() => setWrongState(null), 500);
      setMessage(`No, that's ${clicked}. Try again!`);
    }
  };
  // Customizing map colors dynamically
  const statesCustomConfig = useMemo(() => {
    if (!wrongState) return {};
    return { [wrongState]: { fill: "#ef4444" } };
  }, [wrongState]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0f172a",
        color: "white",
        padding: "2rem",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", margin: 0 }}>
          JEDARA <span style={{ color: "#6366f1" }}>GEO</span>
        </h1>

        {!gameActive && (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {["easy", "hard"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                style={{
                  padding: "5px 15px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: difficulty === level ? "#6366f1" : "#334155",
                  color: "white",
                }}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
            }}
          >
            Score: {score}
          </div>
          <div
            style={{
              background: timer < 4 && gameActive ? "#ef4444" : "#1e293b",
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
            }}
          >
            Time: {timer}s
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          borderRadius: "24px",
          padding: "2rem",
          color: "#1e293b",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: "bold",
              minHeight: "3.5rem",
            }}
          >
            {message}
          </h2>
        </div>

        {!gameActive ? (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => {
                setScore(0);
                setQuestionCount(0);
                setGameActive(true);
                startNextQuestion();
              }}
              style={{
                padding: "1rem 2rem",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.25rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Start Challenge
            </button>
            {highScores.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h3
                  style={{
                    color: "#64748b",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                  }}
                >
                  Best Scores
                </h3>
                {highScores.map((s, i) => (
                  <div
                    key={i}
                    style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="map-wrapper"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <USAMap onClick={mapHandler} customize={statesCustomConfig} />
          </div>
        )}
      </main>

      <style>{`
        .map-wrapper svg { width: 100%; height: auto; max-height: 450px; }
        path { cursor: pointer; transition: fill 0.2s; }
        path:hover { fill: #c7d2fe !important; }
      `}</style>
    </div>
  );
}
