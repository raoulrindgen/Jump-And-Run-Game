(function () {
  "use strict";

  window.SunnyGame = window.SunnyGame || {};

  function AudioManager() {
    this.context = null;
    this.enabled = true;
  }

  AudioManager.prototype.ensureContext = function () {
    if (!this.enabled) {
      return null;
    }

    if (!this.context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return null;
      }
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    return this.context;
  };

  AudioManager.prototype.playTone = function (options) {
    var context = this.ensureContext();
    if (!context) {
      return;
    }

    var now = context.currentTime;
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    var duration = options.duration || 0.14;

    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(options.frequency || 440, now);

    if (options.toFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(options.toFrequency, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  AudioManager.prototype.jump = function () {
    this.playTone({ frequency: 420, toFrequency: 700, duration: 0.13, volume: 0.08, type: "triangle" });
  };

  AudioManager.prototype.coin = function () {
    this.playTone({ frequency: 880, toFrequency: 1320, duration: 0.12, volume: 0.1, type: "sine" });
  };

  AudioManager.prototype.hit = function () {
    this.playTone({ frequency: 220, toFrequency: 120, duration: 0.22, volume: 0.11, type: "sawtooth" });
  };

  AudioManager.prototype.checkpoint = function () {
    this.playTone({ frequency: 580, toFrequency: 980, duration: 0.2, volume: 0.09, type: "triangle" });
  };

  AudioManager.prototype.finish = function () {
    this.playTone({ frequency: 660, toFrequency: 1040, duration: 0.25, volume: 0.1, type: "square" });
  };

  AudioManager.prototype.gameOver = function () {
    this.playTone({ frequency: 180, toFrequency: 70, duration: 0.55, volume: 0.1, type: "triangle" });
  };

  SunnyGame.AudioManager = AudioManager;
}());
