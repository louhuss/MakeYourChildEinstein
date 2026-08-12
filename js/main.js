/* ============================================================
   MAIN.JS — configuration de Phaser et démarrage du jeu.
   ============================================================ */

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  render: { pixelArt: true, antialias: false, roundPixels: true, mipmapFilter: 'NEAREST' },
  backgroundColor: '#8fd0f0',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [SceneBoot, SceneTitle, SceneCreator, SceneVillage, SceneFishing, SceneFarm, SceneFire, ScenePlot]
});

/* petite musique d'ambiance générée en code (aucun fichier audio) */
const Ambience = (function () {
  let ctx = null, master = null, timer = null;
  const scale = [0, 2, 4, 7, 9, 12, 14];
  function start() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = (State.get().settings.music || 0) * 0.12;
      master.connect(ctx.destination);
      loop();
    } catch (e) { }
  }
  function note(freq, dur, type, when) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.25, when + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.05);
  }
  function loop() {
    timer = setInterval(function () {
      if (!ctx || master.gain.value <= 0.001) return;
      const t = ctx.currentTime;
      const root = 220;
      const step = scale[Math.floor(Math.random() * scale.length)];
      note(root * Math.pow(2, step / 12), 0.6, 'triangle', t);
      if (Math.random() > 0.55) {
        const s2 = scale[Math.floor(Math.random() * scale.length)];
        note(root * 2 * Math.pow(2, s2 / 12), 0.4, 'sine', t + 0.35);
      }
      note(110, 0.9, 'sine', t);
    }, 1400);
  }
  function setVolume(v) { if (master) master.gain.value = v * 0.12; }
  return { start: start, setVolume: setVolume };
})();

window.addEventListener('pointerdown', function once() {
  Ambience.start();
  window.removeEventListener('pointerdown', once);
});
