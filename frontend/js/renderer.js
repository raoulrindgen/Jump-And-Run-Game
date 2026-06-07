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
    // Cap DPR to keep the scene sharp without excessive canvas fill-rate cost.
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
      this.drawEnemy(game.enemies[e]);
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

    for (var star = 0; star < 56; star += 1) {
      var starX = (star * 173 - cameraX * 0.08) % (this.width + 120) - 60;
      var starY = 32 + ((star * 89) % Math.max(120, this.height * 0.62));
      var starPulse = 0.45 + Math.sin(time * 2 + star) * 0.24;
      ctx.globalAlpha = 0.3 + starPulse * 0.42;
      ctx.fillStyle = star % 5 === 0 ? "#f7c45b" : "#d8e5ff";
      ctx.fillRect(starX, starY, star % 4 === 0 ? 3 : 2, star % 4 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;

    this.drawVoidRift(this.width - 120, 104, 56 + Math.sin(time * 1.4) * 3, time);

    ctx.fillStyle = "rgba(247, 196, 91, 0.9)";
    ctx.beginPath();
    ctx.arc(92, 104, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(104, 246, 208, 0.42)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(92, 104, 50 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
    ctx.stroke();

    level.clouds.forEach(function (cloud) {
      this.drawCloud(
        cloud.x - cameraX * 0.22,
        cloud.y - cameraY * 0.08 + Math.sin(time + cloud.x) * 4,
        cloud.scale
      );
    }, this);

    this.drawHillLayer(cameraX * 0.18, this.height - 142, "#142c2e", 0.65);
    this.drawHillLayer(cameraX * 0.32, this.height - 82, "#302042", 0.95);
  };

  Renderer.prototype.drawVoidRift = function (x, y, radius, time) {
    var ctx = this.ctx;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.35);

    var gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.86)");
    gradient.addColorStop(0.24, "rgba(104, 246, 208, 0.75)");
    gradient.addColorStop(0.58, "rgba(123, 44, 255, 0.58)");
    gradient.addColorStop(1, "rgba(10, 13, 34, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(214, 77, 143, 0.7)";
    ctx.lineWidth = 4;
    for (var ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius - ring * 12, 16 + ring * 5, ring * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
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

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#68f6d0";
    ctx.lineWidth = 2;
    for (var root = start + 80; root < this.width + 760; root += 210) {
      ctx.beginPath();
      ctx.moveTo(root, baseY + 22);
      ctx.quadraticCurveTo(root + 42, baseY - 20 * scale, root + 84, baseY + 16);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  Renderer.prototype.drawCloud = function (x, y, scale) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(123, 44, 255, 0.28)";
    ctx.beginPath();
    ctx.ellipse(2, 15, 36, 16, -0.24, 0, Math.PI * 2);
    ctx.ellipse(36, 5, 42, 20, 0.2, 0, Math.PI * 2);
    ctx.ellipse(78, 17, 34, 16, 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(104, 246, 208, 0.38)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, 20);
    ctx.quadraticCurveTo(28, -12, 90, 20);
    ctx.stroke();
    ctx.restore();
  };

  Renderer.prototype.drawLevelDecor = function (level) {
    var ctx = this.ctx;
    ctx.save();
    for (var x = 120; x < level.width; x += 560) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#0a0e1e";
      ctx.beginPath();
      ctx.moveTo(x - 52, level.height - 92);
      ctx.lineTo(x - 20, level.height - 208);
      ctx.lineTo(x + 14, level.height - 92);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.36;
      ctx.fillStyle = "#f7c45b";
      ctx.beginPath();
      ctx.moveTo(x + 48, level.height - 80);
      ctx.lineTo(x + 70, level.height - 154);
      ctx.lineTo(x + 92, level.height - 80);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#68f6d0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 20, level.height - 74);
      ctx.lineTo(x + 20, level.height - 136);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  Renderer.prototype.drawPlatform = function (platform) {
    var ctx = this.ctx;
    var trimHeight = Math.min(20, platform.h * 0.28);
    this.roundRect(ctx, platform.x, platform.y, platform.w, platform.h, 8, Config.colors.dirt);

    ctx.fillStyle = Config.colors.dirtDark;
    for (var x = platform.x + 14; x < platform.x + platform.w; x += 34) {
      ctx.fillRect(x, platform.y + trimHeight + 15, 16, 6);
      ctx.fillRect(x + 11, platform.y + trimHeight + 46, 22, 7);
    }

    this.roundRect(ctx, platform.x, platform.y - 2, platform.w, trimHeight + 7, 8, Config.colors.grassTop);
    ctx.fillStyle = Config.colors.grassDark;
    ctx.fillRect(platform.x, platform.y + trimHeight, platform.w, 5);

    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#68f6d0";
    for (var rune = platform.x + 18; rune < platform.x + platform.w - 8; rune += 58) {
      ctx.beginPath();
      ctx.moveTo(rune, platform.y + 6);
      ctx.lineTo(rune + 8, platform.y - 6);
      ctx.lineTo(rune + 16, platform.y + 6);
      ctx.lineTo(rune + 8, platform.y + 15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  Renderer.prototype.drawCoin = function (coin, time) {
    var ctx = this.ctx;
    var bob = Math.sin(time * 4 + coin.index) * 5;
    var squash = 0.55 + Math.abs(Math.cos(coin.animationTime)) * 0.45;
    var x = coin.x;
    var y = coin.y + bob;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squash, 1);
    ctx.fillStyle = "#f7c45b";
    ctx.strokeStyle = "#fff0a3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 21);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(104, 246, 208, 0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  Renderer.prototype.drawCheckpoint = function (checkpoint, time) {
    var ctx = this.ctx;
    var baseX = checkpoint.x;
    var baseY = checkpoint.y;
    var glowColor = checkpoint.active ? "#f7c45b" : "#68f6d0";
    var pulse = 8 + Math.sin(time * 5 + checkpoint.x) * 3;

    ctx.fillStyle = "#15182b";
    ctx.fillRect(baseX - 6, baseY - checkpoint.h, 12, checkpoint.h);
    ctx.fillStyle = "#2c2944";
    ctx.fillRect(baseX - 18, baseY - 8, 36, 12);

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(baseX, baseY - checkpoint.h + 26, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(baseX, baseY - checkpoint.h + 26, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = checkpoint.active ? "#fff0a3" : "#a078ff";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - checkpoint.h + 6);
    ctx.lineTo(baseX + 12, baseY - checkpoint.h + 26);
    ctx.lineTo(baseX, baseY - checkpoint.h + 48);
    ctx.lineTo(baseX - 12, baseY - checkpoint.h + 26);
    ctx.closePath();
    ctx.fill();
  };

  Renderer.prototype.drawFinishFlag = function (flag, time) {
    var ctx = this.ctx;
    var x = flag.x;
    var y = flag.y;
    var pulse = 1 + Math.sin(time * 4) * 0.08;

    ctx.fillStyle = "#16192c";
    ctx.fillRect(x - 8, y - flag.h, 16, flag.h);
    ctx.fillStyle = "#3b3350";
    ctx.fillRect(x - 22, y - 8, 44, 12);

    ctx.save();
    ctx.translate(x + 8, y - flag.h + 40);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "rgba(104, 246, 208, 0.72)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(time * 0.8);
    ctx.strokeStyle = "rgba(123, 44, 255, 0.72)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f7c45b";
    ctx.strokeStyle = "#fff0a3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - flag.h - 18);
    ctx.lineTo(x + 38, y - flag.h + 38);
    ctx.lineTo(x + 8, y - flag.h + 102);
    ctx.lineTo(x - 22, y - flag.h + 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.drawStar(x + 8, y - flag.h + 38, 10, "#ffffff");
  };

  Renderer.prototype.drawEnemy = function (enemy) {
    var ctx = this.ctx;
    var bounce = Math.sin(enemy.animationTime * 8) * 2;
    var facing = enemy.vx >= 0 ? 1 : -1;
    var x = enemy.x + enemy.w / 2;
    var y = enemy.y + enemy.h / 2 + bounce;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 23, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#7b2cff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-16, 7);
    ctx.quadraticCurveTo(-36, -8, -28, -25);
    ctx.moveTo(16, 7);
    ctx.quadraticCurveTo(36, -8, 28, -25);
    ctx.stroke();

    ctx.fillStyle = "#191128";
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b1c66";
    ctx.beginPath();
    ctx.arc(-10, -8, 8, 0, Math.PI * 2);
    ctx.arc(10, -8, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#68f6d0";
    ctx.beginPath();
    ctx.arc(-7, 0, 5, 0, Math.PI * 2);
    ctx.arc(9, 0, 5, 0, Math.PI * 2);
    ctx.arc(1, 9, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0b1022";
    ctx.beginPath();
    ctx.arc(-6, 1, 2, 0, Math.PI * 2);
    ctx.arc(10, 1, 2, 0, Math.PI * 2);
    ctx.arc(2, 10, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d64d8f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-15, 16);
    ctx.lineTo(-20, 28);
    ctx.moveTo(14, 16);
    ctx.lineTo(20, 28);
    ctx.stroke();

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

    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(0, 31, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#101520";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-9, 11);
    ctx.lineTo(-13 - legSwing * 0.4, 26);
    ctx.moveTo(8, 11);
    ctx.lineTo(13 + legSwing * 0.4, 26);
    ctx.stroke();

    ctx.fillStyle = "rgba(123, 44, 255, 0.5)";
    ctx.beginPath();
    ctx.moveTo(-17, -8);
    ctx.quadraticCurveTo(-44, -22, -35, 8);
    ctx.quadraticCurveTo(-22, 4, -17, 14);
    ctx.moveTo(17, -8);
    ctx.quadraticCurveTo(44, -22, 35, 8);
    ctx.quadraticCurveTo(22, 4, 17, 14);
    ctx.fill();

    this.roundRect(ctx, -18, -14, 36, 34, 12, "#1c2032");
    this.roundRect(ctx, -11, -10, 22, 25, 8, "#283148");

    ctx.strokeStyle = "#68f6d0";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15, -2);
    ctx.lineTo(-24, 9 + armSwing);
    ctx.moveTo(15, -2);
    ctx.lineTo(23, 9 - armSwing);
    ctx.stroke();

    ctx.strokeStyle = "#c8ff6a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-29, 11 + armSwing, 9, -0.2, Math.PI * 1.4);
    ctx.arc(29, 11 - armSwing, 9, Math.PI * -0.4, Math.PI + 0.2);
    ctx.stroke();

    ctx.fillStyle = "#9c7a5b";
    ctx.beginPath();
    ctx.arc(0, -24, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1a1022";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-12, -39);
    ctx.quadraticCurveTo(-25, -57, -39, -45);
    ctx.moveTo(12, -39);
    ctx.quadraticCurveTo(25, -57, 39, -45);
    ctx.stroke();

    ctx.fillStyle = "#1a1022";
    ctx.beginPath();
    ctx.ellipse(-5, -43, 12, 6, -0.35, 0, Math.PI * 2);
    ctx.ellipse(8, -42, 12, 6, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111629";
    ctx.fillRect(-16, -30, 34, 8);

    ctx.fillStyle = "#68f6d0";
    ctx.beginPath();
    ctx.arc(-5, -26, 2.4, 0, Math.PI * 2);
    ctx.arc(8, -26, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#c8ff6a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-2, 12);
    ctx.moveTo(8, 2);
    ctx.lineTo(2, 12);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  };

  Renderer.prototype.drawParticles = function (particleSystem) {
    var ctx = this.ctx;
    for (var i = 0; i < particleSystem.particles.length; i += 1) {
      var particle = particleSystem.particles[i];
      ctx.globalAlpha = Helpers.clamp(particle.life / particle.maxLife, 0, 1);
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
