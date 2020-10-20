const { GRID_SIZE } = require("./constants");

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
  getUpdatedVelocitySwipe,
};

function initGame(scores) {
  const state = createGameState(scores);
  randomFood(state);
  return state;
}

function createGameState(scoreInput) {
  return {
    players: [
      {
        id: 1,
        inputDelay: false,
        pos: {
          x: 3,
          y: 10,
        },
        vel: {
          x: 0,
          y: 0,
        },
        snake: [
          { x: -2, y: 10 },
          { x: -1, y: 10 },
          { x: 0, y: 10 },
          { x: 1, y: 10 },
          { x: 2, y: 10 },
          { x: 3, y: 10 },
        ],
        foodCollected: 0,
      },
      {
        id: 2,
        inputDelay: false,
        pos: {
          x: 21,
          y: 10,
        },
        vel: {
          x: 0,
          y: 0,
        },
        snake: [
          { x: 26, y: 10 },
          { x: 25, y: 10 },
          { x: 24, y: 10 },
          { x: 23, y: 10 },
          { x: 22, y: 10 },
          { x: 21, y: 10 },
        ],
        foodCollected: 0,
      },
    ],
    food: {},
    scores: { P1: scoreInput[0], P2: scoreInput[1] },
    gridsize: GRID_SIZE,
  };
}

function gameLoop(state) {
  if (!state) {
    return;
  }

  const playerOne = state.players[0];
  const playerTwo = state.players[1];

  playerOne.pos.x += playerOne.vel.x;
  playerOne.pos.y += playerOne.vel.y;

  playerTwo.pos.x += playerTwo.vel.x;
  playerTwo.pos.y += playerTwo.vel.y;

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
    playerOne.snake.push({ ...playerOne.pos });
    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;
    state.players[0].foodCollected++;
    randomFood(state);
  }
  if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.pos.x += playerTwo.vel.x;
    playerTwo.pos.y += playerTwo.vel.y;
    state.players[1].foodCollected++;
    randomFood(state);
  }

  /* ## IMPORTANT for P1 ## */
  if (playerOne.vel.x || playerOne.vel.y) {
    if (playerOne.foodCollected >= 15) {
      return 1;
    }
    // MOVE INTO TAIL
    for (let cell of playerOne.snake) {
      if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        return 2;
      }
    }
    for (let i = 0; i < playerTwo.snake.length; i++) {
      let cell = playerTwo.snake[i];
      const headIndex = playerTwo.snake.length - 1;
      if (i !== headIndex) {
        if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
          return 2;
        }
      } else if (i == headIndex) {
        if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
          return -1;
        }
      }
    }
    // MOVE PLAYER1
    playerOne.snake.push({ ...playerOne.pos });
    playerOne.snake.shift();
  }

  /* ## IMPORTANT for P2 ## */
  if (playerTwo.vel.x || playerTwo.vel.y) {
    if (playerTwo.foodCollected >= 15) {
      return 2;
    }
    // MOVE INTO TAIL
    for (let cell of playerTwo.snake) {
      if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
        return 1;
      }
    }
    for (let i = 0; i < playerOne.snake.length; i++) {
      let cell = playerOne.snake[i];
      const headIndex = playerOne.snake.length - 1;
      if (i !== headIndex) {
        if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
          return 1;
        }
      } else if (i == headIndex) {
        if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
          return -1;
        }
      }
    }
    // MOVE PLAYER2
    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.snake.shift();
  }

  /* [NO SPECIAL INTERACTION FOUND] */
  return false;
}

function randomFood(state) {
  food = {
    x: Math.floor(1 + Math.random() * (GRID_SIZE - 2)),
    y: Math.floor(1 + Math.random() * (GRID_SIZE - 2)),
  };

  for (let cell of state.players[0].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }

  for (let cell of state.players[1].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }
  state.food = food;
}

function getUpdatedVelocity(keyCode, player) {
  switch (keyCode) {
    case 37: {
      // Left
      if (!(player.vel.x > 0)) {
        if (player.vel.x == 0 && player.vel.y == 0 && player.id == 1) return -1; // Disallow left on start.
        return { x: -1, y: 0 };
      } else return -1;
    }
    case 38: {
      // Down
      if (!(player.vel.y > 0)) {
        return { x: 0, y: -1 };
      } else return -1;
    }
    case 39: {
      // Right
      if (!(player.vel.x < 0)) {
        if (player.vel.x == 0 && player.vel.y == 0 && player.id == 2) return -1; // Disallow right on start.
        return { x: 1, y: 0 };
      } else return -1;
    }
    case 40: {
      // Up
      if (!(player.vel.y < 0)) {
        return { x: 0, y: 1 };
      } else return -1;
    }
    default: {
      return -1;
    }
  }
}

function getUpdatedVelocitySwipe(swipeDir, player) {
  switch (swipeDir) {
    case "left": {
      if (!(player.vel.x > 0)) {
        if (player.vel.x == 0 && player.vel.y == 0 && player.id == 1) return -1; // Disallow left on start.
        return { x: -1, y: 0 };
      } else return -1;
    }
    case "up": {
      if (!(player.vel.y > 0)) {
        return { x: 0, y: -1 };
      } else return -1;
    }
    case "right": {
      if (!(player.vel.x < 0)) {
        if (player.vel.x == 0 && player.vel.y == 0 && player.id == 2) return -1; // Disallow right on start.
        return { x: 1, y: 0 };
      } else return -1;
    }
    case "down": {
      if (!(player.vel.y < 0)) {
        return { x: 0, y: 1 };
      } else return -1;
    }
    default: {
      return -1;
    }
  }
}
