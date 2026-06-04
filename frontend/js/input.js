(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  function InputManager(touchRoot) {
    this.keys = Object.create(null);
    this.touch = {
      left: false,
      right: false,
      jump: false
    };
    this.jumpPressed = false;
    this.actionPressed = false;

    this.bindKeyboard();
    this.bindTouch(touchRoot);
  }

  InputManager.prototype.bindKeyboard = function () {
    var self = this;

    window.addEventListener("keydown", function (event) {
      var key = event.key.toLowerCase();

      if (key === "arrowleft" || key === "arrowright" || key === " " || key === "spacebar") {
        event.preventDefault();
      }

      if (!self.keys[key]) {
        if (key === " " || key === "spacebar") {
          self.jumpPressed = true;
          self.actionPressed = true;
        }

        if (key === "enter") {
          self.actionPressed = true;
        }
      }

      self.keys[key] = true;
    });

    window.addEventListener("keyup", function (event) {
      self.keys[event.key.toLowerCase()] = false;
    });
  };

  InputManager.prototype.bindTouch = function (touchRoot) {
    if (!touchRoot) {
      return;
    }

    var self = this;
    var buttons = touchRoot.querySelectorAll("[data-control]");

    buttons.forEach(function (button) {
      var control = button.getAttribute("data-control");

      var setPressed = function (pressed) {
        self.touch[control] = pressed;
        button.classList.toggle("is-pressed", pressed);

        if (pressed && control === "jump") {
          self.jumpPressed = true;
          self.actionPressed = true;
        }
      };

      button.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setPressed(true);
      });

      button.addEventListener("pointerup", function (event) {
        event.preventDefault();
        setPressed(false);
      });

      button.addEventListener("pointercancel", function () {
        setPressed(false);
      });

      button.addEventListener("lostpointercapture", function () {
        setPressed(false);
      });
    });
  };

  InputManager.prototype.left = function () {
    return !!(this.keys.arrowleft || this.keys.a || this.touch.left);
  };

  InputManager.prototype.right = function () {
    return !!(this.keys.arrowright || this.keys.d || this.touch.right);
  };

  InputManager.prototype.jumpHeld = function () {
    return !!(this.keys[" "] || this.keys.spacebar || this.touch.jump);
  };

  InputManager.prototype.consumeJump = function () {
    var pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  };

  InputManager.prototype.consumeAction = function () {
    var pressed = this.actionPressed;
    this.actionPressed = false;
    return pressed;
  };

  InputManager.prototype.clearTransient = function () {
    this.jumpPressed = false;
    this.actionPressed = false;
  };

  SunnyGame.InputManager = InputManager;
}());
