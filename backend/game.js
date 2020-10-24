/* ### Import constants ### */
const { CANVAS_WIDTH, GRID_SIZE, GRID_RATIO, PLAYER_SIZE, WALL_SIZE } = require("./constants");
const { Rect, Point } = require("./rectangleModule");

/* ### Make functions accessable from other files ### */
module.exports = {
  initGame,
  gameLoop,
  keyPressed,
  keyReleased,
};

gameState = {};

/* ### [InitGame]: Invoked by client via server ### */
function initGame(scores) {
  const state = createGameState(scores);
  randomFood(state);
  return state;
}

/* ### [CreateGameState]: "state" is passed along to server and client. ### */
function createGameState(scoreInput) {
  const wallDim = 4;

  state = {
    players: [
      {
        id: 1,
        fireRateDelay: 100,
        pos: {
          x: 0,
          y: 0,
        },
        directionPreference: [],
        dxdy: {
          x: 0,
          y: 0,
        },
        dir: "UP",
        lives: 0,
        playersize: WALL_SIZE,
      },
      {
        id: 2,
        fireRateDelay: 100,
        pos: {
          x: GRID_SIZE - wallDim,
          y: GRID_SIZE - wallDim,
        },
        directionPreference: [],
        dxdy: {
          x: 0,
          y: 0,
        },
        dir: "UP",
        lives: 0,
        playersize: WALL_SIZE,
      },
    ],
    walls: {
      wallsize: WALL_SIZE,
      solid: [],
      movable: [],
    },
    food: {},
    scores: { P1: scoreInput[0], P2: scoreInput[1] },
    gridsize: GRID_SIZE,
  };

  initializePlayingField(state, wallDim);

  return state;
}

// ---------------------------------------------

/* ### [GameLoop]: Loops until game over. ### */
function gameLoop(state) {
  if (!state) {
    return;
  }
  gameState = state;

  const playerOne = state.players[0];
  const player1Rect = new Rect(playerOne.pos.x, playerOne.pos.y, 4, 4);
  const playerTwo = state.players[1];
  const player2Rect = new Rect(playerTwo.pos.x, playerTwo.pos.y, 4, 4);

  // Move P1
  if (!collision(playerOne, false)) {
    playerOne.pos.x += playerOne.dxdy.x;
    playerOne.pos.y += playerOne.dxdy.y;
  }

  // Move P2
  if (!collision(playerTwo, false)) {
    playerTwo.pos.x += playerTwo.dxdy.x;
    playerTwo.pos.y += playerTwo.dxdy.y;
  }

  /* [FOOD EATEN] */
  if (state.food !== null) {
    const food = new Rect(state.food.x, state.food.y, 2, 2);
    if (food.intersects(player1Rect)) {
      if (state.players[0].lives < 3) state.players[0].lives++;
      state.food = {};
      setTimeout(() => {
        randomFood(state);
      }, 10000);
    } else if (food.intersects(player2Rect)) {
      if (state.players[1].lives < 3) state.players[1].lives++;
      state.food = {};
      setTimeout(() => {
        randomFood(state);
      }, 10000);
    }
  }

  /* ## IMPORTANT for P1 ## */
  if (playerOne.dxdy.x || playerOne.dxdy.y) {
    // ## !IDEA: Make it so that gold can be collected, and upgrade some feature in-game. ##
    //
    // ## Hit by bullet ##
    /* for (let bullet of playerTwo.bullets) {
      if (bullet.x === playerOne.pos.x && bullet.y === playerOne.pos.y) {
        playerOne.lives--;
        // if (lievs == 0) return 2;
      }
    } */
  }

  /* ## IMPORTANT for P2 ## */
  if (playerTwo.dxdy.x || playerTwo.dxdy.y) {
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
    x: Math.floor(GRID_SIZE / 4 + Math.random() * (GRID_SIZE / 2)),
    y: Math.floor(GRID_SIZE / 4 + Math.random() * (GRID_SIZE / 2)),
  };
  state.food = food;
}

function keyPressed(keyCode, player) {
  if (!player.directionPreference.includes(keyCode)) {
    player.directionPreference.push(keyCode);
  }
  const dxdy = calculateDirection(player);
  player.dxdy.x = dxdy[0];
  player.dxdy.y = dxdy[1];
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
  const dxdy = calculateDirection(player);
  player.dxdy.x = dxdy[0];
  player.dxdy.y = dxdy[1];
}

