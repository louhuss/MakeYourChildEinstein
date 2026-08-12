/* ============================================================
   SCENE-FIRE.JS — Mission « Le Gardien du feu »
   ------------------------------------------------------------
   Un campement au crépuscule, avec Ayla. Le feu commun s'est
   éteint : il faut le rallumer, puis l'entretenir, puis
   l'éteindre complètement avant de repartir.
   Cinq temps :
     1. collecte des matériaux (secs, humides, fins, épais)
     2. assemblage du foyer, en couches, dans le bon ordre
     3. allumage : souffler au bon rythme
     4. entretien : le vent tourne, il faut protéger la flamme
     5. extinction complète, validée avant de pouvoir partir
   Tout est dessiné en code, aucun fichier image.
   Aucune sanction, aucun chronomètre punitif : on explique et
   on recommence. Le bois mort disponible suffit toujours ;
   il n'est jamais nécessaire de couper un arbre vivant.
   Seule variable globale créée par ce fichier : SceneFire.
   ============================================================ */

const SceneFire = class extends Phaser.Scene {

  constructor() { super('Fire'); }

  /* ============================================================
     CYCLE DE VIE
     ============================================================ */
  create() {
    if (typeof UI !== 'undefined' && UI.showHud) { UI.showHud(false); UI.hideAll(); }

    this.W = 960;
    this.H = 600;
    this.busy = false;
    this.closed = false;
    this.step = 'intro';

    /* matériaux à trouver dans la clairière, et ce qu'il en faut */
    this.needed = { amadou: 1, petit_bois_sec: 2, buche_seche: 2, pierre: 3 };
    this.collected = { amadou: 0, petit_bois_sec: 0, buche_seche: 0, pierre: 0 };
    /* réserve encore disponible après l'assemblage du foyer */
    this.reserve = { petit_bois_sec: 0, buche_seche: 0, pierre: 0 };

    /* les trois couches, dans l'ordre attendu */
    this.slotsOrder = ['amadou', 'petit_bois', 'buche'];
    this.slotsFilled = [];

    this.heat = 0;               /* 0-100 : à quel point le feu est vif */
    this.lastTap = 0;
    this.gustActive = false;
    this.gustCount = 0;
    this.missedGust = 0;
    this.lostFlame = false;
    this.extinguished = false;
    this.everLit = false;
    this.entretienLeft = 0;

    this.readLooks();
    this.createDecor();
    this.createFirepit();
    this.createHud();
    this.createHint();

    this.panel = this.add.container(0, 0).setDepth(40);

    this.cameras.main.fadeIn(420, 10, 8, 20);
    this.events.once('shutdown', this.shutdown, this);
    this.time.delayedCall(420, () => this.intro());
  }

  shutdown() {
    if (this.closed) return;
    this.closed = true;
    if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
    this.tweens.killAll();
    if (this.gustEvent) this.gustEvent.remove(false);
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    this.stars.forEach((s) => { s.alpha = 0.5 + Math.sin(time * 0.002 + s.ph) * 0.35; });

    if (this.step === 'allumage') {
      this.heat = Phaser.Math.Clamp(this.heat - 3.2 * dt, 0, 100);
      this.updateGauge();
      this.drawFire();
      if (this.heat >= 72 && !this.busy) this.igniteSuccess();
    } else if (this.step === 'entretien') {
      this.heat = Phaser.Math.Clamp(this.heat - 1.35 * dt, 0, 100);
      if (this.heat <= 0 && !this.lostFlame) this.onFlameLost();
      this.entretienLeft = Math.max(0, this.entretienLeft - dt);
      this.updateGauge();
      this.updateEntretienTimer();
      this.drawFire();
      if (this.entretienLeft <= 0 && this.gustCount >= 3 && !this.busy) this.startExtinction();
    } else {
      this.drawFire();
    }
  }

  /* ============================================================
     PETITS OUTILS (mêmes conventions que les autres missions)
     ============================================================ */
  hex(n) { return '#' + ('000000' + ((n >>> 0) & 0xffffff).toString(16)).slice(-6); }
  shadeN(n, amt) {
    const r = Phaser.Math.Clamp(((n >> 16) & 255) + amt, 0, 255);
    const g = Phaser.Math.Clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = Phaser.Math.Clamp((n & 255) + amt, 0, 255);
    return (r << 16) | (g << 8) | b;
  }
  pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  txt(x, y, str, size, color, bold) {
    const t = this.add.text(x, y, str, {
      fontFamily: '"Trebuchet MS", Verdana, sans-serif',
      fontSize: size + 'px', color: color || '#fff8ee',
      align: 'center', fontStyle: bold === false ? '' : 'bold'
    });
    t.setOrigin(0.5);
    t.setResolution(2);
    return t;
  }

  /* bouton rond ou rectangulaire, avec une zone cliquable élargie */
  button(x, y, w, h, text, color, onClick, sub) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x0b1420, 0.30); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 14);
    g.fillStyle(this.shadeN(color, -46), 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(color, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h - 7, 14);
    g.fillStyle(0xffffff, 0.20); g.fillRoundedRect(-w / 2 + 7, -h / 2 + 6, w - 14, h / 3, 9);
    c.add(g);
    const size = sub ? Math.min(21, Math.floor(h / 3)) : Math.min(24, Math.floor(h / 2.4));
    const t = this.txt(0, sub ? -9 : 0, text, size, '#ffffff');
    c.add(t);
    if (sub) c.add(this.txt(0, 15, sub, 13, '#eaf6ff'));
    c.setSize(w, h);
    const marge = 10;
    c.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2 - marge, -h / 2 - marge, w + marge * 2, h + marge * 2),
      Phaser.Geom.Rectangle.Contains);
    c.on('pointerover', () => { if (!this.busy) this.tweens.add({ targets: c, scale: 1.06, duration: 130, ease: 'Back.out' }); });
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 130, ease: 'Quad.out' }));
    c.on('pointerdown', () => {
      if (this.busy || c.getData('off')) return;
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: 0.92, duration: 80, yoyo: true, ease: 'Quad.out' });
      if (onClick) onClick();
    });
    c.setOff = (off) => { c.setData('off', off); c.setAlpha(off ? 0.4 : 1); };
    return c;
  }

  clearPanel() {
    this.panel.list.slice().forEach((o) => this.tweens.killTweensOf(o));
    this.panel.removeAll(true);
  }

  toast(text) { if (typeof UI !== 'undefined' && UI.toast) UI.toast(text); }

  /* dialogue d'Ayla : occupe l'écran, on bloque les clics du jeu pendant ce temps */
  say(lines, onDone) {
    const done = onDone || function () { };
    if (typeof UI !== 'undefined' && UI.say) {
      this.busy = true;
      UI.say('Ayla', this.aylaPortrait, lines, () => { this.busy = false; done(); });
    } else { done(); }
  }

  /* dialogue avec des choix : le "done" de UI.say n'est pas utilisé ici
     (voir ui.js), on réactive donc les clics dans chaque choix. */
  sayChoices(lines, choices) {
    if (typeof UI === 'undefined' || !UI.say) { if (choices[0]) choices[0].action(); return; }
    this.busy = true;
    const wrapped = choices.map((c) => ({
      label: c.label, action: () => { this.busy = false; c.action(); }
    }));
    UI.say('Ayla', this.aylaPortrait, lines, null, wrapped);
  }

  /* apparence d'Ayla et du joueur, à partir des données du jeu */
  readLooks() {
    const npc = (typeof GameData !== 'undefined' && GameData.npcs)
      ? GameData.npcs.filter((n) => n.id === 'ayla')[0] : null;
    const look = Object.assign({ skin: 3, hair: 2, hairColor: 6, outfit: 3, cloth: 8, pants: 10, shoes: 11, hat: 'aucun' }, (npc && npc.look) || {});
    this.aylaLook = look;
    this.aylaName = (npc && npc.name) || 'Ayla';
    this.aylaPortrait = ((typeof LPC !== 'undefined' && LPC.disponible())
      ? LPC.portrait(this, LPC.lookPnj('ayla'), 96) : null) || Art.portrait(look, '#e0762f');
  }

  /* ============================================================
     DÉCOR : ciel du soir, silhouette d'arbres, clairière humide
     ============================================================ */
  createDecor() {
    const g = this.add.graphics().setDepth(0);
    /* dégradé de crépuscule, en bandes (comme le reste du jeu) */
    const sky = ['#241c38', '#372a4a', '#513f5c', '#79546a', '#a8715f', '#c98a5b'];
    const bandH = 300 / sky.length;
    sky.forEach((c, i) => { g.fillStyle(Phaser.Display.Color.HexStringToColor(c).color, 1); g.fillRect(0, i * bandH, this.W, bandH + 1); });
    /* le sol, herbe sombre et détrempée après l'orage */
    g.fillStyle(0x2c3a24, 1); g.fillRect(0, 300, this.W, this.H - 300);
    g.fillStyle(0x263521, 1);
    for (let i = 0; i < 10; i++) g.fillEllipse(60 + i * 92, 320 + (i % 3) * 8, 70, 14);
    /* quelques flaques */
    g.fillStyle(0x36506a, 0.55);
    [[150, 470], [700, 350], [860, 500]].forEach((p) => g.fillEllipse(p[0], p[1], 46, 16));

    /* lune et étoiles */
    g.fillStyle(0xf3ecd8, 1); g.fillCircle(120, 70, 26);
    g.fillStyle(0x241c38, 0.5); g.fillCircle(132, 62, 24);
    this.stars = [];
    for (let i = 0; i < 26; i++) {
      const s = this.add.circle(Phaser.Math.Between(0, this.W), Phaser.Math.Between(10, 250), Phaser.Math.FloatBetween(0.6, 1.6), 0xffffff, 0.8).setDepth(0);
      s.ph = Math.random() * 10;
      this.stars.push(s);
    }

    /* silhouette de la forêt humide, à l'horizon */
    const t = this.add.graphics().setDepth(1);
    t.fillStyle(0x151d10, 1);
    let x = -20;
    while (x < this.W + 40) {
      const w = Phaser.Math.Between(40, 90), h = Phaser.Math.Between(70, 150);
      t.fillTriangle(x, 300, x + w / 2, 300 - h, x + w, 300);
      x += w * 0.62;
    }

    /* Ayla, assise près du foyer éteint (à l'écart des piles de la collecte) */
    const ayla = ((typeof LPC !== 'undefined' && LPC.disponible())
      ? LPC.spriteFixe(this, LPC.lookPnj('ayla'), 900, 430, 1.7) : null);
    if (!ayla) {
      Art.character(this, 'gf_ayla', this.aylaLook);
      this.add.sprite(900, 418, 'gf_ayla', 0).setScale(2.1).setDepth(6);
    } else ayla.setDepth(6);
  }

  /* ============================================================
     LE FOYER : pierres, cendres, braises, flamme
     ============================================================ */
  createFirepit() {
    this.pitX = 480; this.pitY = 430;
    const ring = this.add.graphics().setDepth(5);
    ring.fillStyle(0x241c38, 0.25); ring.fillEllipse(this.pitX, this.pitY + 26, 130, 34);
    const stones = 10;
    for (let i = 0; i < stones; i++) {
      const a = (i / stones) * Math.PI * 2;
      const rx = 58, ry = 24;
      const sx = this.pitX + Math.cos(a) * rx, sy = this.pitY + 12 + Math.sin(a) * ry;
      ring.fillStyle(0x8a8a86, 1); ring.fillCircle(sx, sy, 9);
      ring.fillStyle(0x6b6b66, 1); ring.fillCircle(sx + 2, sy + 2, 6);
    }
    this.fireG = this.add.graphics().setDepth(7);
    this.drawFire();
  }

  /* dessine le foyer selon l'état courant (avant allumage, flamme, cendres) */
  drawFire() {
    const g = this.fireG; g.clear();
    const x = this.pitX, y = this.pitY + 6;
    if (this.extinguished) {
      g.fillStyle(0x3a3a38, 1); g.fillEllipse(x, y, 60, 16);
      g.fillStyle(0x24211f, 0.6); g.fillEllipse(x, y - 2, 30, 8);
      return;
    }
    if (this.heat <= 0) {
      /* pas encore allumé, ou braise perdue : juste des cendres et du bois */
      g.fillStyle(0x4a3a28, 1); g.fillRect(x - 26, y - 6, 52, 8);
      g.fillStyle(0x6b5236, 1); g.fillRect(x - 18, y - 12, 36, 6);
      if (this.step === 'entretien') { g.fillStyle(0xd9d3c4, 0.5); g.fillEllipse(x, y - 16, 16, 26); }
      return;
    }
    const k = this.heat / 100;
    const flick = Math.sin(this.time && this.time.now ? this.time.now * 0.012 : 0) * 3 * k;
    /* bûches */
    g.fillStyle(0x4a3320, 1); g.fillRect(x - 24, y - 4, 48, 8);
    g.fillStyle(0x6b4a2c, 1); g.fillRect(x - 16, y - 10, 32, 6);
    /* braises */
    g.fillStyle(0xe86a2f, 0.9 * Math.min(1, k + 0.3)); g.fillEllipse(x, y - 6, 30, 10);
    /* flamme, hauteur proportionnelle à la chaleur */
    const hgt = 18 + k * 70;
    g.fillStyle(0xffce54, 0.95);
    g.fillTriangle(x - 16 + flick, y - 8, x + flick * 0.6, y - 8 - hgt, x + 16 + flick, y - 8);
    g.fillStyle(0xff8f3d, 1);
    g.fillTriangle(x - 10 + flick, y - 8, x + flick * 0.4, y - 10 - hgt * 0.62, x + 10 + flick, y - 8);
    g.fillStyle(0xfff3c2, 1);
    g.fillTriangle(x - 4, y - 8, x, y - 10 - hgt * 0.3, x + 4, y - 8);
  }

  /* ============================================================
     BARRE D'ÉTAT ET CONSIGNE
     ============================================================ */
  createHud() {
    const c = this.add.container(0, 0).setDepth(200);
    const g = this.add.graphics();
    g.fillStyle(0x1a1024, 0.92); g.fillRect(0, 0, this.W, 46);
    g.fillStyle(0xe0a15a, 0.55); g.fillRect(0, 44, this.W, 3);
    c.add(g);
    c.add(this.txt(18, 23, '🔥 Le Gardien du feu', 21, '#ffe9c9').setOrigin(0, 0.5));
    this.stepText = this.txt(480, 23, '', 17, '#f2d9a8');
    c.add(this.stepText);
    c.add(this.button(886, 23, 128, 34, 'Quitter', 0xe8663d, () => this.tryLeave()));
    this.setStep('');
  }
  setStep(s) { this.stepText.setText(s); }

  createHint() {
    this.hintBox = this.add.container(this.W / 2, 90).setDepth(150);
    const g = this.add.graphics();
    g.fillStyle(0x1a1024, 0.80); g.fillRoundedRect(-360, -32, 720, 64, 16);
    g.lineStyle(3, 0xe0a15a, 0.85); g.strokeRoundedRect(-360, -32, 720, 64, 16);
    this.hintText = this.add.text(0, 0, '', {
      fontFamily: '"Trebuchet MS", Verdana, sans-serif', fontSize: '19px', color: '#fff8ee',
      fontStyle: 'bold', align: 'center', wordWrap: { width: 680 }
    }).setOrigin(0.5);
    this.hintBox.add([g, this.hintText]);
  }
  setHint(line1, line2) {
    this.hintText.setText(line2 ? line1 + '\n' + line2 : line1);
    this.tweens.killTweensOf(this.hintBox);
    this.hintBox.setScale(0.94);
    this.tweens.add({ targets: this.hintBox, scale: 1, duration: 220, ease: 'Back.out' });
  }

  /* jauge de chaleur, visible pendant l'allumage et l'entretien */
  createGauge() {
    this.gaugeBox = this.add.container(60, 300).setDepth(150);
    const g = this.add.graphics();
    g.fillStyle(0x1a1024, 0.6); g.fillRoundedRect(-16, -110, 32, 220, 12);
    g.lineStyle(2, 0xe0a15a, 0.8); g.strokeRoundedRect(-16, -110, 32, 220, 12);
    this.gaugeFill = this.add.graphics();
    this.gaugeBox.add([g, this.gaugeFill]);
    this.panel.add(this.gaugeBox);
    this.gaugeBox.add(this.txt(0, -128, '🔥', 22));
    this.updateGauge();
  }
  updateGauge() {
    if (!this.gaugeFill) return;
    const k = this.heat / 100;
    const h = 216 * k;
    this.gaugeFill.clear();
    const col = k > 0.66 ? 0xffce54 : k > 0.3 ? 0xe0762f : 0xb04a2c;
    this.gaugeFill.fillStyle(col, 1);
    this.gaugeFill.fillRoundedRect(-14, 108 - h, 28, h, 10);
  }

  tryLeave() {
    if (this.busy) return;
    if (!this.everLit || this.extinguished || this.step === 'done') { this.leave(); return; }
    this.sayChoices([
      "Attends ! Le feu est encore allumé.",
      "Il faut l'éteindre complètement avant de partir, sinon il pourrait reprendre tout seul."
    ], [
      { label: '🔥 Retourner éteindre le feu', action: () => { } },
      { label: 'Partir quand même', action: () => this.leaveUnfinished() }
    ]);
  }
  leave() {
    if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
    this.scene.start('Village');
  }
  leaveUnfinished() {
    if (typeof State !== 'undefined' && State.log) {
      State.log('Parti du campement sans éteindre le feu', 'quest');
      State.save();
    }
    this.leave();
  }

  /* ============================================================
     1. INTRODUCTION
     ============================================================ */
  intro() {
    this.step = 'intro';
    this.setStep('Étape 1 / 5 — La rencontre');
    this.setHint('Ayla a besoin d\'aide', 'Le feu du campement s\'est éteint.');
    this.say([
      "Le feu du campement s'est éteint cette nuit, et personne ne se souvient comment il avait été allumé la première fois.",
      "La nuit va être froide. Tu veux bien m'aider à le rallumer ?",
      "Il y a tout ce qu'il faut dans la clairière : mais certains bois sont encore humides après l'orage.",
      "Le bois mort suffira très largement, inutile de toucher aux jeunes arbres."
    ], () => this.startCollecte());
  }

  /* ============================================================
     2. COLLECTE
     ============================================================ */
  startCollecte() {
    this.step = 'collecte';
    this.setStep('Étape 2 / 5 — La collecte');
    this.setHint('Ramasse ce qu\'il faut', 'Certains bois sont humides : ils fument au lieu de prendre.');
    this.clearPanel();
    this.buildChecklist();
    this.buildPiles();
  }

  buildChecklist() {
    const box = this.add.container(16, 106).setDepth(150);
    const g = this.add.graphics();
    g.fillStyle(0x1a1024, 0.72); g.fillRoundedRect(0, 0, 250, 122, 14);
    g.lineStyle(2, 0xe0a15a, 0.7); g.strokeRoundedRect(0, 0, 250, 122, 14);
    box.add(g);
    const rows = [
      ['amadou', '🌾', 'Amadou'],
      ['petit_bois_sec', '🌿', 'Petit bois sec'],
      ['buche_seche', '🪵', 'Bûches sèches'],
      ['pierre', '🪨', 'Pierres']
    ];
    this.checkTexts = {};
    rows.forEach((r, i) => {
      box.add(this.txt(24, 20 + i * 26, r[1], 18).setOrigin(0.5));
      const t = this.txt(45, 20 + i * 26, r[2], 15, '#fff8ee', false).setOrigin(0, 0.5);
      box.add(t);
      const n = this.txt(232, 20 + i * 26, '0/' + this.needed[r[0]], 15, '#f2d9a8', true).setOrigin(1, 0.5);
      box.add(n);
      this.checkTexts[r[0]] = n;
    });
    this.panel.add(box);
    this.checklistBox = box;
  }

  updateChecklist() {
    Object.keys(this.needed).forEach((k) => {
      const t = this.checkTexts[k];
      if (!t) return;
      t.setText(this.collected[k] + '/' + this.needed[k]);
      t.setColor(this.collected[k] >= this.needed[k] ? '#8fe08a' : '#f2d9a8');
    });
  }

  buildPiles() {
    const defs = [
      { id: 'amadou', mat: 'amadou', x: 90, y: 360 },
      { id: 'petit_bois_sec', mat: 'petit_bois_sec', x: 270, y: 360 },
      { id: 'petit_bois_sec', mat: 'petit_bois_sec', x: 450, y: 360 },
      { id: 'petit_bois_humide', mat: 'petit_bois_humide', x: 630, y: 360 },
      { id: 'buche_seche', mat: 'buche_seche', x: 810, y: 360 },
      { id: 'buche_seche', mat: 'buche_seche', x: 90, y: 490 },
      { id: 'buche_humide', mat: 'buche_humide', x: 270, y: 490 },
      { id: 'pierre', mat: 'pierre', x: 450, y: 490 },
      { id: 'pierre', mat: 'pierre', x: 630, y: 490 },
      { id: 'pierre', mat: 'pierre', x: 810, y: 490 }
    ];
    this.piles = [];
    defs.forEach((d) => {
      const def = GameData.fireMaterials.filter((m) => m.id === d.mat)[0];
      const humide = def.humidity === 'humide';
      const c = this.add.container(d.x, d.y).setDepth(8);
      const g = this.add.graphics();
      g.fillStyle(0x1a1024, 0.35); g.fillEllipse(0, 30, 60, 16);
      g.fillStyle(humide ? 0x3f5a72 : 0x6b5236, 1); g.fillRoundedRect(-34, -30, 68, 60, 14);
      g.lineStyle(2, humide ? 0x8fc4e0 : 0xe0a15a, 0.9); g.strokeRoundedRect(-34, -30, 68, 60, 14);
      c.add(g);
      c.add(this.txt(0, -6, def.emoji, def.epaisseur === 'epais' ? 32 : 26));
      if (humide) c.add(this.txt(20, -22, '💧', 15));
      c.setSize(76, 68);
      c.setInteractive(new Phaser.Geom.Rectangle(-40, -36, 80, 76), Phaser.Geom.Rectangle.Contains);
      c.on('pointerover', () => { if (!this.busy) this.tweens.add({ targets: c, scale: 1.08, duration: 120 }); });
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerdown', () => this.collectPile(c, d.mat, def));
      this.panel.add(c);
      this.piles.push(c);
    });
  }

  collectPile(c, matId, def) {
    if (this.busy || c.getData('gone')) return;
    if (def.humidity === 'humide') {
      /* on ne ramasse pas un bois humide : il fume, on l'explique et on continue */
      const smoke = this.add.text(c.x, c.y - 30, '💨', { fontSize: '22px' }).setOrigin(0.5).setDepth(20);
      this.panel.add(smoke);
      this.tweens.add({ targets: smoke, y: smoke.y - 30, alpha: 0, duration: 700, onComplete: () => smoke.destroy() });
      this.setHint('Ce bois est encore humide', 'Il fume au lieu de prendre : cherche-en un bien sec.');
      return;
    }
    c.setData('gone', true);
    this.collected[matId] = (this.collected[matId] || 0) + 1;
    this.updateChecklist();
    this.toast('+1 ' + def.name);
    this.tweens.add({
      targets: c, scale: 0, alpha: 0, duration: 220, ease: 'Back.in',
      onComplete: () => c.destroy()
    });
    const done = Object.keys(this.needed).every((k) => this.collected[k] >= this.needed[k]);
    if (done) this.time.delayedCall(260, () => this.finishCollecte());
  }

  finishCollecte() {
    if (this.step !== 'collecte') return;
    this.step = 'wait';
    this.reserve.petit_bois_sec = this.collected.petit_bois_sec - 1;
    this.reserve.buche_seche = this.collected.buche_seche - 1;
    this.reserve.pierre = this.collected.pierre;
    this.say([
      "Tu as tout ce qu'il faut : de l'amadou bien sec, du petit bois et des bûches, et des pierres pour couper le vent.",
      "Il ne reste plus qu'à construire le foyer, couche par couche."
    ], () => this.startAssemblage());
  }

  /* ============================================================
     3. ASSEMBLAGE
     ============================================================ */
  startAssemblage() {
    this.step = 'assemblage';
    this.setStep('Étape 3 / 5 — L\'assemblage');
    this.setHint('Construis le foyer', 'Commence par ce qui prend feu le plus vite.');
    this.clearPanel();
    this.slotsFilled = [];

    /* trois emplacements, du premier posé au dernier */
    this.slotUi = [];
    const slotX = [330, 480, 630];
    slotX.forEach((x, i) => {
      const c = this.add.container(x, 220).setDepth(10);
      const g = this.add.graphics();
      g.lineStyle(3, 0xe0a15a, 0.9); g.strokeCircle(0, 0, 36);
      g.fillStyle(0x1a1024, 0.4); g.fillCircle(0, 0, 36);
      c.add(g);
      c.add(this.txt(0, -50, String(i + 1), 16, '#f2d9a8'));
      this.panel.add(c);
      this.slotUi.push({ c, g, icon: null });
    });

    /* la trousse : les matériaux secs collectés, cliquables */
    const trayDefs = [
      { kind: 'amadou', id: 'amadou' },
      { kind: 'petit_bois', id: 'petit_bois_sec' },
      { kind: 'buche', id: 'buche_seche' }
    ];
    this.trayUi = {};
    trayDefs.forEach((t, i) => {
      const def = GameData.fireMaterials.filter((m) => m.id === t.id)[0];
      const c = this.button(300 + i * 180, 500, 150, 64, def.emoji + ' ' + def.name, 0x6b5236,
        () => this.tryPlace(t.kind, t.id, c), 'x' + this.collected[t.id]);
      this.panel.add(c);
      this.trayUi[t.id] = c;
    });

    this.reserveText = this.txt(this.W / 2, 560, '', 14, '#f2d9a8');
    this.panel.add(this.reserveText);
    this.updateTrayCounts();
  }

  updateTrayCounts() {
    ['amadou', 'petit_bois_sec', 'buche_seche'].forEach((id) => {
      const c = this.trayUi[id];
      if (!c) return;
      const left = c.list[2];
      if (left) left.setText('x' + this.collected[id]);
      c.setOff(this.collected[id] <= 0);
    });
    this.reserveText.setText('En réserve pour la suite : ' + this.reserve.pierre + ' pierres 🪨');
  }

  tryPlace(kind, id, trayBtn) {
    if (this.busy) return;
    const need = this.slotsOrder[this.slotsFilled.length];
    if (!need) return;
    if (kind !== need) {
      /* ordre incorrect : on refuse toujours, on explique pourquoi */
      const slot = this.slotUi[this.slotsFilled.length];
      this.tweens.add({ targets: slot.c, x: slot.c.x + 8, duration: 60, yoyo: true, repeat: 3 });
      const messages = {
        amadou: "Il faut d'abord une matière très fine, qui prend au moindre contact : l'amadou.",
        petit_bois: "Avant la bûche, il faut du petit bois : c'est lui qui fait grandir la flamme.",
        buche: "La bûche vient en dernier : elle est trop épaisse pour prendre toute seule."
      };
      this.setHint('Pas encore !', messages[need]);
      return;
    }
    if (this.collected[id] <= 0) return;
    this.collected[id]--;
    if (id !== 'amadou') this.reserve[id] = Math.max(0, this.collected[id] - 0);
    this.updateTrayCounts();

    const slot = this.slotUi[this.slotsFilled.length];
    const def = GameData.fireMaterials.filter((m) => m.id === id)[0];
    const icon = this.txt(slot.c.x, slot.c.y, def.emoji, 28).setDepth(11);
    icon.setScale(0.2); icon.setAlpha(0);
    this.panel.add(icon);
    this.tweens.add({ targets: icon, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    slot.icon = icon;
    this.slotsFilled.push(kind);
    this.toast(def.name + ' posé !');

    if (this.slotsFilled.length >= 3) this.time.delayedCall(400, () => this.finishAssemblage());
  }

  finishAssemblage() {
    if (this.step !== 'assemblage') return;
    this.step = 'wait';
    this.say([
      "Le foyer est prêt, couche par couche, dans le bon ordre.",
      "Il ne manque plus qu'une étincelle. Souffle doucement, ni trop fort, ni trop faible."
    ], () => this.startAllumage());
  }

  /* ============================================================
     4. ALLUMAGE
     ============================================================ */
  startAllumage() {
    this.step = 'allumage';
    this.setStep('Étape 4 / 5 — L\'allumage');
    this.setHint('Souffle au bon rythme', 'Un souffle trop fort étouffe l\'étincelle.');
    this.clearPanel();
    this.heat = 4;
    this.lastTap = 0;
    this.createGauge();
    this.blowBtn = this.button(this.W / 2, 500, 220, 78, '💨 Souffler', 0xe0762f, () => this.tapBlow());
    this.panel.add(this.blowBtn);
  }

  tapBlow() {
    const now = this.time.now;
    const gap = this.lastTap ? now - this.lastTap : 900;
    this.lastTap = now;
    if (gap < 220) {
      this.heat = Phaser.Math.Clamp(this.heat - 10, 0, 100);
      this.setHint('Doucement !', 'Un souffle trop fort étouffe l\'étincelle.');
      this.tweens.add({ targets: this.blowBtn, angle: -4, duration: 60, yoyo: true, repeat: 2 });
    } else {
      this.heat = Phaser.Math.Clamp(this.heat + 11, 0, 100);
      this.tweens.add({ targets: this.blowBtn, scale: 1.1, duration: 90, yoyo: true });
      if (gap > 1500) this.setHint('Continue comme ça', 'Un peu plus régulièrement, sans t\'arrêter trop longtemps.');
    }
    this.updateGauge();
  }

  igniteSuccess() {
    if (this.step !== 'allumage') return;
    this.step = 'wait';
    this.everLit = true;
    this.heat = 55;
    this.say([
      "Ça y est, le feu a pris !",
      "Maintenant, il faut le garder vivant. Le vent peut se lever : les pierres t'aideront à le protéger."
    ], () => this.startEntretien());
  }

  /* ============================================================
     5. ENTRETIEN
     ============================================================ */
  startEntretien() {
    this.step = 'entretien';
    this.setStep('Étape 5 / 5 — L\'entretien');
    this.setHint('Garde le feu vivant', 'Ajoute du bois si besoin, et protège la flamme du vent.');
    this.clearPanel();
    this.createGauge();
    this.gustActive = false;
    this.gustCount = 0;
    this.entretienLeft = 24;

    this.timerText = this.txt(this.W / 2, 130, '', 16, '#f2d9a8');
    this.panel.add(this.timerText);

    this.protectBtn = this.button(300, 500, 210, 70, '🛡️ Protéger', 0x4c7fb8, () => this.onProtect());
    this.protectBtn.setOff(true);
    this.panel.add(this.protectBtn);

    this.woodBtn = this.button(660, 500, 210, 70, '🌿 Ajouter du bois', 0x6b5236, () => this.onAddWood(), 'réserve : ' + (this.reserve.petit_bois_sec + this.reserve.buche_seche));
    this.panel.add(this.woodBtn);

    this.gustIcon = this.add.text(this.pitX, this.pitY - 90, '', { fontSize: '30px' }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.panel.add(this.gustIcon);

    this.scheduleGust();
  }

  updateEntretienTimer() {
    if (this.timerText) this.timerText.setText('La nuit avance… ' + Math.ceil(this.entretienLeft) + ' s');
  }

  scheduleGust() {
    if (this.step !== 'entretien') return;
    const delay = Phaser.Math.Between(4200, 6200);
    this.gustEvent = this.time.delayedCall(delay, () => this.triggerGust());
  }

  triggerGust() {
    if (this.step !== 'entretien') return;
    this.gustCount++;
    this.gustActive = true;
    const cote = this.pick(['gauche', 'droite']);
    this.gustIcon.setText(cote === 'gauche' ? '💨➡️' : '⬅️💨');
    this.gustIcon.setPosition(cote === 'gauche' ? this.pitX - 220 : this.pitX + 220, this.pitY - 40);
    this.gustIcon.setAlpha(1);
    this.setHint('Rafale de vent !', 'Clique sur « Protéger » avant qu\'elle n\'atteigne la flamme.');
    this.protectBtn.setOff(this.reserve.pierre <= 0);
    this.tweens.add({
      targets: this.gustIcon, x: this.pitX, duration: 1500, ease: 'Quad.in',
      onComplete: () => this.resolveGust(false)
    });
  }

  onProtect() {
    if (!this.gustActive || this.reserve.pierre <= 0) return;
    this.reserve.pierre--;
    this.resolveGust(true);
  }

  resolveGust(protege) {
    if (!this.gustActive) return;
    this.gustActive = false;
    this.tweens.killTweensOf(this.gustIcon);
    this.tweens.add({ targets: this.gustIcon, alpha: 0, duration: 200 });
    this.protectBtn.setOff(true);
    if (protege) {
      this.toast('Flamme bien protégée !');
      this.setHint('Bien joué', 'Le paravent de pierres a coupé le vent.');
    } else {
      this.heat = Phaser.Math.Clamp(this.heat - 20, 0, 100);
      this.missedGust++;
      this.setHint('Le vent a atteint la flamme', 'La prochaine fois, protège-la avec les pierres à temps.');
      this.updateGauge();
    }
    if (this.step === 'entretien') this.scheduleGust();
  }

  onAddWood() {
    if (this.reserve.petit_bois_sec > 0) { this.reserve.petit_bois_sec--; this.heat = Phaser.Math.Clamp(this.heat + 14, 0, 100); }
    else if (this.reserve.buche_seche > 0) { this.reserve.buche_seche--; this.heat = Phaser.Math.Clamp(this.heat + 20, 0, 100); }
    else { this.toast('Il ne reste plus de bois en réserve.'); return; }
    this.updateGauge();
    const left = this.woodBtn.list[2];
    if (left) left.setText('réserve : ' + (this.reserve.petit_bois_sec + this.reserve.buche_seche));
    this.tweens.add({ targets: this.woodBtn, scale: 1.06, duration: 90, yoyo: true });
  }

  onFlameLost() {
    this.lostFlame = true;
    this.heat = 6; /* petite braise qui repart, pour pouvoir continuer */
    this.setHint('La flamme faiblit beaucoup', 'Ajoute du bois vite, sinon il faudra tout recommencer.');
  }

  /* ============================================================
     6. EXTINCTION
     ============================================================ */
  startExtinction() {
    if (this.step === 'extinction') return;
    this.step = 'extinction';
    if (this.gustEvent) this.gustEvent.remove(false);
    this.setStep('Avant de partir — l\'extinction');
    this.clearPanel();
    this.createGauge();
    this.setHint('N\'oublie pas d\'éteindre le feu', 'Un feu mal éteint peut reprendre tout seul.');
    this.say([
      "La nuit a été bonne, le foyer a bien tenu.",
      "Mais avant de partir, il faut éteindre complètement le feu : jamais de braise active derrière soi."
    ], () => {
      this.extinguishBtn = this.button(this.W / 2, 500, 260, 78, '💧 Étouffer le feu', 0x4c7fb8, () => this.doExtinguish());
      this.panel.add(this.extinguishBtn);
    });
  }

  doExtinguish() {
    if (this.extinguished) return;
    this.extinguished = true;
    this.clearPanel();
    const smoke = this.add.text(this.pitX, this.pitY - 20, '💨', { fontSize: '40px' }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: smoke, y: smoke.y - 60, alpha: 0, scale: 1.6, duration: 1200, onComplete: () => smoke.destroy() });
    this.heat = 0;
    this.drawFire();
    this.setHint('Feu complètement éteint', 'Plus aucune braise active : le campement est en sécurité.');
    this.time.delayedCall(700, () => this.finish());
  }

  /* ============================================================
     7. BILAN ET RÉCOMPENSES
     ============================================================ */
  finish() {
    this.step = 'done';
    this.setStep('Mission terminée !');
    const parfait = this.missedGust === 0 && !this.lostFlame;
    const bilan = [
      "Merci, vraiment. Le campement va passer une nuit tranquille.",
      parfait
        ? "Tu n'as jamais laissé la flamme faiblir : ce foyer tiendra toute la nuit sans qu'on ait besoin d'y retoucher."
        : "Le foyer a vacillé une ou deux fois, mais il tient. Il faudra peut-être le raviver un peu à la prochaine visite.",
      "Souviens-toi : le bois mort a suffi, on n'a jamais eu besoin de toucher à un arbre vivant.",
      "Et surtout, on n'a jamais laissé de braise active derrière nous."
    ];
    this.say(bilan, () => this.giveRewards(parfait));
  }

  giveRewards(parfait) {
    const total = parfait ? 48 : 38;
    const fiches = ['ency_feu_1', 'ency_feu_2', 'ency_feu_3'];

    if (typeof State !== 'undefined' && State.get && State.get()) {
      State.addPoints(total);
      fiches.forEach((id) => State.discover(id));
      State.addBadge('feu');
      State.completeQuest('feu');
      const inv = State.get().inventory;
      inv.foyer_abrite = (inv.foyer_abrite || 0) + 1;
      State.log('Feu du campement rallumé et éteint proprement : ' + total + ' piécettes', 'quest');
      State.save();
    }

    const back = () => {
      if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
      this.scene.start('Village', { from: 'feu' });
    };

    if (typeof UI !== 'undefined' && UI.rewardPanel) {
      UI.rewardPanel({
        points: total, badge: 'feu', ency: fiches, item: 'foyer_abrite',
        title: 'Mission terminée !'
      }, back);
    } else back();
  }
};
