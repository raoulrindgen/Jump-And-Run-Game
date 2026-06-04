(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  var Config = SunnyGame.Config;
  var Helpers = SunnyGame.Helpers;

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.clientWidth || 1280;
    this.height = canvas.clientHeight || 720;
    this.dpr = 1;
    this.resize();
  }

  Renderer.prototype.resize = function () {
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.width = Math.max(320, this.canvas.clientWidth || window.innerWidth);
    this.height = Math.max(240, this.canvas.clientHeight || window.innerHeight);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Renderer.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
  };

  Renderer.prototype.render = function (game) {
    var ctx = this.ctx;
    this.clear();
    this.drawBackground(game.level, game.camera.x, game.camera.y, game.time);

    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);

    this.drawLevelDecor(game.level, game.camera.x, game.camera.y);
    this.drawFinishFlag(game.finishFlag, game.time);

    for (var p = 0; p < game.level.platforms.length; p += 1) {
      this.drawPlatform(game.level.platforms[p]);
    }

    for (var c = 0; c < game.checkpoints.length; c += 1) {
      this.drawCheckpoint(game.checkpoints[c], game.time);
    }

    for (var i = 0; i < game.coins.length; i += 1) {
      if (!game.coins[i].collected) {
        this.drawCoin(game.coins[i], game.time);
      }
    }

    for (var e = 0; e < game.enemies.length; e += 1) {
      this.drawEnemy(game.enemies[e], game.time);
    }

    this.drawParticles(game.particles);
    this.drawPlayer(game.player, game.time);

    ctx.restore();
  };

  Renderer.prototype.drawBackground = function (level, cameraX, cameraY, time) {
    var ctx = this.ctx;
    var gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, Config.colors.skyTop);
    gradient.addColorStop(1, Config.colors.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(this.width - 96, 94, 48, 0, Math.PI * 2);
    ctx.fill();

    level.clouds.forEach(function (cloud) {
      this.drawCloud(
        cloud.x - cameraX * 0.22,
        cloud.y - cameraY * 0.08 + Math.sin(time + cloud.x) * 4,
        cloud.scale
      );
    }, this);

    this.drawHillLayer(cameraX * 0.18, this.height - 140, "#93dd79", 0.6);
    this.drawHillLayer(cameraX * 0.32, this.height - 82, "#67c783", 0.9);
  };

  Renderer.prototype.drawHillLayer = function (offset, baseY, color, scale) {
    var ctx = this.ctx;
    var start = -((offset % 620) + 620);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.height);

    for (var x = start; x < this.width + 820; x += 310) {
      ctx.quadraticCurveTo(x + 155 * scale, baseY - 90 * scale, x + 310 * scale, baseY);
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
  };

  Renderer.prototype.drawCloud = function (x, y, scale) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.arc(0, 15, 28, 0, Math.PI * 2);
    ctx.arc(30, 2, 34, 0, Math.PI * 2);
    ctx.arc(66, 15, 28, 0, Math.PI * 2);
    ctx.arc(30, 26, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  Renderer.prototype.drawLevelDecor = function (level) {
    var ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#ffffff";
    for (var x = 120; x < level.width; x += 560) {
      ctx.beginPath();
      ctx.arc(x, level.height - 120, 36, 0, Math.PI * 2);
      ctx.arc(x + 46, level.height - 130, 46, 0, Math.PI * 2);
      ctx.arc(x + 98, level.height - 118, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  Renderer.prototype.drawPlatform = function (platform) {
    var ctx = this.ctx;
    var grassHeight = Math.min(22, platform.h * 0.35);
    this.roundRect(ctx, platform.x, platform.y, platform.w, platform.h, 8, Config.colors.dirt);

    ctx.fillStyle = Config.colors.dirtDark;
    for (var x = platform.x + 14; x < platform.x + platform.w; x += 34) {
      ctx.fillRect(x, platform.y + grassHeight + 15, 14, 7);
      ctx.fillRect(x + 10, platform.y + grassHeight + 46, 20, 8);
    }

    this.roundRect(ctx, platform.x, platform.y - 2, platform.w, grassHeight + 7, 8, Config.colors.grassTop);
    ctx.fillStyle = Config.colors.grassDark;
    ctx.fillRect(platform.x, platform.y + grassHeight, platform.w, 5);

    ctx.fillStyle = "#7be06f";
    for (var blade = platform.x + 10; blade < platform.x + platform.w - 8; blade += 18) {
      ctx.beginPath();
      ctx.moveTo(blade, platform.y + 4);
      ctx.lineTo(blade + 7, platform.y - 9 - Math.sin(blade) * 3);
      ctx.lineTo(blade + 13, platform.y + 4);
      ctx.fill();
    }
  };

  Renderer.prototype.drawCoin = function (coin, time) {
    var ctx = this.ctx;
    var bob = Math.sin(time * 4 + coin.index) * 5;
    var squash = 0.35 + Math.abs(Math.cos(coin.animationTime)) * 0.65;
    var x = coin.x;
    var y = coin.y + bob;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squash, 1);
    ctx.fillStyle = "#ffd84d";
    ctx.strokeStyle = "#ef9c2f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(-4, -6, 4, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  Renderer.prototype.drawCheckpoint = function (checkpoint, time) {
    var ctx = this.ctx;
    var baseX = checkpoint.x;
    var baseY = checkpoint.y;
    var flagColor = checkpoint.active ? "#80ed99" : "#8ec5ff";
    var wave = Math.sin(time * 5 + checkpoint.x) * 4;

    ctx.fillStyle = "#6f8da8";
    ctx.fillRect(baseX, baseY - checkpoint.h, 7, checkpoint.h);
    ctx.fillStyle = "#365c7d";
    ctx.fillRect(baseX - 7, baseY - 4, 21, 8);

    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(baseX + 7, baseY - checkpoint.h + 6);
    ctx.quadraticCurveTo(baseX + 39, baseY - checkpoint.h + wave, baseX + 62, baseY - checkpoint.h + 12);
    ctx.lineTo(baseX + 50, baseY - checkpoint.h + 42);
    ctx.quadraticCurveTo(baseX + 27, baseY - checkpoint.h + 34 - wave, baseX + 7, baseY - checkpoint.h + 39);
    ctx.closePath();
    ctx.fill();
  };

  Renderer.prototype.drawFinishFlag = function (flag, time) {
    var ctx = this.ctx;
    var x = flag.x;
    var y = flag.y;
    var wave = Math.sin(time * 5) * 5;

    ctx.fillStyle = "#f7f0da";
    ctx.fillRect(x, y - flag.h, 9, flag.h);
    ctx.fillStyle = "#b9a87a";
    ctx.fillRect(x - 9, y - 6, 27, 10);

    ctx.fillStyle = "#ff6f6f";
    ctx.beginPath();
    ctx.moveTo(x + 9, y - flag.h + 5);
    ctx.quadraticCurveTo(x + 46, y - flag.h - 4 + wave, x + 84, y - flag.h + 10);
    ctx.lineTo(x + 72, y - flag.h + 52);
    ctx.quadraticCurveTo(x + 40, y - flag.h + 36 - wave, x + 9, y - flag.h + 43);
    ctx.closePath();
    ctx.fill();

    this.drawStar(x + 43, y - flag.h + 22, 10, "#fff2a7");
  };

  Renderer.prototype.drawEnemy = function (enemy, time) {
    var ctx = this.ctx;
    var bounce = Math.sin(enemy.animationTime * 8) * 2;
    var facing = enemy.vx >= 0 ? 1 : -1;
    var x = enemy.x + enemy.w / 2;
    var y = enemy.y + enemy.h / 2 + bounce;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    ctx.fillStyle = "rgba(54, 74, 91, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 23, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9b6de3";
    ctx.beginPath();
    ctx.ellipse(0, 4, 23, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7d54c2";
    ctx.beginPath();
    ctx.arc(-8, -6, 7, 0, Math.PI * 2);
    ctx.arc(8, -7, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, 0, 6, 0, Math.PI * 2);
    ctx.arc(20, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#27384f";
    ctx.beginPath();
    ctx.arc(9, 1, 2.5, 0, Math.PI * 2);
    ctx.arc(22, 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6a47aa";
    ctx.fillRect(-17, 15, 8, 8);
    ctx.fillRect(9, 15, 8, 8);

    ctx.restore();
  };

  Renderer.prototype.drawPlayer = function (player, time) {
    var ctx = this.ctx;

    if (player.invincibleTimer > 0 && Math.floor(time * 16) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    var x = player.x + player.w / 2;
    var y = player.y + player.h / 2;
    var runCycle = Math.sin(player.animationTime * 12);
    var idleBob = player.state === "idle" ? Math.sin(player.animationTime * 3) * 2 : 0;
    var lean = player.state === "run" ? runCycle * 0.04 : 0;
    var legSwing = player.state === "run" ? runCycle * 7 : player.state === "jump" ? -5 : 0;
    var armSwing = player.state === "run" ? -runCycle * 6 : player.state === "jump" ? -8 : 0;

    ctx.save();
    ctx.translate(x, y + idleBob);
    ctx.scale(player.facing, 1);
    ctx.rotate(lean);

    ctx.fillStyle = "rgba(54, 74, 91, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 31, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2e8d62";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-9, 11);
    ctx.lineTo(-13 - legSwing * 0.4, 26);
    ctx.moveTo(8, 11);
    ctx.lineTo(13 + legSwing * 0.4, 26);
    ctx.stroke();

    this.roundRect(ctx, -18, -14, 36, 34, 12, "#f78ec4");

    ctx.strokeStyle = "#c95a96";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15, -2);
    ctx.lineTo(-24, 9 + armSwing);
    ctx.moveTo(15, -2);
    ctx.lineTo(23, 9 - armSwing);
    ctx.stroke();

    ctx.fillStyle = "#ffcf9f";
    ctx.beginPath();
    ctx.arc(0, -24, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6bcf6f";
    ctx.beginPath();
    ctx.ellipse(-5, -43, 12, 7, -0.35, 0, Math.PI * 2);
    ctx.ellipse(8, -42, 12, 7, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(5, -27, 5, 0, Math.PI * 2);
    ctx.arc(17, -27, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#263a52";
    ctx.beginPath();
    ctx.arc(7, -26, 2, 0, Math.PI * 2);
    ctx.arc(19, -26, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#9c4f4f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(12, -18, 6, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  };

  Renderer.prototype.drawParticles = function (particleSystem) {
    var ctx = this.ctx;
    for (var i = 0; i < particleSystem.particles.length; i += 1) {
      var particle = particleSystem.particles[i];
      var alpha = Helpers.clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  Renderer.prototype.drawStar = function (x, y, radius, color) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 10; i += 1) {
      var pointRadius = i % 2 === 0 ? radius : radius * 0.45;
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      ctx.lineTo(Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  Renderer.prototype.roundRect = function (ctx, x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  };

  SunnyGame.Renderer = Renderer;
}());
