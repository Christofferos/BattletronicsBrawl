/*//
 -Author: Kristopher Werlinder, 2020.
//*/

/* [DEVELOPMENT]: LOCAL */
// const socket = io("http://localhost:3000");

/* [PUBLIC]: ONLINE (socket, listens for messages from the server) */
const socket = io("https://boiling-springs-78440.herokuapp.com/");

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
const BG_COLOR = "black"; // #0e1d34
const PLAYER_1_COLOR = "red"; //c2c2c2
const PLAYER_2_COLOR = "green";
const FLASH_COLOR = "white";
const POWER_UP_COLOR = "#e66916";
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
  initializeGameWindow(); //
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
  // document or window (what is the difference?)
  window.addEventListener("keypressed", (e) => keypressed(e), false);
  window.addEventListener("keyup", (e) => keyreleased(e), false);
  //
  gameActive = true;
}

// -----------------------------------------------

/* ### DeltaTimer: used to remove delay that exists in keydown [100-230] ### */
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

// Using DeltaTimer...
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
/* ##### */

/* ## event.keyCode is depricated - can lead to issues in the future. ## */
function keypressed(event) {
  switch (event.keyCode) {
    case 37:
      // console.log("LEFT");
      socket.emit("keypressed", 37);
      break;
    case 38:
      // console.log("UP");
      socket.emit("keypressed", 38);
      break;
    case 39:
      // console.log("RIGHT");
      socket.emit("keypressed", 39);
      break;
    case 40:
      // console.log("DOWN");
      socket.emit("keypressed", 40);
      break;
  }
}

function keyreleased(event) {
  const states = {
    left: event.code == "ArrowLeft",
    up: event.code == "ArrowUp",
    right: event.code == "ArrowRight",
    down: event.code == "ArrowDown",
  };
  switch (true) {
    case states.left:
      // console.log("LEFT");
      socket.emit("keyreleased", 37);
      break;
    case states.up:
      // console.log("UP");
      socket.emit("keyreleased", 38);
      break;
    case states.right:
      // console.log("RIGHT");
      socket.emit("keyreleased", 39);
      break;
    case states.down:
      // console.log("DOWN");
      socket.emit("keyreleased", 40);
      break;
  }
}

// -----------------------------------------

/* ## PaintGame: Draw game window ## */
function paintGame(state) {
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const minAnimationSize = canvas.width / gridsize;
  const playerSize = minAnimationSize * 4;

  contex.fillStyle = POWER_UP_COLOR;
  contex.fillRect(food.x * minAnimationSize, food.y * minAnimationSize, minAnimationSize, minAnimationSize);

  paintPlayer(state.players[0], minAnimationSize, playerSize, PLAYER_1_COLOR);
  // Add a flash, the first round to indicate which snake this client controls.
  if (playerNumber == 1 && flash < 2) {
    setTimeout(() => {
      paintPlayer(state.players[0], minAnimationSize, playerSize, FLASH_COLOR);
    }, 150);
    flash++;
  }
  paintPlayer(state.players[1], minAnimationSize, playerSize, PLAYER_2_COLOR);
  // Add a flash.
  if (playerNumber == 2 && flash < 2) {
    setTimeout(() => {
      paintPlayer(state.players[1], minAnimationSize, playerSize, FLASH_COLOR);
    }, 150);
    flash++;
  }
}

/* ## PaintPlayer: ## */
function paintPlayer(playerState, minAnimationSize, size, color) {
  contex.fillStyle = color;
  contex.fillRect(playerState.pos.x * minAnimationSize, playerState.pos.y * minAnimationSize, size, size);
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
  // scoreboard.querySelector(".P1-snake").innerText = "(" + gameState.players[0].lives + "/15)";
  // scoreboard.querySelector(".P2-snake").innerText = "(" + gameState.players[1].lives + "/15)";

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
      postGameCardText.innerText = "The environment won this time around!";
    } else if (data.score.P1 > data.score.P2) {
      // scoreboard.querySelector(".P1").style.color = "green";
      if (playerNumber == 1) postGameCardText.innerText = "Congratulations, you won this war!";
      if (playerNumber == 2) postGameCardText.innerText = "You are defeated!";
    } else if (data.score.P2 > data.score.P1) {
      // scoreboard.querySelector(".P2").style.color = "green";
      if (playerNumber == 1) postGameCardText.innerText = "You are defeated!";
      if (playerNumber == 2) postGameCardText.innerText = "Congratulations, you won this war!";
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
  document.getElementById("card").style.display = "block";
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
