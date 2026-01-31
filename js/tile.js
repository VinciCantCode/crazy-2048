Tile.NaN = "NaN";
Tile.Undefined = "Undefined";
Tile.Infinity = "Infinity";
Tile.Global = "Global";

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

Tile.prototype.isInfinity = function () {
  return this.value === Tile.Infinity;
};

Tile.prototype.isGlobal = function () {
  return this.value === Tile.Global;
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
