Function.prototype.bind = Function.prototype.bind || function (target) {
  var self = this;
  var boundArgs = Array.prototype.slice.call(arguments, 1);
  return function () {
    var args = boundArgs.concat(Array.prototype.slice.call(arguments));
    return self.apply(target, args);
  };
};
