/*//
 -Author: Kristopher Werlinder, 2020.
//*/

/* ### [DEPLOYMENT]: ONLINE ### */
const socket = io("https://boiling-springs-78440.herokuapp.com/");

/* ### [DEVELOPMENT]: LOCAL ### */
// const socket = io("http://localhost:3000");

// ------------------------------------------------------------------

/* ### Client recieves messages from server here. ### */
socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);

/* ### Frontend Elements ### */
const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameButton = document.getElementById("newGameButton");
const joinGameButton = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

const postGameCard = document.querySelector(".postGame");
const postGameCardText = document.querySelector(".postGame .text");
const postGameCountdown = document.querySelector(".postGame .countdown");
const postGameRestartButton = document.querySelector(".postGame .restartButton");

let scoreboard = document.querySelector(".scores");

/* ### Button Event Listeners ### */
newGameButton.addEventListener("click", newGame);
joinGameButton.addEventListener("click", joinGame);

/* ### Client Variables ### */
const CANVAS_WIDTH = 850; // <<< Changes here also needs to be done in constants.js
const BG_COLOR = "black"; // #0e1d34
const PLAYER_1_COLOR = "red"; //c2c2c2
const PLAYER_2_COLOR = "green";
const FLASH_COLOR = "white";
const POWER_UP_COLOR = "#6600ff";
const WALL_COLOR = "white"; //"#151515";

let canvas, contex;
let playerNumber;
let gameActive = false;
let flash = 0;
const winningScore = 5;

/* ### [HandleInit]: The server assigns numbers to clients, the numbers are recieved here.  ### */
function handleInit(number) {
  playerNumber = number;
}

/* ### [NewGame]: Client tells server to initialize a room. ### */
function newGame() {
  socket.emit("newGame");
  initializeGameWindow();
}

/* ### [HandleGameCode]: Displays a room-password, used for connecting to a room. ### */
function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

/* ### [JoinGame]: Sending password to the server. ### */
function joinGame() {
  let code = gameCodeInput.value;
  if (code != null) if (code.charAt(0) == " ") code = code.slice(1, code.length);
  socket.emit("joinGame", code);
  initializeGameWindow();
}

/* ### [HandleUnknownCode]: Joining with an invalid password. ### */
function handleUnknownCode() {
  reset();
  alert("Unknown Game Code");
}

/* ### [HandleTooManyPlayers]: Joining a room that is full. ### */
function handleTooManyPlayers() {
  reset();
  alert("This game is already in progress");
}

/* ### [Reset]: Displays the original page. ### */
function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  initialScreen.style.display = "block";
  document.getElementById("card").style.display = "block";
  gameScreen.style.display = "none";
}

/* ### [ReloadPage]: Gives option to reload page at game over. ### */
function reloadPage() {
  reset();
  location.reload();
}

/* ### [InitializeGameWindow]: Displays game window to client ### */
function initializeGameWindow() {
  initialScreen.style.display = "none";
  postGameRestartButton.style.display = "none";
  document.getElementById("card").style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById("canvas");
  contex = canvas.getContext("2d");
  canvas.width = canvas.height = CANVAS_WIDTH;
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  window.addEventListener("keypressed", (e) => keypressed(e), false);
  window.addEventListener("keyup", (e) => keyreleased(e), false);
  gameActive = true;
}

// -----------------------------------------------

