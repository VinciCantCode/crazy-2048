function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size;
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("saveScore", this.saveScore.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.continuePlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Save current score to leaderboard
GameManager.prototype.saveScore = function () {
  if (this.score > 0) {
    window.showSaveScoreModal(
      "Save Your Score",
      "Enter your nickname to save your score:",
      (nickname) => {
        if (nickname && nickname.trim()) {
          // Use the leaderboard.js saveScore function
          window.saveScore(nickname.trim(), this.score);
        }
      }
    );
  } else {
    alert("No score to save!");
  }
};

// Auto-save score when game is over
GameManager.prototype.autoSaveScore = function () {
  if (this.score > 0) {
    window.showSaveScoreModal(
      "Game Over!",
      "Enter your nickname to save your score (" + this.score + "):",
      (nickname) => {
        if (nickname && nickname.trim()) {
          window.saveScore(nickname.trim(), this.score);
        }
      }
    );
  }
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.continuePlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells);
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.continuePlaying = previousState.keepPlaying !== undefined ? previousState.keepPlaying : false;
    this.nanProbability = previousState.nanProbability !== undefined ? previousState.nanProbability : 0;
    this.undefinedProbability = previousState.undefinedProbability !== undefined ? previousState.undefinedProbability : 0;
    this.infinityProbability = previousState.infinityProbability !== undefined ? previousState.infinityProbability : 0;
    this.globalProbability = previousState.globalProbability !== undefined ? previousState.globalProbability : 0;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.continuePlaying = false;
    this.nanProbability = (typeof window.nanProbability === "number" && window.nanProbability >= 0) ? window.nanProbability : 0;
    this.undefinedProbability = (typeof window.undefinedProbability === "number" && window.undefinedProbability >= 0) ? window.undefinedProbability : 0;
    this.infinityProbability = (typeof window.infinityProbability === "number" && window.infinityProbability >= 0) ? window.infinityProbability : 0;
    this.globalProbability = (typeof window.globalProbability === "number" && window.globalProbability >= 0) ? window.globalProbability : 0;

    this.addStartTiles();
  }

  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value;
    var rand = Math.random();
    var cumulativeProb = 0;

    if (this.nanProbability > 0 && rand < this.nanProbability) {
      value = Tile.NaN;
    } else {
      cumulativeProb += this.nanProbability;

      if (this.undefinedProbability > 0 && rand < cumulativeProb + this.undefinedProbability) {
        value = Tile.Undefined;
      } else {
        cumulativeProb += this.undefinedProbability;

        if (this.infinityProbability > 0 && rand < cumulativeProb + this.infinityProbability) {
          value = Tile.Infinity;
        } else {
          cumulativeProb += this.infinityProbability;

          if (this.globalProbability > 0 && rand < cumulativeProb + this.globalProbability) {
            value = Tile.Global;
          } else {
            value = Math.random() < 0.9 ? 2 : 4;
          }
        }
      }
    }
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
    // Auto-save score when game is over
    this.autoSaveScore();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.continuePlaying,
    nanProbability: this.nanProbability,
    undefinedProbability: this.undefinedProbability,
    infinityProbability: this.infinityProbability,
    globalProbability: this.globalProbability
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var undefinedMerged = false;
  var infinityExplosion = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        // NaN tiles cannot move
        if (tile.isNaN()) return;

        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Check if two Undefined tiles can merge
        if (tile.isUndefined() && next && next.isUndefined() && !next.mergedFrom) {
          // Undefined + Undefined = clear all NaN tiles
          var merged = new Tile(positions.next, Tile.Undefined);
          merged.mergedFrom = [tile, next];
          merged.clearedNaN = true; // Mark that this merge clears NaN

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          tile.updatePosition(positions.next);
          undefinedMerged = true;
          moved = true;
        } else if (tile.isUndefined()) {
          // Undefined tiles can move but not merge with other tiles
          self.moveTile(tile, positions.farthest);
        } else if (tile.isInfinity() && next && next.isInfinity() && !next.mergedFrom) {
          // Infinity + Infinity = explode and clear all tiles < 1024
          var merged = new Tile(positions.next, Tile.Infinity);
          merged.mergedFrom = [tile, next];
          merged.explosion = true; // Mark that this merge causes explosion

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          tile.updatePosition(positions.next);
          infinityExplosion = true;
          moved = true;
        } else if (tile.isInfinity()) {
          // Infinity tiles can move but not merge with other tiles
          self.moveTile(tile, positions.farthest);
        } else if (tile.isGlobal() && next && !next.isNaN() && !next.isUndefined() && !next.isInfinity() && !next.isGlobal() && !next.mergedFrom) {
          // Global + any number = double that number's value
          // Transform the next tile by doubling its value
          next.value *= 2;
          next.mergedFrom = [tile, next];

          // Remove the Global tile
          self.grid.removeTile(tile);

          // Update the score for the doubled value
          self.score += next.value;

          // The mighty 2048 tile
          if (next.value === 2048) self.won = true;
        } else if (next && !next.isGlobal() && tile.isGlobal()) {
          // Global can move but doesn't merge with special tiles
          self.moveTile(tile, positions.farthest);
        } else if (next && !next.isNaN() && !next.isUndefined() && !next.isInfinity() && !next.isGlobal() && next.value === tile.value && !next.mergedFrom) {
          // Normal tile merge
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  // Clear all NaN tiles if two Undefined tiles merged
  if (undefinedMerged) {
    this.clearAllNaNTiles();
  }

  // Clear all tiles < 1024 if two Infinity tiles merged (explosion)
  if (infinityExplosion) {
    this.explodeSmallTiles();
  }

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Clear all NaN tiles from the board
GameManager.prototype.clearAllNaNTiles = function () {
  var self = this;
  this.grid.eachCell(function (x, y, tile) {
    if (tile && tile.isNaN()) {
      self.grid.removeTile(tile);
    }
  });
};

// Clear all tiles smaller than 1024 from the board (infinity explosion)
GameManager.prototype.explodeSmallTiles = function () {
  var self = this;
  this.grid.eachCell(function (x, y, tile) {
    if (tile && !tile.isNaN() && !tile.isUndefined() && !tile.isInfinity() && tile.value < 1024) {
      self.grid.removeTile(tile);
    }
  });
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile && !tile.isNaN() && !tile.isInfinity() && !tile.isGlobal()) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          // Two Undefined tiles can merge
          if (tile.isUndefined() && other && other.isUndefined()) {
            return true;
          }

          // Two Infinity tiles can merge
          if (tile.isInfinity() && other && other.isInfinity()) {
            return true;
          }

          // Global tiles can merge with any numeric tile
          if (tile.isGlobal() && other && !other.isNaN() && !other.isUndefined() && !other.isInfinity() && !other.isGlobal()) {
            return true;
          }

          // Normal tiles can merge if same value and not special tiles
          if (!tile.isUndefined() && !tile.isInfinity() && !tile.isGlobal() && other && !other.isNaN() && !other.isUndefined() && !other.isInfinity() && !other.isGlobal() && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
