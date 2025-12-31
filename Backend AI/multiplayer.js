const { Server } = require("socket.io");

let io;
const activeRooms = new Map();

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const calculateScore = (isCorrect, timeTaken, totalTime = 30) => {
  if (!isCorrect) return 0;

  const baseScore = 100;
  const timeBonus = Math.max(
    0,
    Math.floor(((totalTime - timeTaken) / totalTime) * 50)
  );
  return baseScore + timeBonus;
};

const initializeMultiplayer = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new multiplayer room
    socket.on(
      "create-room",
      ({ roomName, quizId, username, quizData, timeLimit }) => {
        try {
          const roomCode = generateRoomCode();

          activeRooms.set(roomCode, {
            code: roomCode,
            name: roomName,
            host: socket.id,
            quizId: quizId,
            quizData: quizData || {
              topic: "Waiting for host...",
              questions: [],
            },
            timeLimit: timeLimit || 30,
            players: [
              {
                id: socket.id,
                username: username,
                score: 0,
                answers: [],
                ready: true, // Host is always ready
              },
            ],
            currentQuestion: 0,
            status: "waiting", // waiting, playing, finished
            startedAt: null,
            questionStartedAt: null,
          });

          socket.join(roomCode);
          socket.roomCode = roomCode;

          socket.emit("room-created", {
            roomCode,
            room: activeRooms.get(roomCode),
          });

          console.log(`Room created: ${roomCode} by ${username}`);
        } catch (error) {
          console.error("Create room error:", error);
          socket.emit("error", { message: "Failed to create room" });
        }
      }
    );

    // Join an existing room
    socket.on("join-room", ({ roomCode, username }) => {
      try {
        const room = activeRooms.get(roomCode);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.status !== "waiting") {
          socket.emit("error", { message: "Game already in progress" });
          return;
        }

        // Check if player already in room
        const existingPlayer = room.players.find(
          (p) => p.username === username
        );
        if (existingPlayer) {
          socket.emit("error", {
            message: "Username already taken in this room",
          });
          return;
        }

        room.players.push({
          id: socket.id,
          username: username,
          score: 0,
          answers: [],
          ready: false,
        });

        socket.join(roomCode);
        socket.roomCode = roomCode;

        // Notify all players in room
        io.to(roomCode).emit("player-joined", {
          username,
          players: room.players,
          room: room,
        });

        // Send room info to the joiner
        socket.emit("room-joined", {
          roomCode,
          room: room,
          timeLimit: room.timeLimit,
        });

        console.log(`${username} joined room: ${roomCode}`);
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Update quiz for the room (host only)
    socket.on("update-quiz", ({ roomCode, quizData, timeLimit }) => {
      try {
        const room = activeRooms.get(roomCode);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.host !== socket.id) {
          socket.emit("error", {
            message: "Only the host can update the quiz",
          });
          return;
        }

        // Update room quiz data
        room.quizData = quizData;
        room.timeLimit = timeLimit || room.timeLimit;

        // Notify all players
        io.to(roomCode).emit("quiz-updated", {
          quizData: quizData,
          timeLimit: room.timeLimit,
        });

        io.to(roomCode).emit("time-limit-updated", {
          timeLimit: room.timeLimit,
        });

        console.log(`Quiz updated in room ${roomCode}: ${quizData.topic}`);
      } catch (error) {
        console.error("Update quiz error:", error);
        socket.emit("error", { message: "Failed to update quiz" });
      }
    });

    // Player ready status
    socket.on("player-ready", ({ roomCode }) => {
      try {
        const room = activeRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.ready = !player.ready; // Toggle ready state

          io.to(roomCode).emit("player-ready-update", {
            playerId: socket.id,
            username: player.username,
            players: room.players,
          });

          // Check if all non-host players are ready
          const nonHostPlayers = room.players.filter((p) => p.id !== room.host);
          const allReady = nonHostPlayers.every((p) => p.ready);

          if (allReady && nonHostPlayers.length > 0) {
            io.to(roomCode).emit("all-players-ready");
          }
        }
      } catch (error) {
        console.error("Player ready error:", error);
      }
    });

    // Start the game
    socket.on("start-game", ({ roomCode, timeLimit }) => {
      try {
        const room = activeRooms.get(roomCode);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.host !== socket.id) {
          socket.emit("error", { message: "Only the host can start the game" });
          return;
        }

        if (
          !room.quizData ||
          !room.quizData.questions ||
          room.quizData.questions.length === 0
        ) {
          socket.emit("error", { message: "Please select a quiz first" });
          return;
        }

        // Update time limit if provided
        if (timeLimit) {
          room.timeLimit = timeLimit;
        }

        room.status = "playing";
        room.currentQuestion = 0;
        room.startedAt = Date.now();
        room.questionStartedAt = Date.now();

        // Reset all player scores and answers
        room.players.forEach((p) => {
          p.score = 0;
          p.answers = [];
        });

        // Send first question
        io.to(roomCode).emit("game-started", {
          quizData: room.quizData,
          currentQuestion: 0,
          totalQuestions: room.quizData.questions.length,
          timeLimit: room.timeLimit,
        });

        console.log(
          `Game started in room: ${roomCode} with ${room.quizData.questions.length} questions`
        );
      } catch (error) {
        console.error("Start game error:", error);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // Submit answer
    socket.on(
      "submit-answer",
      ({ roomCode, questionIndex, answer, timeTaken }) => {
        try {
          const room = activeRooms.get(roomCode);
          if (!room || room.status !== "playing") return;

          const player = room.players.find((p) => p.id === socket.id);
          if (!player) return;

          // Check if player already answered this question
          if (player.answers.some((a) => a.questionIndex === questionIndex)) {
            return;
          }

          // Get the correct answer
          const question = room.quizData.questions[questionIndex];
          let isCorrect = false;

          // Handle different answer formats
          if (answer !== null && answer !== undefined) {
            // For index-based answers (MCQ, True/False)
            if (typeof answer === "number") {
              isCorrect = answer === question.correctAnswer;
            } else if (typeof answer === "string") {
              // For string answers, compare with options
              const correctIndex = question.correctAnswer;
              const options = question.options || ["True", "False"];
              isCorrect =
                answer === options[correctIndex] ||
                answer === question.correctAnswer;
            }
          }

          const points = calculateScore(isCorrect, timeTaken, room.timeLimit);

          player.score += points;
          player.answers.push({
            questionIndex,
            answer,
            isCorrect,
            timeTaken,
            points,
          });

          // Track player's current question index
          player.currentQuestion = questionIndex;

          // Sort leaderboard by score
          const leaderboard = room.players
            .map((p) => ({
              username: p.username,
              score: p.score,
              answersCount: p.answers.length,
              currentQuestion: p.currentQuestion || 0,
            }))
            .sort((a, b) => b.score - a.score);

          // Notify all players of the answer submission (for live leaderboard)
          io.to(roomCode).emit("answer-submitted", {
            playerId: socket.id,
            username: player.username,
            isCorrect,
            points,
            leaderboard,
          });

          // Send next question only to this player (independent progression)
          const nextQuestionIndex = questionIndex + 1;
          if (nextQuestionIndex < room.quizData.questions.length) {
            // Send next question to this specific player after a short delay
            setTimeout(() => {
              socket.emit("player-next-question", {
                currentQuestion: nextQuestionIndex,
                totalQuestions: room.quizData.questions.length,
                question: room.quizData.questions[nextQuestionIndex],
                timeLimit: room.timeLimit,
                isCorrect: isCorrect,
                correctAnswer: question.correctAnswer,
                points: points,
              });
            }, 1500); // 1.5 second delay to show result
          } else {
            // This player has finished all questions
            player.finished = true;
            player.finishedAt = Date.now();

            // Notify this player they finished
            socket.emit("player-finished", {
              score: player.score,
              correctAnswers: player.answers.filter((a) => a.isCorrect).length,
              totalQuestions: room.quizData.questions.length,
              answers: player.answers,
            });

            // Check if all players have finished
            const allFinished = room.players.every((p) => p.finished);

            if (allFinished) {
              // Game finished for everyone
              room.status = "finished";

              const finalResults = room.players
                .map((p) => ({
                  username: p.username,
                  score: p.score,
                  correctAnswers: p.answers.filter((a) => a.isCorrect).length,
                  totalAnswers: p.answers.length,
                  answers: p.answers,
                  averageTime:
                    p.answers.length > 0
                      ? p.answers.reduce((sum, a) => sum + a.timeTaken, 0) /
                        p.answers.length
                      : 0,
                  finishedAt: p.finishedAt,
                }))
                .sort((a, b) => b.score - a.score);

              io.to(roomCode).emit("game-finished", {
                results: finalResults,
                winner: finalResults[0],
              });

              console.log(`Game finished in room: ${roomCode}`);
            } else {
              // Notify others that this player finished
              io.to(roomCode).emit("player-completed-quiz", {
                username: player.username,
                score: player.score,
                leaderboard,
              });
            }
          }
        } catch (error) {
          console.error("Submit answer error:", error);
          socket.emit("error", { message: "Failed to submit answer" });
        }
      }
    );

    // Force next question (host timeout)
    socket.on("force-next-question", ({ roomCode }) => {
      try {
        const room = activeRooms.get(roomCode);
        if (!room || room.status !== "playing") return;
        if (room.host !== socket.id) return;

        // Move to next question
        if (room.currentQuestion < room.quizData.questions.length - 1) {
          room.currentQuestion++;
          room.questionStartedAt = Date.now();

          io.to(roomCode).emit("next-question", {
            currentQuestion: room.currentQuestion,
            totalQuestions: room.quizData.questions.length,
            question: room.quizData.questions[room.currentQuestion],
            timeLimit: room.timeLimit,
          });
        } else {
          // End the game
          room.status = "finished";

          const finalResults = room.players
            .map((p) => ({
              username: p.username,
              score: p.score,
              correctAnswers: p.answers.filter((a) => a.isCorrect).length,
              totalAnswers: p.answers.length,
              answers: p.answers,
            }))
            .sort((a, b) => b.score - a.score);

          io.to(roomCode).emit("game-finished", {
            results: finalResults,
            winner: finalResults[0],
          });
        }
      } catch (error) {
        console.error("Force next question error:", error);
      }
    });

    // Get current room state
    socket.on("get-room-state", ({ roomCode }) => {
      try {
        const room = activeRooms.get(roomCode);
        if (room) {
          socket.emit("room-state", { room });
        } else {
          socket.emit("error", { message: "Room not found" });
        }
      } catch (error) {
        console.error("Get room state error:", error);
      }
    });

    // Leave room
    socket.on("leave-room", ({ roomCode }) => {
      try {
        handlePlayerLeave(socket, roomCode);
      } catch (error) {
        console.error("Leave room error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Find and clean up any rooms the player was in
      activeRooms.forEach((room, code) => {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          handlePlayerLeave(socket, code);
        }
      });
    });
  });

  return io;
};