/* ### [HandleGameState]: Loops continuously until game over (Called from startGameInterval, in server). ### */
function handleGameState(gameState) {
  if (!gameActive) return;
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

// -----------------------------------------------

/* ### [PaintGame]: Draws game window (Called from handleGameState) ### */
function paintGame(state) {
  const food = state.food;
  const gridsize = state.gridsize;
  const gridRatio = CANVAS_WIDTH / gridsize; // 8.5
  const playerSize = state.players[0].playersize; // 34
  const wallSize = state.walls.wallsize; // 34

  // CANVAS
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height); // (x, y, width, height)

  // POWERUPS
  contex.fillStyle = POWER_UP_COLOR;
  contex.fillRect(food.x * gridRatio, food.y * gridRatio, gridRatio * 2, gridRatio * 2);

  // BULLETS
  // -------
  contex.fillStyle = "#ff6600";
  for (let i = 0; i < state.players[0].bullets.length; i++) {
    contex.fillRect(
      state.players[0].bullets[i].x * gridRatio,
      state.players[0].bullets[i].y * gridRatio,
      gridRatio * 2,
      gridRatio * 2
    );
  }
  for (let i = 0; i < state.players[1].bullets.length; i++) {
    contex.fillRect(
      state.players[1].bullets[i].x * gridRatio,
      state.players[1].bullets[i].y * gridRatio,
      gridRatio * 2,
      gridRatio * 2
    );
  }
  // -------

  // WALLS SOLID
  contex.fillStyle = WALL_COLOR;
  if (state.walls.solid.length !== 0) {
    state.walls.solid.forEach((wall) => {
      contex.fillRect(wall.x * gridRatio, wall.y * gridRatio, wallSize, wallSize);
    });
  }

  // WALLS MOVABLE
  contex.fillStyle = "#ccccff";
  if (state.walls.movable.length !== 0) {
    state.walls.movable.forEach((wall) => {
      contex.fillRect(wall.x * gridRatio, wall.y * gridRatio, wallSize, wallSize);
    });
  }

  // PLAYERS
  // -------
  // P1
  contex.fillStyle = PLAYER_1_COLOR;
  contex.fillRect(state.players[0].pos.x * gridRatio, state.players[0].pos.y * gridRatio, playerSize, playerSize);
  // P1 Lives
  if (state.players[0].lives > 0)
    for (let i = 0; i < state.players[0].lives; i++) {
      contex.fillRect(state.players[0].pos.x * gridRatio + i * 5, state.players[0].pos.y * gridRatio - 3, 2, 2);
    }
  // P1 Inventory
  contex.fillStyle = "#66ffff";
  for (let i = 0; i < state.players[0].inventorySpace; i++) {
    contex.fillRect(state.players[0].pos.x * gridRatio + 36, state.players[0].pos.y * gridRatio + 5 * i, 2, 2);
  }
  // P1 Reload
  contex.fillStyle = "#ffff00";
  if (state.players[0].reload == false)
    contex.fillRect(state.players[0].pos.x * gridRatio - 3, state.players[0].pos.y * gridRatio + 3, 2, 4);

  // P2
  contex.fillStyle = PLAYER_2_COLOR;
  contex.fillRect(state.players[1].pos.x * gridRatio, state.players[1].pos.y * gridRatio, playerSize, playerSize);
  // P2 Lives
  if (state.players[1].lives > 0)
    for (let i = 0; i < state.players[1].lives; i++) {
      contex.fillRect(state.players[1].pos.x * gridRatio + i * 5, state.players[1].pos.y * gridRatio - 3, 2, 2);
    }
  // P2 Inventory
  contex.fillStyle = "#66ffff";
  for (let i = 0; i < state.players[1].inventorySpace; i++) {
    contex.fillRect(state.players[1].pos.x * gridRatio + 36, state.players[1].pos.y * gridRatio + 5 * i, 2, 2);
  }
  // P2 Reload
  contex.fillStyle = "#ffff00";
  if (state.players[1].reload == false)
    contex.fillRect(state.players[1].pos.x * gridRatio + 3, state.players[1].pos.y * gridRatio + 3, 6, 2);
  // -------

  // INDICATE PLAYERS WITH FLASHES
  contex.fillStyle = FLASH_COLOR;
  if (playerNumber == 1 && flash < 2) {
    setTimeout(() => {
      contex.fillRect(state.players[0].pos.x * gridRatio, state.players[0].pos.y * gridRatio, playerSize, playerSize);
    }, 150);
    flash++;
  } else if (playerNumber == 2 && flash < 2) {
    setTimeout(() => {
      contex.fillRect(state.players[0].pos.x * gridRatio, state.players[0].pos.y * gridRatio, playerSize, playerSize);
    }, 150);
    flash++;
  }
}

