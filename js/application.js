function initGame() {
  window.nanProbability = 0;
  window.undefinedProbability = 0;
  window.infinityProbability = 0;
  window.globalProbability = 0;

  // Helper function to setup slider with game key prevention
  function setupSlider(sliderId, valueDisplayId, probabilityKey) {
    var slider = document.getElementById(sliderId);
    var valueDisplay = document.getElementById(valueDisplayId);
    if (slider && valueDisplay) {
      window[probabilityKey] = parseFloat(slider.value) / 100;
      valueDisplay.textContent = slider.value;
      slider.addEventListener("input", function () {
        window[probabilityKey] = parseFloat(slider.value) / 100;
        valueDisplay.textContent = slider.value;
      });
      // 操作完成后失去焦点，避免拦截游戏按键
      slider.addEventListener("change", function () {
        this.blur();
      });
      // 阻止 slider 拦截游戏按键
      slider.addEventListener("keydown", function (event) {
        var gameKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", 
                        "w", "W", "a", "A", "s", "S", "d", "D",
                        "h", "H", "j", "J", "k", "K", "l", "L", "r", "R"];
        if (gameKeys.indexOf(event.key) !== -1) {
          event.preventDefault();
          this.blur();
          window.dispatchEvent(new KeyboardEvent("keydown", {
            key: event.key,
            keyCode: event.keyCode,
            which: event.which,
            bubbles: true
          }));
        }
      });
    }
  }

  setupSlider("nan-probability-slider", "nan-probability-value", "nanProbability");
  setupSlider("undefined-probability-slider", "undefined-probability-value", "undefinedProbability");
  setupSlider("infinity-probability-slider", "infinity-probability-value", "infinityProbability");
  setupSlider("global-probability-slider", "global-probability-value", "globalProbability");

  new GameManager(8, KeyboardInputManager, HTMLActuator, LocalStorageManager);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
