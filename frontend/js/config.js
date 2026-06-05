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
      doubleJumpSpeed: 760,
      maxJumps: 2,
      coyoteTime: 0.11,
      jumpBuffer: 0.14,
      respawnInvincible: 1.4,
      hurtKnockback: 260
    },
    camera: {
      deadZoneLeft: 0.35,
      deadZoneRight: 0.6,
      lookAhead: 48,
      lookAheadSmoothing: 3.5,
      smoothing: 6,
      verticalOffset: 70
    },
    colors: {
      skyTop: "#080d22",
      skyBottom: "#251037",
      grassTop: "#f1b84f",
      grassDark: "#39d2ba",
      dirt: "#25233b",
      dirtDark: "#111629"
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
