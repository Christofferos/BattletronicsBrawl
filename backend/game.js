/* ### Import constants ### */
const { GRID_SIZE } = require("./constants");

/* ### Make functions accessable from other files ### */
module.exports = {
  initGame,
  gameLoop,
  keyPressed,
  keyReleased,
};

/* ### [InitGame]: Invoked by client via server ### */
function initGame(scores) {
  const state = createGameState(scores);
  randomFood(state);
  return state;
}

/* ### [CreateGameState]: "state" is passed along to server and client. ### */
function createGameState(scoreInput) {
  return {
    players: [
      {
        id: 1,
        fireRateDelay: 100,
        pos: {
          x: 1,
          y: 1,
        },
        directionPreference: [],
        dir: {
          x: 0,
          y: 0,
        },
        lives: 0,
        //size: ,
      },
      {
        id: 2,
        fireRateDelay: 100,
        pos: {
          x: 23,
          y: 23,
        },
        directionPreference: [],
        dir: {
          x: 0,
          y: 0,
        },
        lives: 0,
        //size: ,
      },
    ],
    food: {},
    scores: { P1: scoreInput[0], P2: scoreInput[1] },
    gridsize: GRID_SIZE,
  };
}

// ---------------------------------------------

/* ### [GameLoop]: Loops until game over. ### */
function gameLoop(state) {
  if (!state) {
    return;
  }
  const playerOne = state.players[0];
  const playerTwo = state.players[1];

  // Move P1
  playerOne.pos.x += playerOne.dir.x;
  playerOne.pos.y += playerOne.dir.y;

  // Move P2
  playerTwo.pos.x += playerTwo.dir.x;
  playerTwo.pos.y += playerTwo.dir.y;

  /* [OUT OF BOUNDS] */
  if (
    playerOne.pos.x < 0 ||
    playerOne.pos.x > GRID_SIZE - 1 ||
    playerOne.pos.y < 0 ||
    playerOne.pos.y > GRID_SIZE - 1
  ) {
    return 2;
  }

  if (
    playerTwo.pos.x < 0 ||
    playerTwo.pos.x > GRID_SIZE - 1 ||
    playerTwo.pos.y < 0 ||
    playerTwo.pos.y > GRID_SIZE - 1
  ) {
    return 1;
  }

  /* [FOOD EATEN] */
  if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
    // if () playerOne.lives++;
    playerOne.pos.x += playerOne.dir.x;
    playerOne.pos.y += playerOne.dir.y;
    state.players[0].lives++;
    randomFood(state);
  }
  if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    // if () playerTwo.lives++;
    playerTwo.pos.x += playerTwo.dir.x;
    playerTwo.pos.y += playerTwo.dir.y;
    state.players[1].lives++;
    randomFood(state);
  }

  /* ## IMPORTANT for P1 ## */
  if (playerOne.dir.x || playerOne.dir.y) {
    if (playerOne.lives >= 15) {
      return 1; // ## Make it so that gold can be collected, and upgrade some feature in-game. ##
    }
    // ## Hit by bullet ##
    /* for (let bullet of playerTwo.bullets) {
      if (bullet.x === playerOne.pos.x && bullet.y === playerOne.pos.y) {
        playerOne.lives--;
        // if (lievs == 0) return 2;
      }
    } */
  }

  /* ## IMPORTANT for P2 ## */
  if (playerTwo.dir.x || playerTwo.dir.y) {
    if (playerTwo.lives >= 15) {
      return 2;
    }
    // ## Hit by bullet ##
    /* for (let bullet of playerTwo.bullets) {
      if (bullet.x === playerOne.pos.x && bullet.y === playerOne.pos.y) {
        playerOne.lives--;
        // if (lievs == 0) return 2;
      }
    } */
  }

  /* [NO SPECIAL INTERACTION FOUND] */
  return false;
}

// ---------------------------------------------

function randomFood(state) {
  food = {
    x: Math.floor(1 + Math.random() * (GRID_SIZE - 2)),
    y: Math.floor(1 + Math.random() * (GRID_SIZE - 2)),
  };
  if (
    (state.players[0].pos.x === food.x && state.players[0].pos.y === food.y) ||
    (state.players[1].pos.x === food.x && state.players[1].pos.y === food.y)
  ) {
    return randomFood(state);
  }
  state.food = food;
}

function keyPressed(keyCode, player) {
  if (!player.directionPreference.includes(keyCode)) {
    player.directionPreference.push(keyCode);
  }
  const dir = calculateDirection(player);
  player.dir.x = dir[0];
  player.dir.y = dir[1];
}

function keyReleased(keyCode, player) {
  if (player.directionPreference.includes(keyCode)) {
    const newDirectionPreference = [];
    const searchValue = keyCode;
    for (let i = 0; i < player.directionPreference.length; i++) {
      if (player.directionPreference[i] !== searchValue) {
        newDirectionPreference.push(player.directionPreference[i]);
      }
    }
    player.directionPreference = newDirectionPreference;
  }
  const dir = calculateDirection(player);
  player.dir.x = dir[0];
  player.dir.y = dir[1];
}

function calculateDirection(player) {
  let dx = 0;
  let dy = 0;
  if (player.directionPreference.length > 0) {
    const dir = player.directionPreference[player.directionPreference.length - 1];
    switch (dir) {
      // Left
      case 37: {
        dx = -1;
        return [dx, dy];
      }
      // Up
      case 38: {
        dy = -1;
        return [dx, dy];
      }
      // Right
      case 39: {
        dx = 1;
        return [dx, dy];
      }
      // Down
      case 40: {
        dy = 1;
        return [dx, dy];
      }
    }
  }
  return [0, 0];
}

/* Pair dxdy = player1.calculateDirection();
if (!collisionDetection.collision(1, false)) {
    player1.move(dxdy.dx, dxdy.dy);
} */
