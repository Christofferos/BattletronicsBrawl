/* # Import dependencies # */
const io = require("socket.io")();
const { initGame, gameLoop, keyPressed, keyReleased } = require("./game");
const { FRAME_RATE, WINNING_SCORE, DELAY_BETWEEN_ROUNDS } = require("./constants");
const { makeid } = require("./utils");

/* ### Crucial constants ### */
const state = {};
const clientRooms = {};

/* ### [Connection]: While atleast one client is connected to server. ### */
io.on("connection", (client) => {
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);
  client.on("keypressed", handleKeyPressed);
  client.on("keyreleased", handleKeyReleased);

  /* ### [HandleNewGame]: ### */
  function handleNewGame() {
    let roomName = makeid(3);
    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    state[roomName] = initGame([0, 0]);

    client.join(roomName);
    client.number = 1;
    client.emit("init", 1);
  }

  /* ### [HandleJoinGame]: ### */
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

  /* ### [HandleKeyPressed]: ### */
  function handleKeyPressed(keyCode) {
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
    keyPressed(keyCode, state[roomName].players[client.number - 1]);
  }

  /* ### [HandleKeyReleased]: ### */
  function handleKeyReleased(keyCode) {
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
    keyReleased(keyCode, state[roomName].players[client.number - 1]);
  }
});

/* ### [StartGameInterval]: Loops until game over.  ### */
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
        state[roomName] = null;
      }
    }
  }
}

/* ### [EmitGameState]: Sends to all clients ### */
function emitGameState(room, gameState) {
  io.sockets.in(room).emit("gameState", JSON.stringify(gameState));
}

/* ### [EmitGameOver]: Sends to all clients ### */
function emitGameOver(room, winner, score) {
  io.sockets.in(room).emit("gameOver", JSON.stringify({ winner, score }));
}

/* ## Listen on PORT provided by Heroku (or 3000 if local): ## */
io.listen(process.env.PORT || 3000);
