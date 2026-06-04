(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  SunnyGame.Config = {
    world: {
      gravity: 2100,
      maxFallSpeed: 1450,
      checkpointCooldown: 1.2
    },
    player: {
      width: 38,
      height: 52,
      moveAcceleration: 3600,
      groundFriction: 2500,
      airFriction: 460,
      maxSpeed: 330,
      jumpSpeed: 790,
      coyoteTime: 0.11,
      jumpBuffer: 0.14,
      respawnInvincible: 1.4,
      hurtKnockback: 260
    },
    camera: {
      lookAhead: 120,
      smoothing: 7,
      verticalOffset: 70
    },
    colors: {
      skyTop: "#73d8ff",
      skyBottom: "#d7f8ff",
      grassTop: "#60cc64",
      grassDark: "#2f9d56",
      dirt: "#b86f3d",
      dirtDark: "#8f4e2f"
    }
  };

  SunnyGame.Helpers = {
    clamp: function (value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    approach: function (value, target, amount) {
      if (value < target) {
        return Math.min(target, value + amount);
      }
      return Math.max(target, value - amount);
    },

    rectsOverlap: function (a, b) {
      return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
    }
  };
}());