/* ### [HandleGameOver]: There are multiple game overs before the game finishes (Called from startGameInterval, in server) ### */
function handleGameOver(data) {
  if (!gameActive) return;
  data = JSON.parse(data);

  scoreboard.querySelector(".P1").innerText = " " + data.score.P1 + " Pts.";
  scoreboard.querySelector(".P2").innerText = " " + data.score.P2 + " Pts.";
  postGameCard.style.display = "block";

  if (Math.max(data.score.P1, data.score.P2) >= winningScore) {
    gameActive = false;
    if (data.score.P1 == data.score.P2) {
      postGameCardText.innerText = "The environment won this time around!";
    } else if (data.score.P1 > data.score.P2) {
      if (playerNumber == 1) postGameCardText.innerText = "Congratulations, you won this war!";
      if (playerNumber == 2) postGameCardText.innerText = "You are defeated!";
    } else if (data.score.P2 > data.score.P1) {
      if (playerNumber == 1) postGameCardText.innerText = "You are defeated!";
      if (playerNumber == 2) postGameCardText.innerText = "Congratulations, you won this war!";
    }
    postGameRestartButton.style.display = "block";
    playerNumber = null;
    return;
  } else if (data.winner === -1) {
    postGameCardText.innerText = "ROUND TIED :o";
  } else if (data.winner === playerNumber) {
    postGameCardText.innerText = "ROUND WON ;)";
  } else {
    if (playerNumber !== null) postGameCardText.innerText = "ROUND LOST :(";
  }
  startCountdown();
}

/* ## [StartCountdown]: Until next round ## */
function startCountdown() {
  let counter = 5;
  postGameCountdown.innerText = counter;
  let countdownTimer = setInterval(() => {
    counter--;
    postGameCountdown.innerText = counter;
    if (counter == -1) {
      clearInterval(countdownTimer);
      postGameCard.style.display = "none";
      postGameCardText.innerText = "";
      postGameCountdown.innerText = "";
    }
  }, 1000);
}

// Keyboard events -----------------------------------------------

/* ### [Keypressed]: Called from eventListener (Left, Up, Right, Down, G, H). ### */
function keypressed(event) {
  switch (event.keyCode) {
    case 37:
      socket.emit("keypressed", 37);
      break;
    case 38:
      socket.emit("keypressed", 38);
      break;
    case 39:
      socket.emit("keypressed", 39);
      break;
    case 40:
      socket.emit("keypressed", 40);
      break;
    case 71:
      socket.emit("keypressed", 71);
      break;
    case 72:
      socket.emit("keypressed", 72);
      break;
  }
}

/* ### [Keyreleased]: Called from eventListener. ### */
function keyreleased(event) {
  const states = {
    left: event.code == "ArrowLeft",
    up: event.code == "ArrowUp",
    right: event.code == "ArrowRight",
    down: event.code == "ArrowDown",
  };
  switch (true) {
    case states.left:
      socket.emit("keyreleased", 37);
      break;
    case states.up:
      socket.emit("keyreleased", 38);
      break;
    case states.right:
      socket.emit("keyreleased", 39);
      break;
    case states.down:
      socket.emit("keyreleased", 40);
      break;
  }
}

/* ### [DeltaTimer]: used to remove delay that exists in keydown [100-230] ### */
function DeltaTimer(render, interval) {
  var timeout;
  var lastTime;

  this.start = start;
  this.stop = stop;

  function start() {
    timeout = setTimeout(loop, 0);
    lastTime = Date.now();
    return lastTime;
  }

  function stop() {
    clearTimeout(timeout);
    return lastTime;
  }

  function loop() {
    var thisTime = Date.now();
    var deltaTime = thisTime - lastTime;
    var delay = Math.max(interval - deltaTime, 0);
    timeout = setTimeout(loop, delay);
    lastTime = thisTime + delay;
    render(thisTime);
  }
}

/* ### [Loops with 50 ms interval]: ### */
(function (interval) {
  var keyboard = {};

  window.addEventListener("keyup", keyup, false);
  window.addEventListener("keydown", keydown, false);

  function keyup(event) {
    keyboard[event.keyCode].pressed = false;
  }

  function keydown(event) {
    var keyCode = event.keyCode;
    var key = keyboard[keyCode];

    if (key) {
      if (!key.start) key.start = key.timer.start();
      key.pressed = true;
    } else {
      var timer = new DeltaTimer(function (time) {
        if (key.pressed) {
          var event = document.createEvent("Event");
          event.initEvent("keypressed", true, true);
          event.time = time - key.start;
          event.keyCode = keyCode;
          window.dispatchEvent(event);
        } else {
          key.start = 0;
          timer.stop();
        }
      }, interval);

      key = keyboard[keyCode] = {
        pressed: true,
        timer: timer,
      };

      key.start = timer.start();
    }
  }
})(50);

// -----------------------------------------
