/* ============================================================
   SCENE-FARM.JS — Mission « Fruits, saisons et agriculture »
   Une journée à la ferme avec Maya, en six étapes :
   1. préparer la terre        4. aider les pollinisateurs
   2. choisir les plantations  5. récolter
   3. planter et arroser       6. composer un panier
   Tout est dessiné en code (aucune image à charger).
   Aucune globale créée en dehors de SceneFarm.
   ============================================================ */

const SceneFarm = class extends Phaser.Scene {

  constructor() { super('Farm'); }

  /* ==========================================================
     CYCLE DE VIE
     ========================================================== */
  create() {
    /* la barre d'état du village masquerait la barre de la mission */
    if (typeof UI !== 'undefined' && UI.showHud) { UI.showHud(false); UI.hideAll(); }

    const st = (typeof State !== 'undefined' && State.get) ? State.get() : null;

    this.FONT = '"Trebuchet MS", Verdana, sans-serif';
    this.season = (st && st.season) || 'printemps';
    this.seasonDef = this.seasonById(this.season);

    /* géométrie du potager : 4 colonnes x 3 rangées */
    this.COLS = 4; this.ROWS = 3; this.CELL = 64; this.GAP = 8;
    this.GX = 340; this.GY = 250;

    /* état de la mission */
    this.stepIndex = 0;
    this.cells = [];
    this.plants = [];
    this.flowerSpots = [];
    this.bees = [];
    this.flyers = [];
    this.chosen = [];
    this.step3Done = false;
    this.harvested = [];
    this.basket = [];
    this.basketOffer = [];
    this.overlay = null;
    this.seedCards = [];
    this.selectedCell = null;
    this.selectedSeed = null;
    this.canActive = false;
    this.beeTimer = null;
    this.finished = false;
    this.closed = false;

    this.portrait = this.makePortrait();

    this.buildTextures();
    this.skinKenney();   /* habillage avec les tuiles Kenney */
    this.createFarm();
    this.createHud();

    this.events.once('shutdown', this.shutdown, this);

    this.intro();
  }

  /* Nettoyage : appelé par Phaser et/ou par l'évènement 'shutdown'.
     Écrit pour pouvoir être appelé deux fois sans dégât. */
  shutdown() {
    if (this.closed) return;
    this.closed = true;
    if (this.beeTimer) { this.beeTimer.remove(false); this.beeTimer = null; }
    this.bees = []; this.flyers = [];
    if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
  }

  /* Petits vols : abeilles et papillons tournent en boucle. */
  update(time, delta) {
    const dt = delta / 1000;
    for (let i = 0; i < this.bees.length; i++) {
      const b = this.bees[i];
      b.a += b.sp * dt;
      const nx = b.cx + Math.cos(b.a) * b.rx;
      const ny = b.cy + Math.sin(b.a * 1.7) * b.ry;
      b.s.setFlipX(nx < b.s.x);
      b.s.x = nx; b.s.y = ny;
    }
    for (let j = 0; j < this.flyers.length; j++) {
      const f = this.flyers[j];
      f.a += f.sp * dt;
      const fx = f.cx + Math.cos(f.a) * f.rx;
      const fy = f.cy + Math.sin(f.a * 2.3) * f.ry;
      f.s.setFlipX(fx < f.s.x);
      f.s.x = fx; f.s.y = fy;
    }
  }

  /* ==========================================================
     PETITS OUTILS
     ========================================================== */
  seasonById(id) {
    const s = GameData.seasons.filter(function (x) { return x.id === id; })[0];
    return s || GameData.seasons[0];
  }
  cropById(id) {
    return GameData.crops.filter(function (c) { return c.id === id; })[0];
  }
  inSeason(crop) { return crop.seasons.indexOf(this.season) >= 0; }
  km(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* couleurs : nombre Phaser -> texte CSS, et éclaircir / assombrir */
  hex(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
  shade(n, f) {
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = function (v) { return Math.max(0, Math.min(255, Math.round(v + (f > 0 ? (255 - v) * f : v * f)))); };
    r = m(r); g = m(g); b = m(b);
    return '#' + ('000000' + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
  }

  /* semis de pixels : donne du grain aux aplats */
  speck(ctx, color, n, x0, y0, w, h) {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      ctx.fillRect(x0 + Math.floor(Math.random() * w), y0 + Math.floor(Math.random() * h), 1, 1);
    }
  }

  /* portrait de Maya, dessiné par Art (avec des valeurs complétées) */
  makePortrait() {
    try {
      const npc = GameData.npcs.filter(function (n) { return n.id === 'maya'; })[0];
      const look = Object.assign({ cloth: 3, pants: 5, shoes: 1, glasses: 'aucune' }, npc ? npc.look : {});
      look.hat = 'paille';
      if (typeof LPC !== 'undefined' && LPC.disponible()) {
        const p = LPC.portrait(this, LPC.lookPnj('maya'), 96);
        if (p) return p;
      }
      return Art.portrait(look, '#8fd46a');
    } catch (e) { return null; }
  }

  say(lines, cb) {
    if (typeof UI !== 'undefined' && UI.say) UI.say('Maya', this.portrait, lines, cb);
    else if (cb) cb();
  }
  toast(t) { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); }

  txt(x, y, s, size, color, bold) {
    return this.add.text(x, y, s, {
      fontFamily: this.FONT,
      fontSize: size + 'px',
      color: color || '#3a2c1e',
      fontStyle: bold ? 'bold' : 'normal'
    });
  }

  /* ==========================================================
     TEXTURES : tout le pixel art de la ferme
     ========================================================== */
  buildTextures() {
    const S = this.speck.bind(this);

    /* ---------- décor de fond (240x150, affiché x4) ---------- */
    Art.make(this, 'fm_bg', 240, 150, (x, w, h) => {
      const sky = ['#79c6ee', '#8ed2f2', '#a4dcf6', '#bae6fa', '#d2f0fd'];
      for (let i = 0; i < 5; i++) { x.fillStyle = sky[i]; x.fillRect(0, i * 9, w, 9); }
      x.fillStyle = '#d2f0fd'; x.fillRect(0, 45, w, 13);

      /* soleil */
      x.fillStyle = '#ffd964'; x.beginPath(); x.arc(208, 17, 13, 0, 7); x.fill();
      x.fillStyle = '#fff0ab'; x.beginPath(); x.arc(208, 17, 9, 0, 7); x.fill();

      /* nuages */
      const cloud = function (cx, cy, s) {
        x.fillStyle = '#ffffff';
        x.beginPath();
        x.arc(cx, cy, 5 * s, 0, 7); x.arc(cx + 7 * s, cy - 4 * s, 7 * s, 0, 7); x.arc(cx + 15 * s, cy, 5 * s, 0, 7);
        x.fill();
        x.fillRect(cx - 5 * s, cy, 21 * s, 5 * s);
        x.fillStyle = '#dbeefb'; x.fillRect(cx - 5 * s, cy + 4 * s, 21 * s, 2 * s);
      };
      cloud(26, 16, 1); cloud(110, 11, 0.75); cloud(156, 26, 0.55);

      /* collines */
      x.fillStyle = '#4f8f52';
      for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(i * 40 + 10, 57, 24, Math.PI, 0); x.fill(); }
      x.fillStyle = '#63a55c';
      for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(i * 46 + 32, 59, 17, Math.PI, 0); x.fill(); }

      /* champ, en bandes pour donner de la profondeur */
      x.fillStyle = '#79bd4f'; x.fillRect(0, 56, w, h - 56);
      for (let y = 58; y < h; y += 5) {
        x.fillStyle = (Math.floor(y / 5) % 2) ? '#71b449' : '#84c85a';
        x.fillRect(0, y, w, 3);
      }
      S(x, '#5f9e3c', 520, 0, 56, w, h - 56);
      S(x, '#96d36a', 420, 0, 56, w, h - 56);

      /* chemin de terre qui s'élargit vers nous */
      for (let y = 56; y < h; y++) {
        const t = (y - 56) / (h - 56);
        const cx = 26 + t * 8, wd = 5 + t * 24;
        x.fillStyle = '#c39a63'; x.fillRect(Math.round(cx - wd / 2), y, Math.round(wd), 1);
      }
      S(x, '#a87f4c', 220, 8, 60, 60, 88);
    });

    /* ---------- la grange ---------- */
    Art.make(this, 'fm_barn', 64, 58, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(32, 54, 28, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#c9483c'; x.fillRect(6, 22, 52, 30);
      x.fillStyle = '#a63a30'; x.fillRect(6, 22, 52, 3);
      x.fillStyle = '#e0665a'; x.fillRect(6, 22, 3, 30);
      S(x, '#b84136', 120, 7, 25, 50, 27);
      /* toit */
      x.fillStyle = '#8d5f34';
      x.beginPath(); x.moveTo(32, 2); x.lineTo(62, 23); x.lineTo(2, 23); x.closePath(); x.fill();
      x.fillStyle = '#a87244';
      x.beginPath(); x.moveTo(32, 2); x.lineTo(62, 23); x.lineTo(46, 23); x.closePath(); x.fill();
      x.fillStyle = '#6f4a28'; x.fillRect(2, 21, 60, 2);
      /* grande porte */
      x.fillStyle = '#e6d2ab'; x.fillRect(22, 30, 20, 22);
      x.fillStyle = '#8d5f34';
      x.fillRect(22, 30, 20, 2); x.fillRect(31, 30, 2, 22); x.fillRect(22, 40, 20, 2);
      x.fillStyle = '#c9a06a'; x.fillRect(22, 50, 20, 2);
      /* lucarne */
      x.fillStyle = '#f2e9d8'; x.beginPath(); x.arc(32, 15, 5, 0, 7); x.fill();
      x.fillStyle = '#8d5f34'; x.fillRect(31, 10, 2, 10); x.fillRect(27, 14, 10, 2);
      /* bottes de foin */
      x.fillStyle = '#e0c069'; x.fillRect(48, 44, 10, 8);
      x.fillStyle = '#c9a44f'; x.fillRect(48, 44, 10, 2); x.fillRect(52, 44, 1, 8);
    });

    /* ---------- la serre ---------- */
    Art.make(this, 'fm_serre', 72, 50, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(36, 47, 32, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#bfe3f5'; x.fillRect(4, 16, 64, 30);
      x.fillStyle = '#d5eefb';
      x.beginPath(); x.moveTo(36, 2); x.lineTo(70, 17); x.lineTo(2, 17); x.closePath(); x.fill();
      /* plantes derrière la vitre */
      x.fillStyle = '#4f9b3a';
      x.fillRect(10, 34, 8, 10); x.fillRect(26, 30, 9, 14); x.fillRect(44, 33, 8, 11); x.fillRect(56, 36, 7, 8);
      x.fillStyle = '#d94f3d'; x.fillRect(28, 32, 3, 3); x.fillRect(46, 36, 3, 3);
      /* structure en bois */
      x.fillStyle = '#8d5f34';
      x.fillRect(2, 16, 68, 2); x.fillRect(4, 44, 64, 3);
      [4, 20, 34, 50, 66].forEach(function (px) { x.fillRect(px, 16, 2, 30); });
      x.fillRect(35, 2, 2, 15);
      /* reflets */
      x.fillStyle = 'rgba(255,255,255,0.55)';
      x.fillRect(8, 20, 3, 22); x.fillRect(24, 20, 2, 22); x.fillRect(54, 22, 2, 20);
    });

    /* ---------- arbre et buisson ---------- */
    Art.make(this, 'fm_tree', 44, 58, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(22, 55, 14, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#8d5f34'; x.fillRect(19, 32, 6, 23);
      x.fillStyle = '#6f4a28'; x.fillRect(19, 32, 2, 23);
      x.fillStyle = '#3f8a34';
      x.beginPath(); x.arc(14, 24, 12, 0, 7); x.arc(30, 24, 12, 0, 7); x.arc(22, 14, 13, 0, 7); x.fill();
      x.fillStyle = '#4f9b3a';
      x.beginPath(); x.arc(18, 16, 9, 0, 7); x.arc(28, 21, 8, 0, 7); x.fill();
      x.fillStyle = '#6fbd52';
      x.beginPath(); x.arc(17, 12, 5, 0, 7); x.fill();
      S(x, '#2f6b28', 60, 6, 6, 32, 26);
      x.fillStyle = '#d94f3d';
      x.fillRect(11, 22, 3, 3); x.fillRect(28, 17, 3, 3); x.fillRect(24, 29, 3, 3);
    });
    Art.make(this, 'fm_bush', 30, 20, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.16)';
      x.beginPath(); x.ellipse(15, 18, 12, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#3f8a34';
      x.beginPath(); x.arc(9, 12, 7, 0, 7); x.arc(20, 12, 7, 0, 7); x.arc(15, 8, 7, 0, 7); x.fill();
      x.fillStyle = '#5aa83a';
      x.beginPath(); x.arc(12, 8, 4, 0, 7); x.fill();
      S(x, '#2f6b28', 25, 3, 3, 24, 12);
    });

    /* ---------- la poule ---------- */
    Art.make(this, 'fm_hen', 20, 20, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(10, 18, 7, 2, 0, 0, 7); x.fill();
      x.fillStyle = '#e8a33c'; x.fillRect(7, 15, 2, 3); x.fillRect(11, 15, 2, 3);
      x.fillStyle = '#f6f2e6';
      x.beginPath(); x.ellipse(10, 11, 7, 5, 0, 0, 7); x.fill();
      x.beginPath(); x.arc(14, 6, 4, 0, 7); x.fill();
      x.fillStyle = '#ddd6c4';
      x.beginPath(); x.ellipse(8, 12, 4, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#d94f3d'; x.fillRect(13, 1, 2, 2); x.fillRect(15, 2, 2, 2);
      x.fillStyle = '#e8a33c'; x.fillRect(17, 6, 3, 2);
      x.fillStyle = '#2f2838'; x.fillRect(15, 5, 2, 2);
      x.fillStyle = '#f2e6d2'; x.fillRect(3, 9, 4, 3);
    });

    /* ---------- papillon et abeille ---------- */
    Art.make(this, 'fm_papillon', 16, 14, (x) => {
      x.fillStyle = '#2f2838'; x.fillRect(7, 4, 2, 8);
      x.fillStyle = '#f2a33c';
      x.beginPath(); x.ellipse(4, 5, 4, 4, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(12, 5, 4, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#f5c96a';
      x.beginPath(); x.ellipse(4, 10, 3, 3, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(12, 10, 3, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#fff4d6'; x.fillRect(3, 4, 2, 2); x.fillRect(11, 4, 2, 2);
      x.fillStyle = '#2f2838'; x.fillRect(6, 2, 1, 2); x.fillRect(9, 2, 1, 2);
    });
    Art.make(this, 'fm_bee', 18, 14, (x) => {
      x.fillStyle = 'rgba(255,255,255,0.75)';
      x.beginPath(); x.ellipse(7, 4, 5, 3, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(12, 4, 4, 2, 0, 0, 7); x.fill();
      x.fillStyle = '#f5c542';
      x.beginPath(); x.ellipse(9, 8, 7, 5, 0, 0, 7); x.fill();
      x.fillStyle = '#2f2838';
      x.fillRect(6, 4, 2, 9); x.fillRect(10, 4, 2, 9);
      x.beginPath(); x.arc(16, 7, 3, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(16, 5, 1, 1);
      x.fillStyle = '#e0a63c'; x.fillRect(3, 8, 3, 2);
    });

    /* ---------- fleur pour les pollinisateurs ---------- */
    Art.make(this, 'fm_flower', 20, 26, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.16)';
      x.beginPath(); x.ellipse(10, 24, 6, 2, 0, 0, 7); x.fill();
      x.fillStyle = '#4f9b3a'; x.fillRect(9, 10, 2, 14);
      x.fillStyle = '#3f8a34'; x.fillRect(11, 15, 4, 2); x.fillRect(5, 19, 4, 2);
      x.fillStyle = '#e8639b';
      [[10, 4], [5, 8], [15, 8], [7, 12], [13, 12]].forEach(function (p) {
        x.beginPath(); x.arc(p[0], p[1], 3.4, 0, 7); x.fill();
      });
      x.fillStyle = '#f58fbb'; x.beginPath(); x.arc(9, 6, 2, 0, 7); x.fill();
      x.fillStyle = '#f5c542'; x.beginPath(); x.arc(10, 8, 3, 0, 7); x.fill();
      x.fillStyle = '#e0a63c'; x.fillRect(9, 8, 1, 1);
    });
    /* emplacement libre pour une fleur (pointillés) */
    Art.make(this, 'fm_spot', 32, 32, (x) => {
      x.strokeStyle = '#f6f2e6'; x.lineWidth = 2;
      x.setLineDash && x.setLineDash([4, 4]);
      x.beginPath(); x.arc(16, 16, 12, 0, 7); x.stroke();
      x.setLineDash && x.setLineDash([]);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(15, 10, 2, 12); x.fillRect(10, 15, 12, 2);
    });

    /* ---------- les cases du potager ---------- */
    Art.make(this, 'fm_soil_raw', 32, 32, (x) => {
      x.fillStyle = '#9c7a4f'; x.fillRect(0, 0, 32, 32);
      S(x, '#8a6a42', 90, 0, 0, 32, 32);
      S(x, '#b08d5e', 70, 0, 0, 32, 32);
      x.fillStyle = '#7a5e3a'; x.fillRect(0, 0, 32, 2); x.fillRect(0, 30, 32, 2);
    });
    Art.make(this, 'fm_soil', 32, 32, (x) => {
      x.fillStyle = '#8a5f38'; x.fillRect(0, 0, 32, 32);
      S(x, '#7a5230', 80, 0, 0, 32, 32);
      x.fillStyle = '#9c6d42';
      for (let y = 4; y < 32; y += 7) { x.fillRect(0, y, 32, 2); }
      x.fillStyle = '#6b4a28';
      for (let y = 6; y < 32; y += 7) { x.fillRect(0, y, 32, 1); }
      S(x, '#a87f4c', 40, 0, 0, 32, 32);
    });
    /* cailloux et mauvaises herbes, 3 variantes */
    for (let v = 0; v < 3; v++) {
      Art.make(this, 'fm_weeds' + v, 32, 32, (x) => {
        const n = 3 + v;
        for (let i = 0; i < n; i++) {
          const wx = 3 + Math.floor(Math.random() * 24), wy = 6 + Math.floor(Math.random() * 20);
          x.fillStyle = '#5aa83a';
          x.fillRect(wx, wy - 6, 2, 7); x.fillRect(wx - 3, wy - 4, 2, 5); x.fillRect(wx + 3, wy - 5, 2, 6);
          x.fillStyle = '#3f8a34'; x.fillRect(wx - 3, wy, 8, 2);
        }
        for (let k = 0; k < 2 + v; k++) {
          const sx = 3 + Math.floor(Math.random() * 22), sy = 8 + Math.floor(Math.random() * 18);
          x.fillStyle = '#848c96'; x.fillRect(sx, sy, 7, 5);
          x.fillStyle = '#b3bac3'; x.fillRect(sx, sy, 5, 2);
          x.fillStyle = '#6b727a'; x.fillRect(sx, sy + 4, 7, 1);
        }
      });
    }

    /* ---------- l'arrosoir ---------- */
    Art.make(this, 'fm_can', 34, 26, (x) => {
      x.fillStyle = '#5fa8c9'; x.fillRect(8, 8, 16, 16);
      x.fillStyle = '#7fc3e0'; x.fillRect(8, 8, 16, 3);
      x.fillStyle = '#4a8ba8'; x.fillRect(8, 21, 16, 3);
      x.fillStyle = '#5fa8c9';
      x.beginPath(); x.moveTo(8, 12); x.lineTo(2, 19); x.lineTo(2, 22); x.lineTo(8, 18); x.closePath(); x.fill();
      x.fillStyle = '#7fc3e0'; x.fillRect(1, 18, 4, 2);
      x.strokeStyle = '#4a8ba8'; x.lineWidth = 2;
      x.beginPath(); x.arc(19, 8, 6, Math.PI, 0); x.stroke();
      x.fillStyle = '#4a8ba8'; x.fillRect(10, 5, 12, 3);
      x.fillStyle = '#bfe3f5'; x.fillRect(10, 11, 3, 8);
    });

    /* ---------- particules ---------- */
    Art.make(this, 'fm_p_terre', 6, 6, (x) => {
      x.fillStyle = '#8a5f38'; x.fillRect(0, 0, 6, 6);
      x.fillStyle = '#a87f4c'; x.fillRect(0, 0, 3, 3);
    });
    Art.make(this, 'fm_p_goutte', 6, 8, (x) => {
      x.fillStyle = '#5fa8c9';
      x.beginPath(); x.ellipse(3, 5, 3, 3, 0, 0, 7); x.fill();
      x.beginPath(); x.moveTo(3, 0); x.lineTo(6, 5); x.lineTo(0, 5); x.closePath(); x.fill();
      x.fillStyle = '#bfe3f5'; x.fillRect(1, 3, 2, 2);
    });
    Art.make(this, 'fm_p_etoile', 12, 12, (x) => {
      x.fillStyle = '#f5c542';
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -1.57 + i * 0.628, r = (i % 2) ? 2.5 : 6;
        x.lineTo(6 + Math.cos(a) * r, 6 + Math.sin(a) * r);
      }
      x.closePath(); x.fill();
      x.fillStyle = '#fff0ab'; x.fillRect(5, 3, 2, 2);
    });
    Art.make(this, 'fm_p_coeur', 10, 10, (x) => {
      x.fillStyle = '#f5c542';
      x.beginPath(); x.arc(3, 4, 2.6, 0, 7); x.arc(7, 4, 2.6, 0, 7); x.fill();
      x.beginPath(); x.moveTo(0, 5); x.lineTo(5, 10); x.lineTo(10, 5); x.closePath(); x.fill();
    });

    /* ---------- icônes des consignes ---------- */
    Art.make(this, 'fm_i_terre', 32, 32, (x) => {
      x.fillStyle = '#8a5f38'; x.beginPath(); x.ellipse(16, 22, 13, 8, 0, 0, 7); x.fill();
      x.fillStyle = '#a87f4c'; x.beginPath(); x.ellipse(14, 19, 8, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#848c96'; x.fillRect(18, 12, 8, 5);
      x.fillStyle = '#b3bac3'; x.fillRect(18, 12, 5, 2);
      x.fillStyle = '#5aa83a'; x.fillRect(7, 8, 2, 8); x.fillRect(4, 11, 2, 5); x.fillRect(10, 10, 2, 6);
    });
    Art.make(this, 'fm_i_saison', 32, 32, (x) => {
      x.fillStyle = '#f5c542'; x.beginPath(); x.arc(13, 13, 7, 0, 7); x.fill();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.28;
        x.fillRect(13 + Math.cos(a) * 10 - 1, 13 + Math.sin(a) * 10 - 1, 3, 3);
      }
      x.fillStyle = '#3f8a34';
      x.beginPath(); x.ellipse(22, 23, 8, 5, -0.6, 0, 7); x.fill();
      x.fillStyle = '#5aa83a'; x.fillRect(15, 27, 12, 2);
    });
    Art.make(this, 'fm_i_eau', 32, 32, (x) => {
      x.fillStyle = '#5fa8c9';
      x.beginPath(); x.arc(16, 20, 9, 0, 7); x.fill();
      x.beginPath(); x.moveTo(16, 3); x.lineTo(26, 21); x.lineTo(6, 21); x.closePath(); x.fill();
      x.fillStyle = '#bfe3f5'; x.beginPath(); x.arc(12, 20, 3, 0, 7); x.fill();
    });
    Art.make(this, 'fm_i_abeille', 32, 32, (x) => {
      x.fillStyle = 'rgba(255,255,255,0.8)';
      x.beginPath(); x.ellipse(12, 9, 7, 4, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(21, 9, 6, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#f5c542'; x.beginPath(); x.ellipse(16, 19, 10, 8, 0, 0, 7); x.fill();
      x.fillStyle = '#2f2838';
      x.fillRect(11, 13, 3, 13); x.fillRect(18, 13, 3, 13);
      x.beginPath(); x.arc(26, 17, 4, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(26, 15, 2, 2);
    });
    Art.make(this, 'fm_i_recolte', 32, 32, (x) => {
      x.fillStyle = '#d94f3d'; x.beginPath(); x.arc(14, 20, 9, 0, 7); x.fill();
      x.fillStyle = '#e8735f'; x.beginPath(); x.arc(11, 17, 4, 0, 7); x.fill();
      x.fillStyle = '#4f9b3a'; x.fillRect(13, 8, 2, 5); x.fillRect(15, 9, 6, 3);
      x.fillStyle = '#f5c542';
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -1.57 + i * 0.628, r = (i % 2) ? 2 : 5;
        x.lineTo(25 + Math.cos(a) * r, 8 + Math.sin(a) * r);
      }
      x.closePath(); x.fill();
    });
    Art.make(this, 'fm_i_panier', 32, 32, (x) => {
      x.fillStyle = '#d94f3d'; x.beginPath(); x.arc(11, 14, 5, 0, 7); x.fill();
      x.fillStyle = '#f2c94a'; x.beginPath(); x.arc(20, 13, 5, 0, 7); x.fill();
      x.fillStyle = '#5aa83a'; x.beginPath(); x.arc(16, 11, 4, 0, 7); x.fill();
      x.fillStyle = '#b07a45'; x.fillRect(4, 16, 24, 12);
      x.fillStyle = '#8d5f34';
      x.fillRect(4, 16, 24, 2);
      for (let i = 6; i < 28; i += 5) { x.fillRect(i, 18, 2, 10); }
      x.strokeStyle = '#8d5f34'; x.lineWidth = 2;
      x.beginPath(); x.arc(16, 16, 8, Math.PI, 0); x.stroke();
    });
    Art.make(this, 'fm_i_maison', 32, 32, (x) => {
      x.fillStyle = '#c9483c'; x.fillRect(7, 14, 18, 14);
      x.fillStyle = '#8d5f34';
      x.beginPath(); x.moveTo(16, 4); x.lineTo(28, 15); x.lineTo(4, 15); x.closePath(); x.fill();
      x.fillStyle = '#e6d2ab'; x.fillRect(13, 19, 6, 9);
    });
  }

  /* ---------- petite icône ronde d'une culture ---------- */
  makeCropIcon(crop) {
    const key = 'fm_ic_' + crop.id;
    if (this.textures.exists(key)) return key;
    const fruit = this.hex(crop.colors.fruit);
    const light = this.shade(crop.colors.fruit, 0.28);
    const dark = this.shade(crop.colors.fruit, -0.3);
    const leaf = this.hex(crop.colors.leaf);
    const legume = crop.type === 'legume';
    Art.make(this, key, 28, 28, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.15)';
      x.beginPath(); x.ellipse(14, 25, 9, 2, 0, 0, 7); x.fill();
      x.fillStyle = fruit;
      x.beginPath();
      if (legume) x.ellipse(14, 17, 7, 9, 0, 0, 7);
      else x.arc(14, 17, 9, 0, 7);
      x.fill();
      x.fillStyle = dark;
      x.beginPath();
      if (legume) x.ellipse(17, 19, 4, 7, 0, 0, 7); else x.arc(17, 19, 6, 0, 7);
      x.fill();
      x.fillStyle = light;
      x.beginPath(); x.arc(11, 13, 3, 0, 7); x.fill();
      x.fillStyle = leaf;
      x.fillRect(13, 3, 2, 6);
      x.beginPath(); x.ellipse(19, 6, 5, 3, -0.5, 0, 7); x.fill();
    });
    return key;
  }

  /* ---------- sachet de graines ---------- */
  makeSeedBag(crop) {
    const key = 'fm_sac_' + crop.id;
    if (this.textures.exists(key)) return key;
    const fruit = this.hex(crop.colors.fruit);
    const leaf = this.hex(crop.colors.leaf);
    Art.make(this, key, 32, 34, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(16, 32, 11, 2, 0, 0, 7); x.fill();
      x.fillStyle = '#e6d2ab'; x.fillRect(6, 6, 20, 26);
      x.fillStyle = '#d2bb90'; x.fillRect(6, 6, 20, 3); x.fillRect(6, 29, 20, 3);
      x.fillStyle = '#c9a06a'; x.fillRect(6, 6, 2, 26); x.fillRect(24, 6, 2, 26);
      x.fillStyle = fruit;
      x.beginPath(); x.arc(16, 17, 6, 0, 7); x.fill();
      x.fillStyle = leaf; x.fillRect(15, 8, 2, 4);
      x.fillStyle = '#8a6a44';
      x.fillRect(10, 25, 2, 2); x.fillRect(14, 26, 2, 2); x.fillRect(18, 25, 2, 2);
    });
    return key;
  }

  /* ---------- les 4 stades d'un plant ---------- */
  makePlantTextures(crop) {
    const id = crop.id;
    if (this.textures.exists('fm_pl_' + id + '_3')) return;
    const fruit = this.hex(crop.colors.fruit);
    const fruitL = this.shade(crop.colors.fruit, 0.3);
    const fruitD = this.shade(crop.colors.fruit, -0.3);
    const leaf = this.hex(crop.colors.leaf);
    const leafD = this.shade(crop.colors.leaf, -0.28);
    const leafL = this.shade(crop.colors.leaf, 0.25);
    const flower = this.hex(crop.colors.flower);
    const legume = crop.type === 'legume';
    const W = 34, H = 46;

    const butte = function (x) {
      x.fillStyle = '#6b4a28';
      x.beginPath(); x.ellipse(17, 43, 11, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#8a5f38';
      x.beginPath(); x.ellipse(17, 41, 10, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#9c6d42';
      x.beginPath(); x.ellipse(15, 40, 6, 2, 0, 0, 7); x.fill();
    };
    const feuille = function (x, cx, cy, rx, ry, rot, col) {
      x.fillStyle = col;
      x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, 7); x.fill();
    };

    /* stade 0 : la graine tout juste semée */
    Art.make(this, 'fm_pl_' + id + '_0', W, H, (x) => {
      butte(x);
      x.fillStyle = '#7a5230';
      x.beginPath(); x.ellipse(17, 38, 4, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#b08853';
      x.beginPath(); x.ellipse(17, 37, 2.5, 3, 0.4, 0, 7); x.fill();
      x.fillStyle = '#d2bb90'; x.fillRect(16, 35, 1, 1);
    });

    /* stade 1 : la pousse */
    Art.make(this, 'fm_pl_' + id + '_1', W, H, (x) => {
      butte(x);
      x.fillStyle = leaf; x.fillRect(16, 30, 2, 10);
      feuille(x, 12, 31, 5, 3, -0.5, leaf);
      feuille(x, 22, 32, 5, 3, 0.5, leafD);
      feuille(x, 17, 27, 3, 3, 0, leafL);
    });

    /* stade 2 : le plant, avec ses premières fleurs */
    Art.make(this, 'fm_pl_' + id + '_2', W, H, (x) => {
      butte(x);
      x.fillStyle = leaf; x.fillRect(16, 18, 2, 22);
      x.fillStyle = leafD; x.fillRect(16, 18, 1, 22);
      feuille(x, 9, 30, 7, 4, -0.4, leaf);
      feuille(x, 25, 28, 7, 4, 0.4, leafD);
      feuille(x, 11, 22, 6, 3.5, -0.3, leafL);
      feuille(x, 23, 21, 6, 3.5, 0.3, leaf);
      x.fillStyle = flower;
      x.beginPath(); x.arc(17, 15, 3.5, 0, 7); x.fill();
      x.beginPath(); x.arc(11, 18, 2.5, 0, 7); x.fill();
      x.beginPath(); x.arc(23, 17, 2.5, 0, 7); x.fill();
      x.fillStyle = '#f5c542'; x.fillRect(16, 14, 2, 2);
    });

    /* stade 3 : c'est mûr ! */
    Art.make(this, 'fm_pl_' + id + '_3', W, H, (x) => {
      butte(x);
      if (legume) {
        /* légume : un beau feuillage et le légume bien visible au sol */
        x.fillStyle = leaf; x.fillRect(16, 16, 2, 20);
        feuille(x, 8, 24, 8, 4, -0.5, leaf);
        feuille(x, 26, 23, 8, 4, 0.5, leafD);
        feuille(x, 11, 16, 7, 4, -0.35, leafL);
        feuille(x, 23, 15, 7, 4, 0.35, leaf);
        x.fillStyle = fruit;
        x.beginPath(); x.ellipse(17, 36, 8, 7, 0, 0, 7); x.fill();
        x.fillStyle = fruitD;
        x.beginPath(); x.ellipse(20, 38, 5, 5, 0, 0, 7); x.fill();
        x.fillStyle = fruitL;
        x.beginPath(); x.arc(13, 33, 2.5, 0, 7); x.fill();
      } else {
        /* fruit : un buisson chargé de fruits */
        x.fillStyle = leafD; x.fillRect(16, 20, 2, 18);
        feuille(x, 9, 26, 8, 5, -0.4, leaf);
        feuille(x, 25, 25, 8, 5, 0.4, leafD);
        feuille(x, 12, 16, 7, 4, -0.3, leafL);
        feuille(x, 22, 14, 7, 4, 0.3, leaf);
        const pos = [[11, 29], [23, 28], [17, 21]];
        pos.forEach(function (p, i) {
          x.fillStyle = fruit;
          x.beginPath(); x.arc(p[0], p[1], i === 2 ? 5 : 4.5, 0, 7); x.fill();
          x.fillStyle = fruitD;
          x.beginPath(); x.arc(p[0] + 1.5, p[1] + 1.5, 3, 0, 7); x.fill();
          x.fillStyle = fruitL;
          x.beginPath(); x.arc(p[0] - 1.5, p[1] - 1.5, 1.5, 0, 7); x.fill();
        });
      }
    });
  }

  /* ---------- Maya, l'agricultrice ---------- */
  makeMaya() {
    if (this.textures.exists('fm_maya')) return;
    Art.make(this, 'fm_maya', 32, 50, (x) => {
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.beginPath(); x.ellipse(16, 48, 10, 3, 0, 0, 7); x.fill();
      /* bottes et jambes */
      x.fillStyle = '#8d5f34'; x.fillRect(11, 40, 4, 7); x.fillRect(17, 40, 4, 7);
      x.fillStyle = '#5f3f22'; x.fillRect(11, 45, 4, 2); x.fillRect(17, 45, 4, 2);
      /* salopette */
      x.fillStyle = '#4f9b3a'; x.fillRect(10, 26, 12, 15);
      x.fillStyle = '#3f8a34'; x.fillRect(10, 26, 12, 2); x.fillRect(15, 28, 2, 13);
      x.fillStyle = '#f2e9d8'; x.fillRect(10, 22, 12, 5);
      /* bras */
      x.fillStyle = '#d2925f'; x.fillRect(7, 24, 3, 10); x.fillRect(22, 24, 3, 10);
      /* tête */
      x.fillStyle = '#d2925f'; x.fillRect(11, 11, 10, 11);
      x.fillStyle = '#b87445'; x.fillRect(11, 20, 10, 2);
      /* cheveux */
      x.fillStyle = '#4a2f1c'; x.fillRect(10, 10, 12, 4);
      x.fillRect(9, 12, 2, 9); x.fillRect(21, 12, 2, 9);
      /* chapeau de paille */
      x.fillStyle = '#e0c069'; x.fillRect(6, 8, 20, 3);
      x.fillStyle = '#c9a44f'; x.fillRect(6, 10, 20, 2);
      x.fillStyle = '#e0c069'; x.fillRect(10, 3, 12, 6);
      x.fillStyle = '#c9483c'; x.fillRect(10, 7, 12, 2);
      /* visage */
      x.fillStyle = '#2f2838'; x.fillRect(13, 16, 2, 2); x.fillRect(18, 16, 2, 2);
      x.fillStyle = '#c9483c'; x.fillRect(15, 19, 3, 1);
      x.fillStyle = '#e8a37f'; x.fillRect(12, 18, 2, 1); x.fillRect(19, 18, 2, 1);
    });
  }

  /* ==========================================================
     LE DÉCOR DE LA FERME
     ========================================================== */

  /* ============================================================
     HABILLAGE KENNEY
     On garde toute la logique de la mission, mais on remplace les
     textures dessinées à la main par les tuiles Tiny Farm / Tiny Town,
     à taille identique pour que les positions ne bougent pas.
     Les plantes, elles, restent dessinées : elles portent les vraies
     couleurs de chaque fruit, ce qu'aucune tuile générique ne donne.
     ============================================================ */
  tuileVers(x, feuille, frame, dx, dy, dw, dh) {
    const fr = this.textures.getFrame(feuille, frame);
    if (!fr) return;
    x.imageSmoothingEnabled = false;
    x.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, dx, dy, dw, dh);
  }

  remplacerTexture(cle, dessin) {
    if (!this.textures.exists(cle)) return;
    const src = this.textures.get(cle).getSourceImage();
    const w = src.width, h = src.height;
    this.textures.remove(cle);
    Art.make(this, cle, w, h, (x) => dessin(x, w, h));
  }

  skinKenney() {
    if (typeof Tileset === 'undefined') return;
    const T = Tileset.T, F = Tileset.F, TOWN = Tileset.TOWN, FARM = Tileset.FARM;

    /* la terre des parcelles et les mauvaises herbes */
    this.remplacerTexture('fm_soil_raw', (x, w, h) => this.tuileVers(x, FARM, F.PARCELLE[0], 0, 0, w, h));
    [0, 1, 2].forEach((i) => {
      this.remplacerTexture('fm_weeds' + i, (x, w, h) => {
        this.tuileVers(x, FARM, [F.HERBES, F.BUISSON_BAIES, F.CAILLOUX][i], 0, 0, w, h);
      });
    });

    /* La grange : deux rangées de toit rouge puis les murs de Tiny Farm.
       Sans toit, elle ressemblait à une grande caisse. */
    this.remplacerTexture('fm_barn', (x, w, h) => {
      const c = w / 3, l = h / 5;
      const T2 = Tileset.T;
      for (let i = 0; i < 3; i++) {
        this.tuileVers(x, TOWN, T2.TOIT_ROUGE[i], i * c, 0, c + 1, l + 1);
        this.tuileVers(x, TOWN, T2.TOIT_ROUGE_BAS[i], i * c, l, c + 1, l + 1);
      }
      this.tuileVers(x, TOWN, T2.TOIT_ROUGE_POINTE, c, l, c + 1, l + 1);
      const murs = [F.GRANGE_MUR, F.GRANGE_MUR2, F.GRANGE_PORTE];
      for (let r = 0; r < 3; r++)
        for (let i = 0; i < 3; i++)
          this.tuileVers(x, FARM, murs[r][i], i * c, (r + 2) * l, c + 1, l + 1);
    });

    /* le petit hangar : toit gris et murs de bois */
    this.remplacerTexture('fm_serre', (x, w, h) => {
      const c = w / 3, l = h / 4;
      const T2 = Tileset.T;
      for (let i = 0; i < 3; i++) {
        this.tuileVers(x, TOWN, T2.TOIT_GRIS[i], i * c, 0, c + 1, l + 1);
        this.tuileVers(x, TOWN, T2.TOIT_GRIS_BAS[i], i * c, l, c + 1, l + 1);
      }
      this.tuileVers(x, TOWN, T2.TOIT_GRIS_POINTE, c, l, c + 1, l + 1);
      for (let i = 0; i < 3; i++) {
        this.tuileVers(x, TOWN, T2.MUR_BOIS[i], i * c, 2 * l, c + 1, l + 1);
        this.tuileVers(x, TOWN, i === 1 ? T2.PORTE_BOIS : T2.MUR_BOIS[i], i * c, 3 * l, c + 1, l + 1);
      }
    });

    /* arbres et buissons du village */
    this.remplacerTexture('fm_tree', (x, w, h) => {
      this.tuileVers(x, TOWN, T.ARBRE_VERT[0], 0, 0, w, h / 2);
      this.tuileVers(x, TOWN, T.ARBRE_VERT[1], 0, h / 2, w, h / 2);
    });
    this.remplacerTexture('fm_bush', (x, w, h) => this.tuileVers(x, TOWN, T.BUISSON, 0, 0, w, h));
    this.remplacerTexture('fm_hen', (x, w, h) => this.tuileVers(x, FARM, F.POULE, 0, 0, w, h));

    /* le fond : ciel conservé, mais le champ est tapissé d'herbe Kenney */
    this.remplacerTexture('fm_bg', (x, w, h) => {
      const ciel = ['#7fc9f2', '#9ad8f7', '#b5e4fa', '#cfeefc', '#e4f6fe'];
      for (let i = 0; i < 5; i++) { x.fillStyle = ciel[i]; x.fillRect(0, i * 9, w, 9); }
      x.fillStyle = '#ffd964'; x.beginPath(); x.arc(208, 17, 13, 0, 7); x.fill();
      x.fillStyle = '#fff0ab'; x.beginPath(); x.arc(208, 17, 9, 0, 7); x.fill();
      /* collines */
      x.fillStyle = '#5aa337';
      x.beginPath(); x.moveTo(0, 52); x.quadraticCurveTo(70, 34, 150, 52);
      x.quadraticCurveTo(200, 62, 240, 48); x.lineTo(240, 70); x.lineTo(0, 70); x.fill();
      /* le champ, en vraies tuiles d'herbe (16 px, posées à l'échelle 1) */
      for (let r = 0; r * 16 < h - 48; r++) {
        for (let c = 0; c * 16 < w; c++) {
          const v = (c * 7 + r * 5) % 11;
          const f = v === 0 ? T.HERBE_FLEURS : (v < 3 ? T.HERBE_BRINS : T.HERBE);
          this.tuileVers(x, TOWN, f, c * 16, 48 + r * 16, 16, 16);
        }
      }
      /* un chemin de terre qui traverse */
      for (let c = 0; c * 16 < w; c++) {
        this.tuileVers(x, TOWN, Tileset.one(T.TERRE, c), c * 16, 96, 16, 16);
      }
    });
  }

  createFarm() {
    /* fond */
    this.add.image(0, 0, 'fm_bg').setOrigin(0, 0).setScale(4).setDepth(0);

    /* bâtiments et arbres */
    this.add.image(130, 205, 'fm_barn').setScale(2).setDepth(5);
    this.add.image(830, 200, 'fm_serre').setScale(2).setDepth(5);
    this.add.image(300, 150, 'fm_tree').setScale(1.8).setDepth(4);
    this.add.image(660, 138, 'fm_tree').setScale(1.4).setDepth(4);
    this.add.image(915, 350, 'fm_tree').setScale(2).setDepth(6);
    this.add.image(60, 300, 'fm_bush').setScale(2).setDepth(6);
    this.add.image(760, 330, 'fm_bush').setScale(1.6).setDepth(6);
    this.add.image(250, 500, 'fm_bush').setScale(1.4).setDepth(6);
    this.add.image(880, 520, 'fm_bush').setScale(1.8).setDepth(6);

    /* poules qui picorent près de la grange */
    [[105, 300, 1], [165, 322, -1], [70, 350, 1]].forEach((p, i) => {
      const hen = this.add.image(p[0], p[1], 'fm_hen').setScale(2).setDepth(7).setFlipX(p[2] < 0);
      this.tweens.add({
        targets: hen, y: p[1] - 5, duration: 520 + i * 90,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200
      });
      this.tweens.add({
        targets: hen, x: p[0] + p[2] * 26, duration: 2600 + i * 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    /* papillons */
    [[420, 160, 60, 22], [720, 420, 70, 26], [200, 430, 50, 18]].forEach((p, i) => {
      const s = this.add.image(p[0], p[1], 'fm_papillon').setScale(2).setDepth(30);
      this.tweens.add({
        targets: s, scaleX: 1.1, duration: 240, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.flyers.push({ s: s, cx: p[0], cy: p[1], rx: p[2], ry: p[3], a: i * 2, sp: 0.6 + i * 0.15 });
    });

    /* Maya */
    /* Maya en LPC si possible, sinon la version dessinée */
    this.maya = ((typeof LPC !== 'undefined' && LPC.disponible())
      ? LPC.spriteFixe(this, LPC.lookPnj('maya'), 95, 392, 1.7) : null);
    if (this.maya) { this.maya.setDepth(20); }
    else { this.makeMaya(); this.maya = this.add.image(95, 392, 'fm_maya').setScale(2).setDepth(20); }
    this.tweens.add({
      targets: this.maya, y: 388, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    /* cadre en bois du potager */
    const gw = this.COLS * this.CELL + (this.COLS - 1) * this.GAP;
    const gh = this.ROWS * this.CELL + (this.ROWS - 1) * this.GAP;
    const frame = this.add.graphics().setDepth(8);
    frame.fillStyle(0x6f4a28, 1);
    frame.fillRoundedRect(this.GX - 14, this.GY - 14, gw + 28, gh + 28, 10);
    frame.fillStyle(0x8d5f34, 1);
    frame.fillRoundedRect(this.GX - 11, this.GY - 11, gw + 22, gh + 22, 8);
    frame.fillStyle(0x5f4126, 1);
    frame.fillRoundedRect(this.GX - 5, this.GY - 5, gw + 10, gh + 10, 6);

    /* les 12 cases */
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cx = this.GX + c * (this.CELL + this.GAP) + this.CELL / 2;
        const cy = this.GY + r * (this.CELL + this.GAP) + this.CELL / 2;
        const base = this.add.image(cx, cy, 'fm_soil_raw').setScale(2).setDepth(10);
        const weeds = this.add.image(cx, cy, 'fm_weeds' + ((r + c) % 3)).setScale(2).setDepth(11);
        const zone = this.add.rectangle(cx, cy, this.CELL, this.CELL, 0xffffff, 0)
          .setDepth(40).setInteractive({ useHandCursor: true });
        const cell = {
          x: cx, y: cy, base: base, weeds: weeds, zone: zone,
          cleaned: false, plant: null, glow: null
        };
        zone.on('pointerover', () => { if (this.cellActive(cell)) base.setTint(0xfff0b0); });
        zone.on('pointerout', () => base.clearTint());
        zone.on('pointerdown', () => this.onCellClick(cell));
        this.cells.push(cell);
      }
    }

    /* emplacements de fleurs autour du potager (étape 4) */
    const spots = [[300, 292], [300, 416], [660, 292], [660, 416], [404, 226], [556, 226]];
    spots.forEach((p) => {
      const img = this.add.image(p[0], p[1], 'fm_spot').setScale(1.6).setDepth(12).setVisible(false);
      const zone = this.add.rectangle(p[0], p[1], 54, 54, 0xffffff, 0).setDepth(41).setVisible(false);
      const spot = { x: p[0], y: p[1], img: img, zone: zone, used: false };
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => img.setScale(1.9));
      zone.on('pointerout', () => img.setScale(1.6));
      zone.on('pointerdown', () => this.placeFlower(spot));
      this.flowerSpots.push(spot);
    });
  }

  /* Une case réagit-elle au survol dans l'étape en cours ? */
  cellActive(cell) {
    if (this.stepIndex === 1) return !cell.cleaned;
    if (this.stepIndex === 3) return cell.cleaned;
    if (this.stepIndex >= 4 && this.stepIndex <= 5) return !!cell.plant;
    return false;
  }

  /* ==========================================================
     BARRE D'ÉTAT ET CONSIGNES
     ========================================================== */
  createHud() {
    const hud = this.add.container(0, 0).setDepth(200);

    const g = this.add.graphics();
    g.fillStyle(0x2f4a2a, 1); g.fillRect(0, 0, 960, 46);
    g.fillStyle(0x3f6236, 1); g.fillRect(0, 0, 960, 3);
    g.fillStyle(0x1f3320, 1); g.fillRect(0, 43, 960, 3);
    hud.add(g);

    hud.add(this.txt(16, 12, 'À la ferme avec Maya', 20, '#ffffff', true));

    this.stepText = this.txt(480, 14, 'Étape 1 / 6', 18, '#d7f0c4', true).setOrigin(0.5, 0);
    hud.add(this.stepText);

    /* pastille de la saison, toujours visible */
    const sc = this.seasonDef.color;
    const chip = this.add.graphics();
    chip.fillStyle(sc, 1); chip.fillRoundedRect(626, 9, 150, 28, 14);
    chip.lineStyle(2, 0xffffff, 0.55); chip.strokeRoundedRect(626, 9, 150, 28, 14);
    hud.add(chip);
    hud.add(this.txt(701, 15, this.seasonDef.label, 16, '#2f2838', true).setOrigin(0.5, 0));

    /* bouton Quitter */
    const quit = this.makeButton(890, 23, 116, 30, 'Quitter', () => {
      this.scene.start('Village');
    }, 0xc9483c);
    quit.setDepth(201);

    /* bandeau de consigne */
    this.instrG = this.add.graphics().setDepth(198);
    this.instrG.fillStyle(0x2f2838, 0.25);
    this.instrG.fillRoundedRect(172, 60, 620, 46, 14);
    this.instrG.fillStyle(0xfdf6e6, 1);
    this.instrG.fillRoundedRect(170, 56, 620, 46, 14);
    this.instrG.lineStyle(3, 0x8d5f34, 1);
    this.instrG.strokeRoundedRect(170, 56, 620, 46, 14);
    this.instrIcon = this.add.image(206, 79, 'fm_i_terre').setDepth(199);
    this.instrText = this.txt(238, 79, '', 18, '#3a2c1e', true).setOrigin(0, 0.5).setDepth(199);
    this.instrText.setWordWrapWidth(530);
  }

  setStep(n) {
    this.stepIndex = n;
    this.stepText.setText('Étape ' + n + ' / 6');
    this.tweens.add({
      targets: this.stepText, scaleX: 1.25, scaleY: 1.25,
      duration: 160, yoyo: true, ease: 'Quad.easeOut'
    });
  }

  setInstruction(iconKey, text) {
    this.instrIcon.setTexture(iconKey);
    this.instrText.setText(text);
    this.tweens.add({
      targets: this.instrIcon, angle: 8, duration: 140, yoyo: true, repeat: 1
    });
  }

  /* ==========================================================
     BRIQUES D'INTERFACE
     ========================================================== */
  makeButton(x, y, w, h, label, cb, color, size) {
    const c = this.add.container(x, y).setDepth(150);
    const col = (color === undefined) ? 0x4f9b3a : color;
    const g = this.add.graphics();
    g.fillStyle(0x2f2838, 0.35); g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 10);
    g.fillStyle(col, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.fillStyle(0xffffff, 0.2); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.38, 8);
    const t = this.txt(0, 0, label, size || 18, '#ffffff', true).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, w + 20, h + 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add([g, t, hit]);
    hit.on('pointerover', () => c.setScale(1.06));
    hit.on('pointerout', () => c.setScale(1));
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: c, scaleX: 0.93, scaleY: 0.93, duration: 80, yoyo: true });
      cb();
    });
    c.label = t;
    return c;
  }

  /* voile sombre qui met en avant un panneau */
  makeOverlay() {
    this.clearOverlay();
    const c = this.add.container(0, 0).setDepth(120);
    const back = this.add.rectangle(480, 323, 960, 554, 0x14240f, 0.62)
      .setInteractive();
    c.add(back);
    this.overlay = c;
    return c;
  }
  clearOverlay() {
    if (this.overlay) { this.overlay.destroy(true); this.overlay = null; }
  }

  /* gerbe de particules (terre, gouttes, étoiles…) */
  burst(x, y, key, n, opts) {
    const o = opts || {};
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, key).setDepth(o.depth || 60).setScale(o.scale || 2);
      if (o.tint) p.setTint(o.tint);
      const a = Math.random() * Math.PI * 2;
      const d = (o.dist || 40) * (0.4 + Math.random() * 0.9);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d * (o.up ? -0.4 : 1) - (o.up ? 30 + Math.random() * 30 : 0),
        alpha: 0, angle: (Math.random() - 0.5) * 260,
        scaleX: (o.scale || 2) * 0.4, scaleY: (o.scale || 2) * 0.4,
        duration: 380 + Math.random() * 340,
        ease: 'Quad.easeOut',
        onComplete: function () { p.destroy(); }
      });
    }
  }

  /* petit texte qui monte et disparaît */
  floatText(x, y, msg, color) {
    const t = this.txt(x, y, msg, 18, color || '#ffffff', true).setOrigin(0.5).setDepth(90);
    t.setStroke('#2f2838', 4);
    this.tweens.add({
      targets: t, y: y - 44, alpha: 0, duration: 900, ease: 'Quad.easeOut',
      onComplete: function () { t.destroy(); }
    });
  }

  /* ==========================================================
     INTRODUCTION
     ========================================================== */
  intro() {
    this.setStep(1);
    this.setInstruction('fm_i_terre', 'Clique sur les cases pour enlever cailloux et mauvaises herbes.');
    this.say([
      'Bonjour ! Bienvenue dans mon potager.',
      'Nous sommes en ' + this.seasonDef.label.toLowerCase() + ' : commençons par préparer la terre.'
    ], () => this.stepClean());
  }

  /* ==========================================================
     ÉTAPE 1 — PRÉPARER LA TERRE
     ========================================================== */
  stepClean() {
    this.setStep(1);
    this.cleanCount = 0;
    this.updateCleanLabel();
  }

  updateCleanLabel() {
    this.setInstruction('fm_i_terre',
      'Nettoie le potager : ' + this.cleanCount + ' / ' + this.cells.length + ' cases prêtes.');
  }

  onCellClick(cell) {
    /* étape 1 : on désherbe */
    if (this.stepIndex === 1) { this.cleanCell(cell); return; }

    /* récolte prioritaire quand le plant est mûr */
    if (this.stepIndex === 5 && cell.plant && cell.plant.stage === 3) {
      this.harvestPlant(cell.plant); return;
    }
    /* arrosage */
    if (this.canActive && cell.plant) { this.waterPlant(cell.plant); return; }
    /* choix d'une case à planter */
    if (this.stepIndex === 3 && this.phase === 'seed') { this.selectCell(cell); return; }
    /* on clique un plant qui n'est pas prêt : on rassure */
    if (this.stepIndex === 5 && cell.plant) { this.patience(cell.plant); return; }

    if (cell.plant && this.stepIndex >= 3) {
      this.toast('Clique d\'abord sur l\'arrosoir, puis sur ton plant.');
    }
  }

  cleanCell(cell) {
    if (cell.cleaned) return;
    cell.cleaned = true;
    this.cleanCount++;

    /* la mauvaise herbe s'envole */
    const w = cell.weeds;
    this.tweens.add({
      targets: w, y: w.y - 22, alpha: 0, angle: 40, scaleX: 1.4, scaleY: 1.4,
      duration: 260, ease: 'Quad.easeOut',
      onComplete: function () { w.destroy(); }
    });
    cell.weeds = null;

    /* la terre est retournée */
    cell.base.setTexture('fm_soil');
    cell.base.clearTint();
    this.tweens.add({
      targets: cell.base, scaleX: 2.25, scaleY: 2.25,
      duration: 130, yoyo: true, ease: 'Quad.easeOut'
    });
    this.burst(cell.x, cell.y, 'fm_p_terre', 9, { dist: 46 });

    this.updateCleanLabel();

    if (this.cleanCount === this.cells.length) {
      this.time.delayedCall(320, () => {
        this.say([
          'Quelle belle terre, bien meuble et bien aérée !',
          'Maintenant, choisissons ce que nous allons planter.'
        ], () => this.stepChoose());
      });
    }
  }

  /* ==========================================================
     ÉTAPE 2 — CHOISIR LES PLANTATIONS
     ========================================================== */
  stepChoose() {
    this.setStep(2);
    this.setInstruction('fm_i_saison', 'Choisis 4 cultures à planter dans ton potager.');

    const offer = this.pickCropOffer();
    const ov = this.makeOverlay();

    /* la saison, en grand */
    const sg = this.add.graphics();
    sg.fillStyle(0x2f2838, 0.35); sg.fillRoundedRect(302, 128, 356, 96, 16);
    sg.fillStyle(this.seasonDef.color, 1); sg.fillRoundedRect(300, 124, 356, 96, 16);
    sg.lineStyle(4, 0xfdf6e6, 1); sg.strokeRoundedRect(300, 124, 356, 96, 16);
    ov.add(sg);
    ov.add(this.add.image(352, 172, 'fm_i_saison').setScale(1.8));
    ov.add(this.txt(400, 138, 'Nous sommes en', 16, '#3a2c1e'));
    ov.add(this.txt(400, 158, this.seasonDef.label, 40, '#2f2838', true));

    this.choiceCards = [];
    offer.forEach((crop, i) => {
      const card = this.makeChoiceCard(100 + i * 152, 348, crop);
      ov.add(card);
      this.choiceCards.push(card);
    });

    this.chooseCount = this.txt(480, 452, 'Cultures choisies : 0 / 4', 20, '#fdf6e6', true)
      .setOrigin(0.5);
    ov.add(this.chooseCount);

    this.chooseBtn = this.makeButton(480, 520, 260, 52, 'Planter mes 4 cultures', () => {
      if (this.chosen.length < 4) {
        this.toast('Choisis encore ' + (4 - this.chosen.length) + ' culture(s).');
        return;
      }
      this.clearOverlay();
      this.say([
        'Très bon choix ! Chaque graine attend son tour.',
        'Prends une case, puis un sachet de graines.'
      ], () => this.stepPlant());
    });
    this.chooseBtn.setAlpha(0.45);
    ov.add(this.chooseBtn);
  }

  /* 6 cultures : de saison, hors saison, locales et lointaines */
  pickCropOffer() {
    const all = GameData.crops.slice();
    const sh = function (a) { return Phaser.Utils.Array.Shuffle(a.slice()); };
    const inS = (c) => this.inSeason(c);
    const seasonLocal = sh(all.filter(function (c) { return c.origin === 'local'; }).filter(inS));
    const offLocal = sh(all.filter(function (c) { return c.origin === 'local'; })
      .filter(function (c) { return !inS(c); }));
    const exo = sh(all.filter(function (c) { return c.origin === 'exotique'; }));
    const out = [];
    const push = function (c) { if (c && out.indexOf(c) < 0 && out.length < 6) out.push(c); };
    seasonLocal.slice(0, 3).forEach(push);
    offLocal.slice(0, 2).forEach(push);
    exo.slice(0, 1).forEach(push);
    sh(all).forEach(push);   /* on complète si une catégorie est vide (l'hiver, par exemple) */
    return Phaser.Utils.Array.Shuffle(out);
  }

  makeChoiceCard(x, y, crop) {
    const W = 140, H = 182;
    const c = this.add.container(x, y);
    const inS = this.inSeason(crop);
    const local = crop.origin === 'local';
    const g = this.add.graphics();
    const paint = function (sel) {
      g.clear();
      g.fillStyle(0x2f2838, 0.35); g.fillRoundedRect(-W / 2 + 3, -H / 2 + 5, W, H, 14);
      g.fillStyle(sel ? 0xfff2c2 : 0xfdf6e6, 1); g.fillRoundedRect(-W / 2, -H / 2, W, H, 14);
      g.lineStyle(4, sel ? 0xf2a33c : 0xc9a06a, 1); g.strokeRoundedRect(-W / 2, -H / 2, W, H, 14);
    };
    paint(false);
    c.add(g);
    c.add(this.add.image(0, -52, this.makeCropIcon(crop)).setScale(2.1));
    c.add(this.txt(0, -6, crop.name, 20, '#3a2c1e', true).setOrigin(0.5));
    c.add(this.txt(0, 22, inS ? 'De saison' : 'Hors saison', 15,
      inS ? '#3f8a34' : '#c07a2a', true).setOrigin(0.5));
    c.add(this.txt(0, 44, local ? 'Cultivé près d\'ici' : 'Vient de loin', 14,
      local ? '#3f8a34' : '#c07a2a').setOrigin(0.5));
    c.add(this.txt(0, 64, crop.from + ' · ' + this.km(crop.km) + ' km', 13, '#6b5a45').setOrigin(0.5));

    const hit = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add(hit);
    c.selected = false;
    hit.on('pointerover', () => c.setScale(1.05));
    hit.on('pointerout', () => c.setScale(1));
    hit.on('pointerdown', () => {
      if (c.selected) {
        c.selected = false;
        this.chosen = this.chosen.filter(function (k) { return k !== crop; });
        paint(false);
      } else {
        if (this.chosen.length >= 4) {
          this.toast('Tu as déjà 4 cultures. Reclique sur l\'une d\'elles pour la retirer.');
          return;
        }
        c.selected = true;
        this.chosen.push(crop);
        paint(true);
        this.tweens.add({ targets: c, scaleY: 1.14, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        this.explainChoice(crop);
      }
      this.chooseCount.setText('Cultures choisies : ' + this.chosen.length + ' / 4');
      this.chooseBtn.setAlpha(this.chosen.length === 4 ? 1 : 0.45);
    });
    return c;
  }

  /* Maya commente en douceur, sans jamais empêcher le choix */
  explainChoice(crop) {
    if (!this.inSeason(crop)) {
      this.toast('Maya : la ' + crop.name.toLowerCase() + ' n\'est pas de saison en ' +
        this.seasonDef.label.toLowerCase() + '. On essaie quand même, ça t\'apprendra plein de choses !');
    } else if (crop.origin === 'exotique' || crop.km >= 1000) {
      this.toast('Maya : ' + crop.name.toLowerCase() + ' vient de ' + crop.from +
        ', à ' + this.km(crop.km) + ' km d\'ici. C\'est loin, mais c\'est toi qui décides !');
    } else {
      this.toast('Maya : bon choix, ' + crop.name.toLowerCase() + ' pousse très bien par ici.');
    }
  }

  /* ==========================================================
     ÉTAPE 3 — PLANTER ET ARROSER
     ========================================================== */
  stepPlant() {
    this.setStep(3);
    this.phase = 'seed';
    this.setInstruction('fm_i_terre', 'Clique une case, puis un sachet de graines.');

    this.toolLayer = this.add.container(0, 0).setDepth(140);

    /* les sachets de graines */
    this.chosen.forEach((crop, i) => {
      this.makePlantTextures(crop);
      const card = this.makeSeedCard(316 + i * 110, 540, crop);
      this.toolLayer.add(card);
      this.seedCards.push(card);
    });

    /* l'arrosoir, encore endormi */
    this.canBtn = this.makeCanTool(140, 540);
    this.canBtn.setVisible(false);
    this.toolLayer.add(this.canBtn);
  }

  makeSeedCard(x, y, crop) {
    const W = 96, H = 104;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const paint = function (state) {
      g.clear();
      g.fillStyle(0x2f2838, 0.35); g.fillRoundedRect(-W / 2 + 3, -H / 2 + 4, W, H, 12);
      const back = state === 'used' ? 0xcfc6b4 : (state === 'sel' ? 0xfff2c2 : 0xfdf6e6);
      g.fillStyle(back, 1); g.fillRoundedRect(-W / 2, -H / 2, W, H, 12);
      g.lineStyle(4, state === 'sel' ? 0xf2a33c : 0xc9a06a, 1);
      g.strokeRoundedRect(-W / 2, -H / 2, W, H, 12);
    };
    paint('idle');
    const bag = this.add.image(0, -14, this.makeSeedBag(crop)).setScale(1.8);
    const name = this.txt(0, 32, crop.name, 15, '#3a2c1e', true).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add([g, bag, name, hit]);
    c.crop = crop; c.used = false;
    c.paint = paint;
    hit.on('pointerover', () => { if (!c.used) c.setScale(1.06); });
    hit.on('pointerout', () => c.setScale(1));
    hit.on('pointerdown', () => {
      if (!c.visible) return;
      if (c.used) { this.toast('Ces graines sont déjà en terre.'); return; }
      this.seedCards.forEach(function (s) { if (!s.used) s.paint('idle'); });
      this.selectedSeed = c;
      paint('sel');
      if (this.selectedCell) this.plantSeed(this.selectedCell, c);
      else this.setInstruction('fm_i_terre', 'Graines de ' + crop.name.toLowerCase() +
        ' en main : clique une case de terre.');
    });
    return c;
  }

  makeCanTool(x, y) {
    const W = 150, H = 96;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const paint = (on) => {
      g.clear();
      g.fillStyle(0x2f2838, 0.35); g.fillRoundedRect(-W / 2 + 3, -H / 2 + 4, W, H, 14);
      g.fillStyle(on ? 0xbfe3f5 : 0xfdf6e6, 1); g.fillRoundedRect(-W / 2, -H / 2, W, H, 14);
      g.lineStyle(4, on ? 0x4c9be8 : 0xc9a06a, 1); g.strokeRoundedRect(-W / 2, -H / 2, W, H, 14);
    };
    paint(false);
    const img = this.add.image(0, -14, 'fm_can').setScale(2);
    const label = this.txt(0, 28, 'Arrosoir', 17, '#3a2c1e', true).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add([g, img, label, hit]);
    c.paint = paint;
    hit.on('pointerover', () => c.setScale(1.05));
    hit.on('pointerout', () => c.setScale(1));
    hit.on('pointerdown', () => {
      if (!c.visible) return;
      this.canActive = !this.canActive;
      paint(this.canActive);
      label.setText(this.canActive ? 'En main !' : 'Arrosoir');
      this.tweens.add({ targets: img, angle: this.canActive ? -18 : 0, duration: 160 });
      if (this.canActive) this.toast('Clique maintenant sur un plant pour l\'arroser.');
    });
    return c;
  }

  selectCell(cell) {
    if (cell.plant) { this.toast('Cette case est déjà plantée. Choisis-en une autre !'); return; }
    if (this.selectedCell && this.selectedCell.glow) {
      this.selectedCell.glow.destroy(); this.selectedCell.glow = null;
    }
    this.selectedCell = cell;
    const g = this.add.graphics().setDepth(15);
    g.lineStyle(4, 0xf5c542, 1);
    g.strokeRoundedRect(cell.x - 32, cell.y - 32, 64, 64, 8);
    cell.glow = g;
    this.tweens.add({ targets: g, alpha: 0.35, duration: 420, yoyo: true, repeat: -1 });
    if (this.selectedSeed) this.plantSeed(cell, this.selectedSeed);
    else this.setInstruction('fm_i_terre', 'Case choisie ! Clique maintenant un sachet de graines.');
  }

  plantSeed(cell, card) {
    const crop = card.crop;
    this.makePlantTextures(crop);

    if (cell.glow) { cell.glow.destroy(); cell.glow = null; }
    this.selectedCell = null;
    this.selectedSeed = null;
    card.used = true;
    card.paint('used');
    card.setAlpha(0.55);

    const sprite = this.add.image(cell.x, cell.y + 26, 'fm_pl_' + crop.id + '_0')
      .setOrigin(0.5, 1).setScale(2).setDepth(20 + cell.y * 0.01);
    sprite.setScale(0.6, 0.6);
    this.tweens.add({ targets: sprite, scaleX: 2, scaleY: 2, duration: 300, ease: 'Back.easeOut' });
    this.burst(cell.x, cell.y + 10, 'fm_p_terre', 8, { dist: 34 });

    /* barre de progression discrète */
    const barBg = this.add.rectangle(cell.x, cell.y + 30, 46, 7, 0x2f2838, 0.55).setDepth(45);
    const barFill = this.add.rectangle(cell.x - 22, cell.y + 30, 2, 5, 0x7cc44a)
      .setOrigin(0, 0.5).setDepth(46);

    const plant = {
      crop: crop, cell: cell, sprite: sprite, prog: 0, need: crop.growTime,
      stage: 0, barBg: barBg, barFill: barFill, sway: null
    };
    cell.plant = plant;
    this.plants.push(plant);

    this.floatText(cell.x, cell.y - 20, crop.name + ' planté !', '#d7f0c4');

    if (this.plants.length >= this.chosen.length) {
      this.phase = 'water';
      this.canBtn.setVisible(true);
      this.tweens.add({
        targets: this.canBtn, y: 528, duration: 200, yoyo: true, ease: 'Quad.easeOut'
      });
      this.seedCards.forEach(function (s) { s.setAlpha(0.35); });
      this.setInstruction('fm_i_eau', 'Prends l\'arrosoir, puis arrose chacun de tes plants.');
      this.say([
        'Toutes les graines sont en terre. Bravo !',
        'Une graine a besoin d\'eau et de chaleur pour se réveiller.'
      ]);
    } else {
      this.setInstruction('fm_i_terre',
        'Plants en terre : ' + this.plants.length + ' / ' + this.chosen.length + '. Continue !');
    }
  }

  waterPlant(plant) {
    if (plant.prog >= plant.need) {
      this.toast('Ce plant a assez bu : il est prêt à être récolté !');
      return;
    }
    /* gouttes d'eau */
    const x = plant.cell.x, y = plant.cell.y;
    for (let i = 0; i < 7; i++) {
      const d = this.add.image(x - 22 + Math.random() * 44, y - 46, 'fm_p_goutte')
        .setScale(1.8).setDepth(55);
      this.tweens.add({
        targets: d, y: y + 12, alpha: 0, duration: 320 + Math.random() * 180,
        delay: i * 40, ease: 'Quad.easeIn',
        onComplete: function () { d.destroy(); }
      });
    }
    plant.cell.base.setTint(0xa8cbe0);
    this.time.delayedCall(500, function () { plant.cell.base.clearTint(); });
    this.growPlant(plant, 1);
  }

  growPlant(plant, n) {
    plant.prog = Math.min(plant.need, plant.prog + n);
    const before = plant.stage;
    plant.stage = plant.prog >= plant.need ? 3 :
      (plant.prog <= 0 ? 0 : Math.max(1, Math.min(2, Math.ceil(plant.prog / plant.need * 3))));

    plant.barFill.setSize(Math.max(2, 44 * (plant.prog / plant.need)), 5);

    if (plant.stage !== before) {
      plant.sprite.setTexture('fm_pl_' + plant.crop.id + '_' + plant.stage);
      this.tweens.add({
        targets: plant.sprite, scaleX: 2.3, scaleY: 2.3,
        duration: 150, yoyo: true, ease: 'Back.easeOut'
      });
      /* léger balancement dès que la plante sort de terre */
      if (plant.stage >= 1 && !plant.sway) {
        plant.sway = this.tweens.add({
          targets: plant.sprite, angle: 3, duration: 1500 + Math.random() * 600,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 800
        });
      }
      if (plant.stage === 3) {
        this.burst(plant.cell.x, plant.cell.y - 30, 'fm_p_etoile', 8, { dist: 40, up: true, scale: 1.6 });
        this.floatText(plant.cell.x, plant.cell.y - 46, plant.crop.name + ' est mûr !', '#f5c542');
      }
    }

    /* fin de l'étape 3 : tous les plants ont bu au moins une fois */
    if (this.stepIndex === 3) {
      const tousArroses = this.plants.every(function (p) { return p.prog >= 1; });
      if (tousArroses && !this.step3Done) {
        this.step3Done = true;
        this.canActive = false;
        if (this.canBtn) this.canBtn.paint(false);
        this.time.delayedCall(400, () => {
          this.say([
            'Tes pousses sortent de terre, c\'est magnifique !',
            'Il manque encore des amis très utiles : les pollinisateurs.'
          ], () => this.stepPollinate());
        });
      }
    }
  }

  /* ==========================================================
     ÉTAPE 4 — AIDER LES POLLINISATEURS
     ========================================================== */
  stepPollinate() {
    this.setStep(4);
    this.flowerCount = 0;
    this.setInstruction('fm_i_abeille', 'Plante 3 fleurs autour du potager : 0 / 3.');
    this.flowerSpots.forEach(function (s) {
      if (!s.used) { s.img.setVisible(true); s.zone.setVisible(true); }
    });
    this.toast('Les fleurs attirent les abeilles et les papillons.');
  }

  placeFlower(spot) {
    if (this.stepIndex !== 4 || spot.used || this.flowerCount >= 3) return;
    spot.used = true;
    this.flowerCount++;
    spot.img.setVisible(false);
    spot.zone.setVisible(false);
    spot.zone.disableInteractive();

    const f = this.add.image(spot.x, spot.y, 'fm_flower').setScale(0.6).setDepth(14);
    this.tweens.add({ targets: f, scaleX: 2, scaleY: 2, duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: f, angle: 5, duration: 1400, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 320 + Math.random() * 500
    });
    this.burst(spot.x, spot.y, 'fm_p_coeur', 6, { dist: 30, up: true, scale: 1.4, tint: 0xf58fbb });

    this.setInstruction('fm_i_abeille', 'Plante 3 fleurs autour du potager : ' + this.flowerCount + ' / 3.');

    if (this.flowerCount >= 3) {
      this.flowerSpots.forEach(function (s) { s.img.setVisible(false); s.zone.setVisible(false); });
      this.time.delayedCall(300, () => {
        this.spawnBees();
        this.say([
          'Regarde : les abeilles arrivent butiner tes fleurs !',
          'En passant de fleur en fleur, elles aident les plantes à faire des fruits.'
        ], () => this.stepHarvest());
      });
    }
  }

  spawnBees() {
    const cx = this.GX + 140, cy = this.GY + 104;
    for (let i = 0; i < 3; i++) {
      const s = this.add.image(cx, cy, 'fm_bee').setScale(2).setDepth(35);
      this.tweens.add({
        targets: s, scaleY: 1.7, duration: 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.bees.push({
        s: s, cx: cx, cy: cy, rx: 150 + i * 22, ry: 70 + i * 12,
        a: i * 2.1, sp: 0.9 + i * 0.2
      });
    }
    /* les abeilles font grandir les cultures qui ont besoin d'elles */
    this.beeTimer = this.time.addEvent({
      delay: 2600, loop: true, callback: () => {
        const cible = this.plants.filter(function (p) {
          return p.crop.needsPollinator && p.prog < p.need;
        });
        if (!cible.length) return;
        const p = cible[Math.floor(Math.random() * cible.length)];
        this.burst(p.cell.x, p.cell.y - 24, 'fm_p_coeur', 4, { dist: 26, up: true, scale: 1.2 });
        this.floatText(p.cell.x, p.cell.y - 34, 'Pollinisé !', '#f5c542');
        this.growPlant(p, 1);
      }
    });
  }

  /* ==========================================================
     ÉTAPE 5 — RÉCOLTER
     ========================================================== */
  stepHarvest() {
    this.setStep(5);
    this.setInstruction('fm_i_recolte', 'Arrose encore, puis clique les plants mûrs pour récolter.');
    this.seedCards.forEach(function (s) { s.setVisible(false); });
    if (this.canBtn) this.canBtn.setVisible(true);
  }

  harvestPlant(plant) {
    if (plant.stage < 3) {
      this.toast('Encore un peu de patience ! Ce plant a besoin d\'eau et de temps.');
      return;
    }
    plant.cell.plant = null;
    this.harvested.push(plant.crop);
    if (plant.sway) plant.sway.stop();

    this.burst(plant.cell.x, plant.cell.y - 26, 'fm_p_etoile', 12, { dist: 55, up: true, scale: 1.8 });
    this.floatText(plant.cell.x, plant.cell.y - 40, '+ ' + plant.crop.name, '#ffffff');

    const s = plant.sprite;
    this.tweens.add({
      targets: s, y: s.y - 40, alpha: 0, scaleX: 1.2, scaleY: 1.2,
      duration: 340, ease: 'Quad.easeOut',
      onComplete: function () { s.destroy(); }
    });
    plant.barBg.destroy(); plant.barFill.destroy();
    plant.cell.base.setTexture('fm_soil');

    this.setInstruction('fm_i_recolte',
      'Récolte : ' + this.harvested.length + ' / ' + this.plants.length + ' cultures dans les paniers.');

    if (this.harvested.length >= this.plants.length) {
      this.canActive = false;
      if (this.beeTimer) { this.beeTimer.remove(false); this.beeTimer = null; }
      this.time.delayedCall(400, () => {
        this.say([
          'Quelle récolte ! Tu as pris soin de chaque plante.',
          'Dernière mission : compose un joli panier pour la maison.'
        ], () => this.stepBasket());
      });
    }
  }

  /* Un plant non mûr cliqué avec l'arrosoir rangé : message bienveillant. */
  patience(plant) {
    this.toast('Encore un peu de patience ! ' + plant.crop.name + ' n\'est pas encore mûr.');
  }

  /* ==========================================================
     ÉTAPE 6 — COMPOSER UN PANIER
     ========================================================== */
  stepBasket() {
    this.setStep(6);
    this.setInstruction('fm_i_panier', 'Choisis 5 aliments pour remplir ton panier.');
    this.canActive = false;
    if (this.toolLayer) this.toolLayer.setVisible(false);

    this.basketOffer = this.buildBasketOffer();
    const ov = this.makeOverlay();

    ov.add(this.txt(480, 128, 'Compose ton panier', 30, '#fdf6e6', true).setOrigin(0.5));
    ov.add(this.txt(480, 166, 'Ta récolte et les produits du magasin', 18, '#d7f0c4').setOrigin(0.5));

    this.basketCards = [];
    this.basketOffer.forEach((item, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const card = this.makeBasketCard(195 + col * 190, 262 + row * 158, item);
      ov.add(card);
      this.basketCards.push(card);
    });

    this.basketCount = this.txt(480, 508, 'Panier : 0 / 5', 20, '#fdf6e6', true).setOrigin(0.5);
    ov.add(this.basketCount);

    this.basketBtn = this.makeButton(480, 556, 240, 48, 'Valider mon panier', () => {
      if (this.basket.length < 5) {
        this.toast('Il manque encore ' + (5 - this.basket.length) + ' aliment(s).');
        return;
      }
      this.showBilan();
    });
    this.basketBtn.setAlpha(0.45);
    ov.add(this.basketBtn);
  }

  /* 4 aliments récoltés + 4 aliments venus du magasin */
  buildBasketOffer() {
    const out = [];
    this.harvested.forEach((c) => out.push({ crop: c, garden: true, km: 0 }));
    const pris = this.harvested.map(function (c) { return c.id; });
    const reste = Phaser.Utils.Array.Shuffle(GameData.crops.filter(function (c) {
      return pris.indexOf(c.id) < 0;
    }));
    const ajoute = function (c) {
      if (c && out.length < 8 && !out.some(function (o) { return o.crop.id === c.id; })) {
        out.push({ crop: c, garden: false, km: c.km });
      }
    };
    /* un peu de tout : du lointain, du local, du hasard */
    ajoute(reste.filter(function (c) { return c.origin === 'exotique'; })[0]);
    ajoute(reste.filter((c) => c.origin === 'local' && this.inSeason(c))[0]);
    reste.forEach(ajoute);
    return Phaser.Utils.Array.Shuffle(out);
  }

  makeBasketCard(x, y, item) {
    const W = 168, H = 140;
    const crop = item.crop;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const paint = function (sel) {
      g.clear();
      g.fillStyle(0x2f2838, 0.35); g.fillRoundedRect(-W / 2 + 3, -H / 2 + 4, W, H, 14);
      g.fillStyle(sel ? 0xfff2c2 : 0xfdf6e6, 1); g.fillRoundedRect(-W / 2, -H / 2, W, H, 14);
      g.lineStyle(4, sel ? 0xf2a33c : 0xc9a06a, 1); g.strokeRoundedRect(-W / 2, -H / 2, W, H, 14);
    };
    paint(false);
    c.add(g);
    c.add(this.add.image(-52, -12, this.makeCropIcon(crop)).setScale(2));
    c.add(this.txt(-18, -50, crop.name, 19, '#3a2c1e', true));
    c.add(this.txt(-18, -24, item.garden ? 'Ton potager' : 'Au magasin', 14,
      item.garden ? '#3f8a34' : '#8d5f34'));
    c.add(this.txt(-18, -4, item.garden ? '0 km' : this.km(item.km) + ' km', 14, '#6b5a45'));
    c.add(this.txt(-76, 26, this.inSeason(crop) ? 'De saison' : 'Hors saison', 15,
      this.inSeason(crop) ? '#3f8a34' : '#c07a2a', true));
    c.add(this.txt(-76, 48, crop.origin === 'local' ? 'Près d\'ici' : 'De ' + crop.from, 14, '#6b5a45'));

    const hit = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive({ useHandCursor: true });
    c.add(hit);
    c.selected = false;
    hit.on('pointerover', () => c.setScale(1.04));
    hit.on('pointerout', () => c.setScale(1));
    hit.on('pointerdown', () => {
      if (c.selected) {
        c.selected = false;
        this.basket = this.basket.filter(function (k) { return k !== item; });
        paint(false);
      } else {
        if (this.basket.length >= 5) {
          this.toast('Ton panier est plein ! Reclique un aliment pour le retirer.');
          return;
        }
        c.selected = true;
        this.basket.push(item);
        paint(true);
        this.tweens.add({ targets: c, scaleY: 1.12, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
      }
      this.basketCount.setText('Panier : ' + this.basket.length + ' / 5');
      this.basketBtn.setAlpha(this.basket.length === 5 ? 1 : 0.45);
    });
    return c;
  }

  /* ---------- le petit bilan du panier ---------- */
  showBilan() {
    let saison = 0, locaux = 0, km = 0;
    this.basket.forEach((it) => {
      if (this.inSeason(it.crop)) saison++;
      if (it.crop.origin === 'local') locaux++;
      km += it.km;
    });

    const ov = this.makeOverlay();
    const g = this.add.graphics();
    g.fillStyle(0x2f2838, 0.4); g.fillRoundedRect(122, 118, 720, 400, 20);
    g.fillStyle(0xfdf6e6, 1); g.fillRoundedRect(120, 112, 720, 400, 20);
    g.lineStyle(5, 0x8d5f34, 1); g.strokeRoundedRect(120, 112, 720, 400, 20);
    ov.add(g);

    ov.add(this.add.image(200, 168, 'fm_i_panier').setScale(1.8));
    ov.add(this.txt(480, 150, 'Ton panier est prêt !', 30, '#3a2c1e', true).setOrigin(0.5));

    /* trois petites cartes de résultat */
    const stats = [
      { t: 'De saison', v: saison + ' / 5', c: 0x7cc44a },
      { t: 'Cultivés près d\'ici', v: locaux + ' / 5', c: 0x4c9be8 },
      { t: 'Kilomètres du panier', v: this.km(km) + ' km', c: 0xf2a33c }
    ];
    stats.forEach((s, i) => {
      const x = 260 + i * 220, y = 262;
      const sg = this.add.graphics();
      sg.fillStyle(s.c, 1); sg.fillRoundedRect(x - 100, y - 52, 200, 104, 14);
      sg.lineStyle(3, 0x8d5f34, 1); sg.strokeRoundedRect(x - 100, y - 52, 200, 104, 14);
      ov.add(sg);
      const label = this.txt(x, y - 36, s.t, 15, '#2f2838', true).setOrigin(0.5);
      label.setWordWrapWidth(184);
      ov.add(label);
      const val = this.txt(x, y + 4, s.v, 26, '#2f2838', true).setOrigin(0.5);
      ov.add(val);
      val.setScale(0.2);
      this.tweens.add({
        targets: val, scaleX: 1, scaleY: 1, duration: 320,
        delay: 160 * i, ease: 'Back.easeOut'
      });
    });

    /* explications, toujours encourageantes */
    const l1 = this.txt(480, 348, 'Bravo, tu as pris le temps de regarder d\'où viennent tes aliments.',
      18, '#3a2c1e', true).setOrigin(0.5);
    l1.setWordWrapWidth(660);
    ov.add(l1);
    const l2 = this.txt(480, 392,
      'Un fruit de saison a souvent voyagé moins loin pour arriver dans ton assiette.',
      17, '#4a3c2c').setOrigin(0.5);
    l2.setWordWrapWidth(660);
    ov.add(l2);
    const l3 = this.txt(480, 424,
      'Un aliment cultivé tout près voyage moins : moins de camions, moins de bateaux.',
      17, '#4a3c2c').setOrigin(0.5);
    l3.setWordWrapWidth(660);
    ov.add(l3);

    const btn = this.makeButton(480, 478, 240, 50, 'Terminer la journée', () => {
      this.clearOverlay();
      this.say([
        'Merci pour ton aide, le potager n\'a jamais été aussi beau.',
        'Emporte ce carré de potager pour ton terrain !'
      ], () => this.finish());
    });
    ov.add(btn);
  }

  /* ==========================================================
     BILAN FINAL
     ========================================================== */
  finish() {
    if (this.finished) return;
    this.finished = true;

    const total = 45;
    const ency = ['ency_plantes_1', 'ency_animaux_2', 'ency_env_3'];

    State.addPoints(total);
    ency.forEach(function (id) { State.discover(id); });
    State.addBadge('potager');

    /* le carré de potager rejoint l'inventaire de décoration */
    const st = State.get();
    st.inventory['carre_potager'] = (st.inventory['carre_potager'] || 0) + 1;
    State.completeQuest('ferme');
    State.save();

    const retour = () => { this.scene.start('Village', { from: 'ferme' }); };

    if (typeof UI !== 'undefined' && UI.rewardPanel) {
      UI.rewardPanel({
        points: total, badge: 'potager', ency: ency,
        item: 'carre_potager', title: 'Mission terminée !'
      }, retour);
    } else {
      retour();
    }
  }

};
