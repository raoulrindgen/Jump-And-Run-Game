(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  var Config = SunnyGame.Config;
  var Helpers = SunnyGame.Helpers;

  function Player(startX, startY, lives) {
    this.w = Config.player.width;
    this.h = Config.player.height;
    this.x = startX;
    this.y = startY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsUsed = 0;
    this.invincibleTimer = 0;
    this.lives = lives || 3;
    this.spawn = { x: startX, y: startY - this.h };
    this.animationTime = 0;
    this.state = "idle";
  }

  Player.prototype.rect = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  Player.prototype.setSpawn = function (x, y) {
    this.spawn.x = x;
    this.spawn.y = y - this.h;
  };

  Player.prototype.respawn = function () {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsUsed = 0;
    this.invincibleTimer = Config.player.respawnInvincible;
  };

  Player.prototype.update = function (dt, level, input, particles, audio) {
    var desired = 0;
    var wasOnGround = this.onGround;

    this.animationTime += dt;
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);

    if (input.left()) {
      desired -= 1;
    }

    if (input.right()) {
      desired += 1;
    }

    // Buffer early jump presses and keep late presses forgiving with coyote time.
    if (input.consumeJump()) {
      this.jumpBufferTimer = Config.player.jumpBuffer;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    this.coyoteTimer = this.onGround ? Config.player.coyoteTime : Math.max(0, this.coyoteTimer - dt);

    if (this.onGround) {
      this.jumpsUsed = 0;
    } else if (this.coyoteTimer <= 0 && this.jumpsUsed === 0) {
      this.jumpsUsed = 1;
    }

    if (desired !== 0) {
      this.vx += desired * Config.player.moveAcceleration * dt;
      this.facing = desired;
    } else {
      var friction = this.onGround ? Config.player.groundFriction : Config.player.airFriction;
      this.vx = Helpers.approach(this.vx, 0, friction * dt);
    }

    this.vx = Helpers.clamp(this.vx, -Config.player.maxSpeed, Config.player.maxSpeed);

    if (this.jumpBufferTimer > 0) {
      var canGroundJump = this.coyoteTimer > 0 && this.jumpsUsed === 0;
      var canAirJump = !canGroundJump && this.jumpsUsed < Config.player.maxJumps;

      if (canGroundJump || canAirJump) {
        this.vy = canGroundJump ? -Config.player.jumpSpeed : -Config.player.doubleJumpSpeed;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpsUsed += 1;
        this.jumpBufferTimer = 0;
        particles.emitJump(this.x + this.w / 2, this.y + this.h, this.facing);
        audio.jump();
      }
    }

    // Releasing jump early trims upward velocity for variable jump height.
    if (!input.jumpHeld() && this.vy < -260) {
      this.vy = -260;
    }

    this.vy = Math.min(Config.world.maxFallSpeed, this.vy + Config.world.gravity * dt);

    this.x += this.vx * dt;
    this.resolveHorizontal(level.platforms);

    var landingSpeed = this.vy;
    this.y += this.vy * dt;
    this.onGround = false;
    this.resolveVertical(level.platforms);

    if (this.onGround) {
      this.jumpsUsed = 0;
    }

    if (this.onGround && !wasOnGround && landingSpeed > 520) {
      particles.emitJump(this.x + this.w / 2, this.y + this.h, this.facing);
    }

    this.x = Helpers.clamp(this.x, 0, level.width - this.w);

    if (!this.onGround) {
      this.state = "jump";
    } else if (Math.abs(this.vx) > 35) {
      this.state = "run";
    } else {
      this.state = "idle";
    }
  };

  Player.prototype.resolveHorizontal = function (platforms) {
    var rect = this.rect();
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (!Helpers.rectsOverlap(rect, platform)) {
        continue;
      }

      if (this.vx > 0) {
        this.x = platform.x - this.w;
      } else if (this.vx < 0) {
        this.x = platform.x + platform.w;
      }
      this.vx = 0;
      rect = this.rect();
    }
  };

  Player.prototype.resolveVertical = function (platforms) {
    var rect = this.rect();
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (!Helpers.rectsOverlap(rect, platform)) {
        continue;
      }

      if (this.vy > 0) {
        this.y = platform.y - this.h;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = platform.y + platform.h;
        this.vy = 0;
      }
      rect = this.rect();
    }
  };

  Player.prototype.hurt = function (fromX, particles, audio) {
    if (this.invincibleTimer > 0) {
      return false;
    }

    this.lives -= 1;
    this.invincibleTimer = Config.player.respawnInvincible;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsUsed = 1;
    this.vx = fromX < this.x ? Config.player.hurtKnockback : -Config.player.hurtKnockback;
    this.vy = -430;
    particles.emitHit(this.x + this.w / 2, this.y + this.h / 2);
    audio.hit();
    return true;
  };

  function Enemy(data) {
    this.x = data.x;
    this.y = data.y - 34;
    this.w = 42;
    this.h = 34;
    this.vx = data.speed;
    this.vy = 0;
    this.left = data.left;
    this.right = data.right;
    this.speed = data.speed;
    this.animationTime = 0;
  }

  Enemy.prototype.rect = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  Enemy.prototype.update = function (dt, platforms) {
    this.animationTime += dt;
    this.vy = Math.min(Config.world.maxFallSpeed, this.vy + Config.world.gravity * dt);
    this.x += this.vx * dt;

    if (this.x < this.left) {
      this.x = this.left;
      this.vx = Math.abs(this.speed);
    } else if (this.x + this.w > this.right) {
      this.x = this.right - this.w;
      this.vx = -Math.abs(this.speed);
    }

    this.resolveHorizontal(platforms);
    this.y += this.vy * dt;
    this.resolveVertical(platforms);
  };

  Enemy.prototype.resolveHorizontal = function (platforms) {
    var rect = this.rect();
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (!Helpers.rectsOverlap(rect, platform)) {
        continue;
      }

      if (this.vx > 0) {
        this.x = platform.x - this.w;
        this.vx = -Math.abs(this.speed);
      } else if (this.vx < 0) {
        this.x = platform.x + platform.w;
        this.vx = Math.abs(this.speed);
      }
      rect = this.rect();
    }
  };

  Enemy.prototype.resolveVertical = function (platforms) {
    var rect = this.rect();
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (!Helpers.rectsOverlap(rect, platform)) {
        continue;
      }

      if (this.vy > 0) {
        this.y = platform.y - this.h;
        this.vy = 0;
      } else if (this.vy < 0) {
        this.y = platform.y + platform.h;
        this.vy = 0;
      }
      rect = this.rect();
    }
  };

  function Coin(data, index) {
    this.x = data.x;
    this.y = data.y;
    this.w = 26;
    this.h = 26;
    this.index = index;
    this.collected = false;
    this.animationTime = Math.random() * Math.PI * 2;
  }

  Coin.prototype.rect = function () {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  };

  Coin.prototype.update = function (dt) {
    this.animationTime += dt * 5;
  };

  function Checkpoint(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = 40;
    this.h = 90;
    this.active = false;
  }

  Checkpoint.prototype.rect = function () {
    return { x: this.x - 12, y: this.y - this.h, w: this.w, h: this.h };
  };

  function FinishFlag(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = 58;
    this.h = 120;
  }

  FinishFlag.prototype.rect = function () {
    return { x: this.x - 16, y: this.y - this.h, w: this.w, h: this.h };
  };

  SunnyGame.Player = Player;
  SunnyGame.Enemy = Enemy;
  SunnyGame.Coin = Coin;
  SunnyGame.Checkpoint = Checkpoint;
  SunnyGame.FinishFlag = FinishFlag;
}());
