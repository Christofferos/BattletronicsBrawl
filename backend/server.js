/* # Game Variables # */
const io = require("socket.io")();
const { initGame, gameLoop, getUpdatedVelocity, getUpdatedVelocitySwipe } = require("./game");
const { FRAME_RATE, WINNING_SCORE, DELAY_BETWEEN_ROUNDS } = require("./constants");
const { makeid } = require("./utils");

const state = {};
const clientRooms = {};

/* ## Connection: ## */
io.on("connection", (client) => {
  client.on("keydown", handleKeydown);
  client.on("phoneSwipe", handlePhoneSwipe);
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      client.emit("tooManyPlayers");
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit("init", 2);

    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(3); // 5
    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    state[roomName] = initGame([0, 0]);

    client.join(roomName);
    client.number = 1;
    client.emit("init", 1);
  }

  function delayKeyDownInput(roomName) {
    if (state[roomName] == null) return;
    state[roomName].players[client.number - 1].inputDelay = true;
    setTimeout(() => {
      if (state[roomName] == null) return;
      state[roomName].players[client.number - 1].inputDelay = false;
    }, 75);
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName || state[roomName] == null) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode, state[roomName].players[client.number - 1]);

    if (vel !== -1 && state[roomName].players[client.number - 1].inputDelay == false && state[roomName] !== null) {
      state[roomName].players[client.number - 1].vel = vel;
      delayKeyDownInput(roomName);
    }
  }

  function handlePhoneSwipe(swipeDir) {
    const roomName = clientRooms[client.id];
    if (!roomName || state[roomName] == null) {
      return;
    }

    const vel = getUpdatedVelocitySwipe(swipeDir, state[roomName].players[client.number - 1]);

    if (vel !== -1 && state[roomName] !== null) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

/* ## StartGameInterval: ## */
function startGameInterval(roomName) {
  let intervalId = setInterval(() => intervalIdProcedure(), 1000 / FRAME_RATE);

  function intervalIdProcedure() {
    let winner = gameLoop(state[roomName]);

    if (!winner) {
      emitGameState(roomName, state[roomName]);
    } else {
      clearInterval(intervalId);
      if (winner == 1 || winner == -1) state[roomName].scores.P1++;
      if (winner == 2 || winner == -1) state[roomName].scores.P2++;
      emitGameOver(roomName, winner, { P1: state[roomName].scores.P1, P2: state[roomName].scores.P2 });
      //
      if (Math.max(state[roomName].scores.P1, state[roomName].scores.P2) < WINNING_SCORE) {
        state[roomName] = initGame([state[roomName].scores.P1, state[roomName].scores.P2]);
        setTimeout(
          () => (intervalId = setInterval(() => intervalIdProcedure(), 1000 / FRAME_RATE)),
          DELAY_BETWEEN_ROUNDS
        );
      } else {
        // console.log("SERVER END GAME" + WINNING_SCORE);
        state[roomName] = null;
      }
      //
    }
  }
}

/* ## EmitGameState: ## */
function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room).emit("gameState", JSON.stringify(gameState));
}

/* ## EmitGameOver: ## */
function emitGameOver(room, winner, score) {
  io.sockets.in(room).emit("gameOver", JSON.stringify({ winner, score }));
}

/* ## Listen on provided PORT: ## */
io.listen(process.env.PORT || 3000);
