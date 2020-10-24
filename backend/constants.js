/* ### Constants that can be used in any other file ### */

const FRAME_RATE = 45; // 11 (greater value: faster)
const GRID_SIZE = 100; // 25 (greater value: smaller blocks)
const WINNING_SCORE = 5;
const DELAY_BETWEEN_ROUNDS = 6000;

const CANVAS_WIDTH = 850; // Make sure it is the same as CANVAS_WIDTH in client.js
const GRID_RATIO = CANVAS_WIDTH / GRID_SIZE;
const PLAYER_SIZE = 34; // DEPENDS ON CANVAS WIDTH!
const WALL_SIZE = 34;

module.exports = {
  FRAME_RATE,
  GRID_SIZE,
  WINNING_SCORE,
  DELAY_BETWEEN_ROUNDS,
  CANVAS_WIDTH,
  GRID_RATIO,
  PLAYER_SIZE,
  WALL_SIZE,
};
