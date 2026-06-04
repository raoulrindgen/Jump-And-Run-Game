(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  function ParticleSystem() {
    this.particles = [];
  }

  ParticleSystem.prototype.emit = function (x, y, count, factory) {
    for (var i = 0; i < count; i += 1) {
      this.particles.push(factory(x, y, i));
    }
  };

  ParticleSystem.prototype.emitJump = function (x, y, facing) {
    this.emit(x, y, 12, function (originX, originY) {
      var spread = (Math.random() - 0.5) * 160;
      return {
        x: originX,
        y: originY,
        vx: spread - facing * 70,
        vy: -60 - Math.random() * 90,
        radius: 3 + Math.random() * 3,
        life: 0.35 + Math.random() * 0.18,
        maxLife: 0.45,
        color: Math.random() > 0.5 ? "#ffffff" : "#d5f7ff",
        gravity: 440
      };
    });
  };

  ParticleSystem.prototype.emitCoin = function (x, y) {
    var colors = ["#ffe071", "#fff4a3", "#ff9f45", "#ffffff"];
    this.emit(x, y, 18, function (originX, originY) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 70 + Math.random() * 210;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        radius: 2 + Math.random() * 4,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 500
      };
    });
  };

  ParticleSystem.prototype.emitHit = function (x, y) {
    var colors = ["#ff6f6f", "#ffd166", "#ffffff"];
    this.emit(x, y, 20, function (originX, originY) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 100 + Math.random() * 260;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        life: 0.35 + Math.random() * 0.22,
        maxLife: 0.57,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 520
      };
    });
  };

  ParticleSystem.prototype.emitCheckpoint = function (x, y) {
    var colors = ["#80ed99", "#ffd166", "#8ec5ff", "#ffffff"];
    this.emit(x, y, 24, function (originX, originY) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      var speed = 100 + Math.random() * 240;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        life: 0.55 + Math.random() * 0.22,
        maxLife: 0.77,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 360
      };
    });
  };

  ParticleSystem.prototype.update = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i -= 1) {
      var particle = this.particles[i];
      particle.life -= dt;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  };

  SunnyGame.ParticleSystem = ParticleSystem;
}());
