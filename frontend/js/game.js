(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  var Helpers = SunnyGame.Helpers;
  var Config = SunnyGame.Config;

  function cloneLevel(level) {
    return JSON.parse(JSON.stringify(level));
  }

  function Game() {
    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new SunnyGame.Renderer(this.canvas);
    this.input = new SunnyGame.InputManager(document.getElementById("touchControls"));
    this.audio = new SunnyGame.AudioManager();
    this.particles = new SunnyGame.ParticleSystem();

    this.messagePanel = document.getElementById("messagePanel");
    this.messageTitle = document.getElementById("messageTitle");
    this.messageText = document.getElementById("messageText");
    this.primaryAction = document.getElementById("primaryAction");
    this.pauseButton = document.getElementById("pauseButton");
    this.scoreValue = document.getElementById("scoreValue");
    this.coinValue = document.getElementById("coinValue");
    this.levelValue = document.getElementById("levelValue");
    this.livesValue = document.getElementById("livesValue");

    this.state = "start";
    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.coins = [];
    this.enemies = [];
    this.checkpoints = [];
    this.finishFlag = null;
    this.score = 0;
    this.collectedCoins = 0;
    this.camera = { x: 0, y: 0 };
    this.time = 0;
    this.lastFrameTime = 0;
    this.nextAction = "start";

    this.bindEvents();
    this.loadLevel(0, 3);
    this.showMessage("Midnight Rift Run", "Cut through the Voidstorm, gather sun shards, and seal the rift.", "Start Game", "start");
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  Game.prototype.bindEvents = function () {
    var self = this;

    window.addEventListener("resize", function () {
      self.renderer.resize();
      self.updateCamera(1);
    });

    this.primaryAction.addEventListener("click", function () {
      self.handlePanelAction();
    });

    this.pauseButton.addEventListener("click", function () {
      self.togglePause();
    });

    this.canvas.addEventListener("pointerdown", function () {
      if (self.state !== "playing") {
        self.handlePanelAction();
      }
    });
  };

  Game.prototype.loadLevel = function (index, lives) {
    this.levelIndex = index;
    this.level = cloneLevel(SunnyGame.Levels[index]);
    this.player = new SunnyGame.Player(this.level.playerStart.x, this.level.playerStart.y, lives);
    this.coins = this.level.coins.map(function (coin, coinIndex) {
      return new SunnyGame.Coin(coin, coinIndex);
    });
    this.enemies = this.level.enemies.map(function (enemy) {
      return new SunnyGame.Enemy(enemy);
    });
    this.checkpoints = this.level.checkpoints.map(function (checkpoint) {
      return new SunnyGame.Checkpoint(checkpoint);
    });
    this.finishFlag = new SunnyGame.FinishFlag(this.level.finish);
    this.particles = new SunnyGame.ParticleSystem();
    this.camera.x = 0;
    this.camera.y = 0;
    this.updateHud();
    this.updateCamera(1);
  };

  Game.prototype.startNewGame = function () {
    this.score = 0;
    this.collectedCoins = 0;
    this.loadLevel(0, 3);
    this.state = "playing";
    this.hideMessage();
    this.updatePauseButton();
    this.audio.ensureContext();
  };

  Game.prototype.handlePanelAction = function () {
    this.audio.ensureContext();

    if (this.nextAction === "start" || this.nextAction === "restart") {
      this.startNewGame();
    } else if (this.nextAction === "next") {
      this.loadLevel(this.levelIndex + 1, this.player.lives);
      this.state = "playing";
      this.hideMessage();
      this.updatePauseButton();
    } else if (this.nextAction === "resume") {
      this.resumeGame();
    }

    this.input.clearTransient();
  };

  Game.prototype.togglePause = function () {
    if (this.state === "playing") {
      this.pauseGame();
    } else if (this.state === "paused") {
      this.resumeGame();
    }
  };

  Game.prototype.pauseGame = function () {
    this.state = "paused";
    this.showMessage("Paused", "Take a breather, then jump back in.", "Resume", "resume");
    this.updatePauseButton();
    this.input.clearTransient();
  };

  Game.prototype.resumeGame = function () {
    this.state = "playing";
    this.hideMessage();
    this.updatePauseButton();
    this.input.clearTransient();
  };

  Game.prototype.showMessage = function (title, text, buttonText, action) {
    this.messageTitle.textContent = title;
    this.messageText.textContent = text;
    this.primaryAction.textContent = buttonText;
    this.nextAction = action;
    this.messagePanel.hidden = false;
    this.input.clearTransient();
    this.updatePauseButton();
  };

  Game.prototype.hideMessage = function () {
    this.messagePanel.hidden = true;
    this.updatePauseButton();
  };

  Game.prototype.loop = function (timestamp) {
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    var dt = Math.min(0.033, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;
    var pausePressed = this.input.consumePause();
    if (pausePressed) {
      this.togglePause();
    }

    if (!pausePressed && this.state !== "playing" && this.input.consumeAction()) {
      this.handlePanelAction();
    }

    if (this.state !== "paused") {
      this.time += dt;
    }

    if (this.state === "playing") {
      this.update(dt);
    } else if (this.state !== "paused") {
      this.particles.update(dt);
      this.updateDecorativeEntities(dt);
    }

    this.renderer.render(this);
    requestAnimationFrame(this.loop);
  };

  Game.prototype.update = function (dt) {
    this.player.update(dt, this.level, this.input, this.particles, this.audio);

    this.updateDecorativeEntities(dt);

    for (var i = 0; i < this.enemies.length; i += 1) {
      this.enemies[i].update(dt, this.level.platforms);
      if (Helpers.rectsOverlap(this.player.rect(), this.enemies[i].rect())) {
        this.damagePlayer(this.enemies[i].x + this.enemies[i].w / 2);
        if (this.state !== "playing") {
          break;
        }
      }
    }

    if (this.state !== "playing") {
      this.particles.update(dt);
      this.updateCamera(dt);
      this.updateHud();
      return;
    }

    this.collectCoins();
    this.checkCheckpoints();
    this.checkFinish();
    this.checkFall();
    this.particles.update(dt);
    this.updateCamera(dt);
    this.updateHud();
  };

  Game.prototype.updateDecorativeEntities = function (dt) {
    for (var i = 0; i < this.coins.length; i += 1) {
      this.coins[i].update(dt);
    }
  };

  Game.prototype.collectCoins = function () {
    var playerRect = this.player.rect();
    for (var i = 0; i < this.coins.length; i += 1) {
      var coin = this.coins[i];
      if (!coin.collected && Helpers.rectsOverlap(playerRect, coin.rect())) {
        coin.collected = true;
        this.score += 100;
        this.collectedCoins += 1;
        this.particles.emitCoin(coin.x, coin.y);
        this.audio.coin();
      }
    }
  };

  Game.prototype.checkCheckpoints = function () {
    var playerRect = this.player.rect();

    for (var i = 0; i < this.checkpoints.length; i += 1) {
      var checkpoint = this.checkpoints[i];
      if (!checkpoint.active && Helpers.rectsOverlap(playerRect, checkpoint.rect())) {
        for (var j = 0; j < this.checkpoints.length; j += 1) {
          this.checkpoints[j].active = false;
        }

        checkpoint.active = true;
        this.player.setSpawn(checkpoint.x - this.player.w / 2, checkpoint.y);
        this.particles.emitCheckpoint(checkpoint.x + 4, checkpoint.y - checkpoint.h + 24);
        this.audio.checkpoint();
      }
    }
  };

  Game.prototype.checkFinish = function () {
    if (!Helpers.rectsOverlap(this.player.rect(), this.finishFlag.rect())) {
      return;
    }

    this.audio.finish();

    if (this.levelIndex >= SunnyGame.Levels.length - 1) {
      this.state = "won";
      this.showMessage("The Rift Is Sealed", "Final score: " + this.score + " points with " + this.collectedCoins + " sun shards claimed.", "Play Again", "restart");
      this.updatePauseButton();
    } else {
      this.state = "levelComplete";
      this.showMessage("Rift Cleared", "Next incursion: " + SunnyGame.Levels[this.levelIndex + 1].name + ".", "Next Level", "next");
      this.updatePauseButton();
    }
  };

  Game.prototype.checkFall = function () {
    if (this.player.y <= this.level.height + 180) {
      return;
    }

    this.damagePlayer(this.player.x + this.player.w / 2);
  };

  Game.prototype.damagePlayer = function (sourceX) {
    if (!this.player.hurt(sourceX, this.particles, this.audio)) {
      return;
    }

    if (this.player.lives <= 0) {
      this.state = "gameOver";
      this.audio.gameOver();
      this.showMessage("The Void Prevails", "Score: " + this.score + ". Rally again at the first breach.", "Restart", "restart");
      this.updateHud();
      this.updatePauseButton();
      return;
    }

    window.setTimeout(function (game) {
      if (game.state === "playing") {
        game.player.respawn();
        game.updateCamera(1);
      }
    }, 420, this);
  };

  Game.prototype.updateCamera = function (dt) {
    if (!this.player || !this.level) {
      return;
    }

    var lookAhead = this.player.facing * Config.camera.lookAhead;
    var targetX = this.player.x + this.player.w / 2 - this.renderer.width / 2 + lookAhead;
    var targetY = this.player.y + this.player.h / 2 - this.renderer.height / 2 - Config.camera.verticalOffset;
    var maxX = Math.max(0, this.level.width - this.renderer.width);
    var maxY = Math.max(0, this.level.height - this.renderer.height);

    targetX = Helpers.clamp(targetX, 0, maxX);
    targetY = Helpers.clamp(targetY, 0, maxY);

    var blend = dt >= 1 ? 1 : 1 - Math.exp(-Config.camera.smoothing * dt);
    this.camera.x += (targetX - this.camera.x) * blend;
    this.camera.y += (targetY - this.camera.y) * blend;
  };

  Game.prototype.updateHud = function () {
    this.scoreValue.textContent = this.score;
    this.coinValue.textContent = this.collectedCoins;
    this.levelValue.textContent = this.levelIndex + 1;
    this.livesValue.textContent = this.player ? this.player.lives : 3;
  };

  Game.prototype.updatePauseButton = function () {
    var canTogglePause = this.state === "playing" || this.state === "paused";

    this.pauseButton.disabled = !canTogglePause;
    this.pauseButton.setAttribute("aria-pressed", this.state === "paused" ? "true" : "false");
    this.pauseButton.setAttribute("aria-label", this.state === "paused" ? "Resume game" : "Pause game");
    this.pauseButton.classList.toggle("is-paused", this.state === "paused");
  };

  window.addEventListener("load", function () {
    new Game();
  });
}());