const handlePlayerLeave = (socket, roomCode) => {
  const room = activeRooms.get(roomCode);
  if (!room) return;

  const player = room.players.find((p) => p.id === socket.id);
  if (!player) return;

  const playerName = player.username;
  const wasHost = room.host === socket.id;

  // Remove player from room
  room.players = room.players.filter((p) => p.id !== socket.id);

  // If room is empty or host left, delete room
  if (room.players.length === 0 || wasHost) {
    activeRooms.delete(roomCode);
    io.to(roomCode).emit("room-closed", {
      message: wasHost ? "Host left the room" : "Room closed",
    });
    console.log(`Room ${roomCode} deleted`);
  } else {
    // Notify remaining players
    io.to(roomCode).emit("player-left", {
      username: playerName,
      players: room.players,
    });
  }

  socket.leave(roomCode);
};

const getActiveRooms = () => {
  return Array.from(activeRooms.values()).map((room) => ({
    code: room.code,
    name: room.name,
    playerCount: room.players.length,
    status: room.status,
    quizTopic: room.quizData?.topic || "Unknown",
    timeLimit: room.timeLimit,
  }));
};

const getRoomInfo = (roomCode) => {
  return activeRooms.get(roomCode);
};

module.exports = {
  initializeMultiplayer,
  getActiveRooms,
  getRoomInfo,
};
