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
          x: 1,
          y: 1,
        },
        directionPreference: [],
        dxdy: {
          x: 0,
          y: 0,
        },
        dir: "UP",
        bullets: [],
        reload: false,
        lives: 3,
        inventorySpace: 3,
        inventoryAction: false,
        inventoryCooldown: false,
        playersize: WALL_SIZE,
      },
      {
        id: 2,
        fireRateDelay: 100,
        pos: {
          x: GRID_SIZE - wallDim - 1,
          y: GRID_SIZE - wallDim - 1,
        },
        directionPreference: [],
        dxdy: {
          x: 0,
          y: 0,
        },
        dir: "UP",
        bullets: [],
        reload: false,
        lives: 3,
        inventorySpace: 3,
        inventoryCooldown: false,
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

  updateBullets(state, playerOne, playerTwo, player1Rect, player2Rect);

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
  if (playerOne.lives <= 0) return 2;
  // ## !IDEA: Make it so that gold can be collected, and upgrade some feature in-game. ##

  /* ## IMPORTANT for P2 ## */
  if (playerTwo.lives <= 0) return 1;

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

function updateBullets(state, p1, p2, p1Rect, p2Rect) {
  // Move bullets
  p1.bullets.forEach((bullet) => {
    if (bullet.dir == "UP") {
      bullet.y -= 2;
    } else if (bullet.dir == "DOWN") {
      bullet.y += 2;
    } else if (bullet.dir == "LEFT") {
      bullet.x -= 2;
    } else if (bullet.dir == "RIGHT") {
      bullet.x += 2;
    }
  });
  p2.bullets.forEach((bullet) => {
    if (bullet.dir == "UP") {
      bullet.y -= 2;
    } else if (bullet.dir == "DOWN") {
      bullet.y += 2;
    } else if (bullet.dir == "LEFT") {
      bullet.x -= 2;
    } else if (bullet.dir == "RIGHT") {
      bullet.x += 2;
    }
  });
  // Check for collision
  for (let i = 0; i < p1.bullets.length; i++) {
    const bulletRect = new Rect(p1.bullets[i].x, p1.bullets[i].y, 2, 2);
    if (p2Rect.intersects(bulletRect)) {
      p2.lives--;
      p1.bullets.splice(i, 1);
      break;
    } else {
      for (let k = 0; k < state.walls.solid.length; k++) {
        if (bulletRect.intersects(new Rect(state.walls.solid[k].x, state.walls.solid[k].y, 4, 4))) {
          p1.bullets.splice(i, 1);
          break;
        }
      }
      for (let k = 0; k < state.walls.movable.length; k++) {
        if (bulletRect.intersects(new Rect(state.walls.movable[k].x, state.walls.movable[k].y, 4, 4))) {
          p1.bullets.splice(i, 1);
          break;
        }
      }
    }
  }
  for (let i = 0; i < p2.bullets.length; i++) {
    const bulletRect = new Rect(p2.bullets[i].x, p2.bullets[i].y, 2, 2);
    if (p1Rect.intersects(bulletRect)) {
      p1.lives--;
      p2.bullets.splice(i, 1);
      break;
    } else {
      for (let k = 0; k < state.walls.solid.length; k++) {
        if (bulletRect.intersects(new Rect(state.walls.solid[k].x, state.walls.solid[k].y, 4, 4))) {
          p2.bullets.splice(i, 1);
          break;
        }
      }
      for (let k = 0; k < state.walls.movable.length; k++) {
        if (bulletRect.intersects(new Rect(state.walls.movable[k].x, state.walls.movable[k].y, 4, 4))) {
          p2.bullets.splice(i, 1);
          break;
        }
      }
    }
  }
}

function keyPressed(keyCode, player) {
  if (keyCode == 71) {
    if (player.reload == false) {
      if (player.dir == "UP") {
        player.bullets.push({ x: player.pos.x + 1, y: player.pos.y, dir: "UP" });
      } else if (player.dir == "DOWN") {
        player.bullets.push({ x: player.pos.x + 1, y: player.pos.y + 4, dir: "DOWN" });
      } else if (player.dir == "LEFT") {
        player.bullets.push({ x: player.pos.x, y: player.pos.y + 1, dir: "LEFT" });
      } else if (player.dir == "RIGHT") {
        player.bullets.push({ x: player.pos.x + 4, y: player.pos.y + 1, dir: "RIGHT" });
      }
      player.reload = true;
      setTimeout(() => {
        player.reload = false;
      }, 500);
    }
  } else if (keyCode == 72) {
    if (player.inventoryCooldown == false) {
      player.inventoryCooldown = true;
      // Pick up wall
      if (player.inventorySpace - 1 >= 0 && collision(player, true)) {
        player.inventorySpace--;
      }
      // Drop wall
      else if (player.inventorySpace != 3 && wallDropAllowed(player)) {
        player.inventorySpace++;
      }
      setTimeout(() => {
        player.inventoryCooldown = false;
      }, 500);
    }
  } else {
    if (!player.directionPreference.includes(keyCode)) {
      player.directionPreference.push(keyCode);
    }
    const dxdy = calculateDirection(player);
    player.dxdy.x = dxdy[0];
    player.dxdy.y = dxdy[1];
  }
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

function collision(player, checkForMovableWall) {
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
    (playerRect.intersects(border1) ||
      playerRect.intersects(border2) ||
      playerRect.intersects(border3) ||
      playerRect.intersects(border4)) &&
    checkForMovableWall == false
  ) {
    return true;
  }

  let wx1, wy1;
  let wall, wallRect;
  // Solid walls
  for (let i = 0; i < gameState.walls.solid.length; i++) {
    wall = gameState.walls.solid[i];
    wx1 = wall.x;
    wy1 = wall.y;
    wallRect = new Rect(wx1, wy1, wallSize, wallSize);
    if (wallRect.intersects(playerRect) && checkForMovableWall == false) {
      return true;
    }
  }
  // Movable walls
  for (let i = 0; i < gameState.walls.movable.length; i++) {
    wall = gameState.walls.movable[i];
    wx1 = wall.x;
    wy1 = wall.y;
    wallRect = new Rect(wx1, wy1, wallSize, wallSize);
    if (wallRect.intersects(playerRect)) {
      if (checkForMovableWall) {
        gameState.walls.movable.splice(i, 1);
      }
      return true;
    }
  }
  return false;
}

function wallDropAllowed(player) {
  const playerSize = 4;
  const wallSize = 4;
  let space;
  if (player.dir == "UP") {
    space = new Rect(player.pos.x, player.pos.y - wallSize, wallSize, wallSize);
  } else if (player.dir == "DOWN") {
    space = new Rect(player.pos.x, player.pos.y + playerSize, wallSize, wallSize);
  } else if (player.dir == "LEFT") {
    space = new Rect(player.pos.x - wallSize, player.pos.y, wallSize, wallSize);
  } else if (player.dir == "RIGHT") {
    space = new Rect(player.pos.x + playerSize, player.pos.y, wallSize, wallSize);
  }

  // Check if movable wall intersects with players.
  /* if (
    space.intersects(new Rect(gameState.players[0].pos.x, gameState.players[0].pos.y, playerSize, playerSize)) ||
    space.intersects(new Rect(gameState.players[1].pos.x, gameState.players[1].pos.y, playerSize, playerSize))
  ) {
    return false;
  } */
  gameState.walls.movable.push({ x: space.x, y: space.y });
  return true;
}

function initializePlayingField(state, wallDim) {
  // FROM LEFT TO RIGHT. TOP TO BOTTOM.

  // The wall size has a value of: 4
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
    state.walls.solid.push({ x: 86, y: i });
  }

  for (let i = 52; i < 72; i += wallDim) {
    state.walls.solid.push({ x: 86, y: i });
  }

  // Movable walls
  state.walls.movable.push({ x: 3, y: 32 });
  state.walls.movable.push({ x: 3, y: 56 });

  state.walls.movable.push({ x: 93, y: 32 });
  state.walls.movable.push({ x: 93, y: 52 });

  state.walls.movable.push({ x: 45, y: 96 });

  for (let i = 44; i < 58; i += wallDim + 1) {
    state.walls.movable.push({ x: i, y: 4 });
  }

  for (let i = 20; i < 32; i += wallDim + 1) {
    state.walls.movable.push({ x: i, y: 76 });
  }

  for (let i = 72; i < 84; i += wallDim + 1) {
    state.walls.movable.push({ x: 60, y: i });
  }

  for (let i = 12; i < 20; i += wallDim + 1) {
    state.walls.movable.push({ x: 72, y: i });
  }
  state.walls.movable.push({ x: 77, y: 17 });
}
