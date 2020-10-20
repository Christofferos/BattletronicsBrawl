/*//
 -Author: Kristopher Werlinder, 2020.
//*/

/* [DEVELOPMENT]: LOCAL */
// const socket = io("http://localhost:3000");

/* [PUBLIC]: ONLINE (socket, listens for messages from the server) */
const socket = io("https://warm-harbor-48465.herokuapp.com/");

/* [MESSAGES FROM SERVER]: Client handles incoming messages. */
socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);

/* ## Frontend Elements ## */
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

/* ## Event Listeners ## */
newGameButton.addEventListener("click", newGame);
joinGameButton.addEventListener("click", joinGame);

/* # Game Variables # */
const BG_COLOR = "#231f20";
const PLAYER_1_COLOR = "green"; //c2c2c2
const PLAYER_2_COLOR = "red";
const FLASH_COLOR = "white";
const FOOD_COLOR = "#e66916";
let canvas, contex;
let playerNumber;
let gameActive = false;
let flash = 0;
const winningScore = 5;

/* ## NewGame: Tell server that a game is initialized ## */
function newGame() {
  socket.emit("newGame");
  initializeGameWindow();
}

/* ## JoinGame: Give server the code to connect players ## */
function joinGame() {
  let code = gameCodeInput.value;
  if (code != null) if (code.charAt(0) == " ") code = code.slice(1, code.length);
  socket.emit("joinGame", code);
  initializeGameWindow();
}

/* ## HandleGameCode: ## */
function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

/* ## HandleUnknownCode: ## */
function handleUnknownCode() {
  reset();
  alert("Unknown Game Code");
}

/* ## HandleTooManyPlayers: ## */
function handleTooManyPlayers() {
  reset();
  alert("This game is already in progress");
}

/* ## InitializeGameWindow: Display a game window to the user ## */
function initializeGameWindow() {
  initialScreen.style.display = "none";
  postGameRestartButton.style.display = "none";
  document.getElementById("card").style.display = "none";
  gameScreen.style.display = "block";
  //
  canvas = document.getElementById("canvas");
  contex = canvas.getContext("2d");
  canvas.width = canvas.height = 850;
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);
  //
  document.addEventListener("keydown", keydown);
  // Phone
  document.addEventListener("touchstart", touchstart, false);
  document.addEventListener("touchmove", touchmove, false);
  document.addEventListener("touchend", touchend, false);
  //
  gameActive = true;
}

/* ## Keydown: Tell server what keys are pressed by the user ## */
function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

/* ## PaintGame: Draw game window ## */
function paintGame(state) {
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  contex.fillStyle = FOOD_COLOR;
  contex.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, PLAYER_1_COLOR);
  // Add a flash, the first round to indicate which snake this client controls.
  if (playerNumber == 1 && flash < 2) {
    setTimeout(() => {
      paintPlayer(state.players[0], size, FLASH_COLOR);
    }, 150);
    flash++;
  }
  paintPlayer(state.players[1], size, PLAYER_2_COLOR);
  // Add a flash.
  if (playerNumber == 2 && flash < 2) {
    setTimeout(() => {
      paintPlayer(state.players[1], size, FLASH_COLOR);
    }, 150);
    flash++;
  }
}

/* ## PaintPlayer: ## */
function paintPlayer(playerState, size, color) {
  const snake = playerState.snake;
  contex.fillStyle = color;

  for (let cell of snake) {
    contex.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

/* ## HandleInit: ## */
function handleInit(number) {
  playerNumber = number;
}

/* ## HandleGameState: ## */
function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);

  // Update the number of food pieces each player have eaten.
  scoreboard.querySelector(".P1-snake").innerText = "(" + gameState.players[0].foodCollected + "/15)";
  scoreboard.querySelector(".P2-snake").innerText = "(" + gameState.players[1].foodCollected + "/15)";

  requestAnimationFrame(() => paintGame(gameState));
}

/* ## HandleGameOver: ## */
function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  scoreboard.querySelector(".P1").innerText = "P1: " + data.score.P1;
  scoreboard.querySelector(".P2").innerText = "P2: " + data.score.P2;
  postGameCard.style.display = "block";

  // Close the game
  if (Math.max(data.score.P1, data.score.P2) >= winningScore) {
    gameActive = false;
    if (data.score.P1 == data.score.P2) {
      postGameCardText.innerText = "YOU TIED 1st PLACE!";
    } else if (data.score.P1 > data.score.P2) {
      scoreboard.querySelector(".P1").style.color = "green";
      if (playerNumber == 1) postGameCardText.innerText = "You won: You are the superior snake duelist.";
      if (playerNumber == 2) postGameCardText.innerText = "You lost: Better luck next time.";
    } else if (data.score.P2 > data.score.P1) {
      scoreboard.querySelector(".P2").style.color = "green";
      if (playerNumber == 1) postGameCardText.innerText = "You lost: Better luck next time.";
      if (playerNumber == 2) postGameCardText.innerText = "You won: You are the superior snake duelist.";
    }
    postGameRestartButton.style.display = "block";
    playerNumber = null;
    return;
  }

  // Display round result
  if (data.winner === -1) {
    postGameCardText.innerText = "ROUND TIED :o";
  } else if (data.winner === playerNumber) {
    postGameCardText.innerText = "ROUND WON ;)";
  } else if (playerNumber !== null) {
    postGameCardText.innerText = "ROUND LOST :(";
  }
  startCountdown();
}

/* ## Reset: ## */
function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}

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

function reloadPage() {
  reset();
  location.reload();
}

/* ## MOBILE ## */
let swipedir,
  startX,
  startY,
  distX,
  distY,
  threshold = 25, //required min distance traveled to be considered swipe
  restraint = 100, // maximum distance allowed at the same time in perpendicular direction
  allowedTime = 300, // maximum time allowed to travel that distance
  elapsedTime,
  startTime;

let handleswipe = (swipedir) => {
  if (swipedir == "up" || swipedir == "down" || swipedir == "left" || swipedir == "right") {
    socket.emit("phoneSwipe", swipedir);
  }
};

function touchstart(e) {
  let touchobj = e.changedTouches[0];
  swipedir = "none";
  dist = 0;
  startX = touchobj.pageX;
  startY = touchobj.pageY;
  startTime = new Date().getTime(); // record time when finger first makes contact with surface
  e.preventDefault();
}

function touchmove(e) {
  e.preventDefault();
}

function touchend(e) {
  let touchobj = e.changedTouches[0];
  distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
  distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
  elapsedTime = new Date().getTime() - startTime;
  if (elapsedTime <= allowedTime) {
    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
      swipedir = distX < 0 ? "left" : "right"; // if dist traveled is negative, it indicates a swipe to the left
    } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
      swipedir = distY < 0 ? "up" : "down"; // if dist traveled is negative, it indicates a swipe upwards
    }
  }
  handleswipe(swipedir);
  e.preventDefault();
}
