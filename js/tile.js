Tile.NaN = "NaN";
Tile.Undefined = "Undefined";

function Tile(position, value) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value || 2;

  this.previousPosition = null;
  this.mergedFrom       = null;
}

Tile.prototype.isNaN = function () {
  return this.value === Tile.NaN;
};

Tile.prototype.isUndefined = function () {
  return this.value === Tile.Undefined;
};

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

Tile.prototype.serialize = function () {
  return {
    position: {
      x: this.x,
      y: this.y
    },
    value: this.value
  };
};