function calculateDirection(player) {
  let dx = 0;
  let dy = 0;
  if (player.directionPreference.length > 0) {
    switch (player.directionPreference[player.directionPreference.length - 1]) {
      case 37: {
        dx = -1;
        player.dir = "LEFT";
        return [dx, dy];
      }
      case 38: {
        dy = -1;
        player.dir = "UP";
        return [dx, dy];
      }
      case 39: {
        dx = 1;
        player.dir = "RIGHT";
        return [dx, dy];
      }
      case 40: {
        dy = 1;
        player.dir = "DOWN";
        return [dx, dy];
      }
    }
  }
  return [0, 0];
}

function collision(player, mustBeMovable) {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  // Check one step ahead
  if (player.dir == "LEFT") {
    x1 = player.pos.x - 1;
    y1 = player.pos.y;
    x2 = player.pos.x - 1;
    y2 = player.pos.y;
  } else if (player.dir == "UP") {
    x1 = player.pos.x;
    y1 = player.pos.y - 1;
    x2 = player.pos.x;
    y2 = player.pos.y - 1;
  } else if (player.dir == "RIGHT") {
    x1 = player.pos.x + 1;
    y1 = player.pos.y;
    x2 = player.pos.x + 1;
    y2 = player.pos.y;
  } else if (player.dir == "DOWN") {
    x1 = player.pos.x;
    y1 = player.pos.y + 1;
    x2 = player.pos.x;
    y2 = player.pos.y + 1;
  }

  const playerSize = 4;
  const wallSize = 4;
  let playerRect = new Rect(x1, y1, playerSize, playerSize);
  const border1 = new Rect(GRID_SIZE, 0, wallSize, GRID_SIZE); // right |
  const border2 = new Rect(-4, 0, wallSize, GRID_SIZE); // left |
  const border3 = new Rect(-4, -4, GRID_SIZE + 4, wallSize); // upper ---
  const border4 = new Rect(-4, GRID_SIZE, GRID_SIZE + 4, wallSize); // lower ---
  if (
    playerRect.intersects(border1) ||
    playerRect.intersects(border2) ||
    playerRect.intersects(border3) ||
    playerRect.intersects(border4)
  ) {
    return true;
  }

  let wx1, wy1;
  let wall, wallRect;
  for (let i = 0; i < gameState.walls.solid.length; i++) {
    wall = gameState.walls.solid[i];
    wx1 = wall.x;
    wy1 = wall.y;
    wallRect = new Rect(wx1, wy1, wallSize, wallSize);

    if (wallRect.intersects(playerRect)) {
      /* Collision with movable obstacles. */
      /* if (mustBeMovable) {
        if (obstacles.get(i).movable()) {
          obstacles.remove(i);
          return true;
        }
      } else { */
      /* Collision with solid obstacles. */
      return true;
      //}
    }
  }
  return false;
}

function initializePlayingField(state, wallDim) {
  // FROM LEFT TO RIGHT. TOP TO BOTTOM.

  // 4 is wall size
  for (let i = 16; i < 36; i += wallDim) {
    state.walls.solid.push({ x: 10, y: i });
  }

  for (let i = 56; i < 76; i += wallDim) {
    state.walls.solid.push({ x: 10, y: i });
  }

  for (let i = 10; i < 32; i += wallDim) {
    state.walls.solid.push({ x: i, y: 87 });
  }

  for (let i = 26; i < 34; i += wallDim) {
    state.walls.solid.push({ x: i, y: 8 });
  }

  for (let i = 24; i < 52; i += wallDim) {
    state.walls.solid.push({ x: 26, y: i });
  }

  for (let i = 0; i < 8; i += wallDim) {
    state.walls.solid.push({ x: 64, y: i });
  }

  for (let i = 60; i < 80; i += wallDim) {
    state.walls.solid.push({ x: i, y: 87 });
  }

  for (let i = 40; i < 64; i += wallDim) {
    state.walls.solid.push({ x: 71, y: i });
  }

  for (let i = 20; i < 36; i += wallDim) {
    state.walls.solid.push({ x: 87, y: i });
  }

  for (let i = 52; i < 72; i += wallDim) {
    state.walls.solid.push({ x: 87, y: i });
  }
}

/* function overlap(Point l1, Point r1, Point l2, Point r2) { 
  // If one rectangle is on left side of other  
  if (l1.x >= r2.x || l2.x >= r1.x) { 
      return false; 
  } 

  // If one rectangle is above other  
  if (l1.y <= r2.y || l2.y <= r1.y) { 
      return false; 
  } 

  return true; 
}  */

//
/* spriteName = new Sprite(scene, imgFile, width, height); */
