/* ============================================================
   SCENE-FISHING.JS — Mission « Pêche responsable »
   ------------------------------------------------------------
   Une sortie en mer avec le Capitaine Marin, en quatre prises.
   Chaque prise enchaîne quatre petits jeux :
     1. lancer la ligne (choix de la zone + jauge)
     2. remonter la prise (maintenir la tension)
     3. identifier l'espèce (silhouette dessinée en code)
     4. mesurer et décider (relâcher / garder)
   Une des prises est un déchet : on le trie dans la bonne poubelle.
   Tout est dessiné en code, aucun fichier image.
   Tout le contenu scientifique vient de GameData.
   Aucune sanction, aucun chronomètre : on explique et on recommence.
   Seule variable globale créée par ce fichier : SceneFishing.
   ============================================================ */

const SceneFishing = class extends Phaser.Scene {

  constructor() { super('Fishing'); }

  /* ============================================================
     CYCLE DE VIE
     ============================================================ */
  create() {
    /* la barre d'état du village masquerait la barre de la mission */
    if (typeof UI !== 'undefined' && UI.showHud) { UI.showHud(false); UI.hideAll(); }

    this.W = 960;
    this.H = 600;
    this.busy = false;          /* vrai pendant une boîte de dialogue */
    this.step = 'intro';
    this.catchIndex = 0;
    this.caughtIds = [];
    this.usedTrash = [];
    this.releasedCount = 0;
    this.keptCount = 0;
    this.trashCount = 0;
    this.protectedSeen = false;
    this.closed = false;
    this.chosenZone = 'surface';

    /* le programme de la sortie : trois poissons et un déchet */
    this.plan = ['fish', 'fish', 'trash', 'fish'];

    this.readLooks();
    this.buildTextures();
    this.createSea();
    this.createHud();
    this.createHint();

    this.panel = this.add.container(0, 0).setDepth(24);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._wasDown = true;       /* on attend un relâchement avant d'écouter */

    this.cameras.main.fadeIn(420, 8, 32, 56);
    this.events.once('shutdown', this.shutdown, this);
    this.time.delayedCall(420, () => this.intro());
  }

  /* Fermeture propre de la scène (appelée aussi par Phaser). */
  shutdown() {
    if (this.closed) return;
    this.closed = true;
    if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
    this.tweens.killAll();
  }

  /* Prépare les apparences du joueur et du capitaine à partir des données. */
  readLooks() {
    const base = {
      skin: 1, hair: 0, hairColor: 1, outfit: 0,
      cloth: 5, pants: 10, shoes: 11, hat: 'aucun', glasses: 'aucune'
    };
    let child = null;
    let marin = null;
    if (typeof State !== 'undefined' && State.get && State.get()) child = State.get().child;
    if (typeof GameData !== 'undefined' && GameData.npcs) {
      marin = GameData.npcs.filter((n) => n.id === 'marin')[0];
    }
    this.playerLook = Object.assign({}, base, (child && child.look) || {});
    this.capLook = Object.assign(
      {}, base,
      { skin: 2, hair: 5, hairColor: 7, outfit: 4, cloth: 9, hat: 'casquette' },
      (marin && marin.look) || {}
    );
    this.capName = (marin && marin.name) || 'Capitaine Marin';
    this.playerName = (child && child.name) || 'Moussaillon';
    this.capPortrait = ((typeof LPC !== 'undefined' && LPC.disponible())
      ? LPC.portrait(this, LPC.lookPnj('marin'), 96) : null) || Art.portrait(this.capLook, '#3fa4d6');
  }

  /* ============================================================
     PETITS UTILITAIRES
     ============================================================ */

  /* 0xRRGGBB -> '#rrggbb' pour le dessin sur canevas */
  hex(n) { return '#' + ('000000' + ((n >>> 0) & 0xffffff).toString(16)).slice(-6); }

  /* éclaircit (amt > 0) ou assombrit (amt < 0) une couleur, en CSS */
  shade(n, amt) {
    const r = Phaser.Math.Clamp(((n >> 16) & 255) + amt, 0, 255);
    const g = Phaser.Math.Clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = Phaser.Math.Clamp((n & 255) + amt, 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* même chose mais en nombre, pour les Graphics de Phaser */
  shadeN(n, amt) {
    const r = Phaser.Math.Clamp(((n >> 16) & 255) + amt, 0, 255);
    const g = Phaser.Math.Clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = Phaser.Math.Clamp((n & 255) + amt, 0, 255);
    return (r << 16) | (g << 8) | b;
  }

  pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* dialogue du capitaine (tolérant si l'interface n'est pas encore prête) */
  say(lines, onDone) {
    const done = onDone || function () { };
    if (typeof UI !== 'undefined' && UI.say) {
      this.busy = true;
      UI.say(this.capName, this.capPortrait, lines, () => { this.busy = false; done(); });
    } else { done(); }
  }

  toast(text) {
    if (typeof UI !== 'undefined' && UI.toast) UI.toast(text);
  }

  /* texte confortable à lire */
  label(x, y, str, size, color, bold) {
    const t = this.add.text(x, y, str, {
      fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
      fontSize: size + 'px',
      color: color || '#ffffff',
      align: 'center',
      fontStyle: bold === false ? '' : 'bold'
    });
    t.setOrigin(0.5);
    t.setResolution(2);
    return t;
  }

  /* Bouton arrondi avec rebond au clic. */
  button(x, y, w, h, text, color, onClick, sub) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x0b2233, 0.30); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 14);
    g.fillStyle(this.shadeN(color, -46), 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(color, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h - 7, 14);
    g.fillStyle(0xffffff, 0.20); g.fillRoundedRect(-w / 2 + 7, -h / 2 + 6, w - 14, h / 3, 9);
    c.add(g);
    const size = sub ? Math.min(23, Math.floor(h / 3)) : Math.min(26, Math.floor(h / 2.4));
    const t = this.label(0, sub ? -9 : 0, text, size, '#ffffff');
    c.add(t);
    if (sub) c.add(this.label(0, 15, sub, 14, '#eaf6ff'));
    c.setSize(w, h);
    /* Zone cliquable un peu plus grande que le bouton : plus facile pour
       une petite main, et on ne rate plus les bords. */
    const marge = 10;
    c.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2 - marge, -h / 2 - marge, w + marge * 2, h + marge * 2),
      Phaser.Geom.Rectangle.Contains);
    c.on('pointerover', () => { if (!this.busy) this.tweens.add({ targets: c, scale: 1.06, duration: 130, ease: 'Back.out' }); });
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 130, ease: 'Quad.out' }));
    c.on('pointerdown', () => {
      if (this.busy) return;
      /* L'action part TOUT DE SUITE. Le rebond n'est que décoratif :
         avant, l'action attendait la fin de l'animation, et si le curseur
         sortait du bouton pendant qu'il rétrécissait, l'animation était
         remplacée et le clic se perdait. */
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: 0.92, duration: 80, yoyo: true, ease: 'Quad.out' });
      if (onClick) onClick();
    });
    return c;
  }

  /* vide la zone de jeu (et coupe les tweens en cours) */
  clearPanel() {
    this.panel.list.slice().forEach((o) => this.tweens.killTweensOf(o));
    this.panel.removeAll(true);
  }

  /* voile sombre pour rendre les panneaux bien lisibles */
  scrim(alpha) {
    const g = this.add.graphics();
    g.fillStyle(0x06283c, alpha === undefined ? 0.34 : alpha);
    g.fillRect(0, 44, this.W, this.H - 44);
    this.panel.add(g);
    return g;
  }

  /* ============================================================
     EFFETS : étoiles et éclaboussures
     ============================================================ */
  stars(px, py) {
    for (let i = 0; i < 16; i++) {
      const s = this.add.image(px, py, 'fi_spark').setDepth(29)
        .setScale(Phaser.Math.FloatBetween(0.7, 1.6));
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 110;
      this.tweens.add({
        targets: s, x: px + Math.cos(a) * d, y: py + Math.sin(a) * d,
        alpha: 0, scale: 0, angle: Phaser.Math.Between(-200, 200),
        duration: 480 + Math.random() * 420, ease: 'Quad.out',
        onComplete: () => s.destroy()
      });
    }
  }

  splash(px, py) {
    /* gouttes qui retombent */
    for (let i = 0; i < 18; i++) {
      const d = this.add.image(px, py, 'fi_drop').setDepth(29)
        .setScale(Phaser.Math.FloatBetween(0.7, 1.7));
      const vx = Phaser.Math.FloatBetween(-190, 190);
      const vy = Phaser.Math.FloatBetween(-280, -110);
      const o = { t: 0 };
      this.tweens.add({
        targets: o, t: 1, duration: 760, ease: 'Linear',
        onUpdate: () => {
          d.x = px + vx * o.t;
          d.y = py + vy * o.t + 440 * o.t * o.t;
          d.alpha = 1 - o.t * o.t;
          d.angle = vx * o.t * 0.4;
        },
        onComplete: () => d.destroy()
      });
    }
    /* anneau d'écume */
    const ring = this.add.graphics().setDepth(28);
    const o2 = { r: 6 };
    this.tweens.add({
      targets: o2, r: 90, duration: 560, ease: 'Quad.out',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(5, 0xffffff, Math.max(0, 1 - o2.r / 90));
        ring.strokeEllipse(px, py, o2.r * 2, o2.r * 0.75);
      },
      onComplete: () => ring.destroy()
    });
  }

  /* ============================================================
     DÉCOR ANIMÉ : ciel, soleil, nuages, mer, bateau, mouettes
     ============================================================ */
  createSea() {
    this.add.image(0, 0, 'fi_sky').setOrigin(0, 0).setDepth(0);

    this.sun = this.add.image(812, 96, 'fi_sun').setDepth(1);
    this.tweens.add({ targets: this.sun, scale: { from: 1, to: 1.07 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    /* nuages qui dérivent doucement */
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const c = this.add.image(Phaser.Math.Between(0, this.W), Phaser.Math.Between(70, 200), 'fi_cloud' + (i % 2))
        .setDepth(1).setAlpha(0.92).setScale(Phaser.Math.FloatBetween(0.7, 1.3));
      c.setData('spd', Phaser.Math.FloatBetween(4, 13));
      this.clouds.push(c);
    }

    /* la mer */
    this.add.image(0, 262, 'fi_sea').setOrigin(0, 0).setDepth(2);

    /* plusieurs bandes de vagues, de plus en plus grandes vers nous */
    this.waves = [];
    const bands = [
      { y: 268, key: 'fi_wave0', spd: 7, sc: 1.0, a: 0.75, amp: 2 },
      { y: 300, key: 'fi_wave1', spd: 12, sc: 1.1, a: 0.85, amp: 3 },
      { y: 348, key: 'fi_wave0', spd: -16, sc: 1.3, a: 0.85, amp: 4 },
      { y: 412, key: 'fi_wave2', spd: 22, sc: 1.5, a: 0.9, amp: 5 },
      { y: 496, key: 'fi_wave1', spd: -28, sc: 1.9, a: 0.95, amp: 6 },
      { y: 566, key: 'fi_wave2', spd: 34, sc: 2.3, a: 1, amp: 7 }
    ];
    bands.forEach((b, i) => {
      const t = this.add.tileSprite(0, b.y, this.W, 26, b.key).setOrigin(0, 0)
        .setScale(1, b.sc).setAlpha(b.a).setDepth(i >= 4 ? 7 : 3);
      t.setData('base', b.y);
      t.setData('spd', b.spd);
      t.setData('amp', b.amp);
      t.setData('ph', i * 0.9);
      this.waves.push(t);
    });

    /* le bateau et ses passagers, dans un même groupe pour tanguer ensemble */
    this.boat = this.add.container(178, 486).setDepth(5);
    this.boat.add(this.add.image(0, 0, 'fi_boat'));

    /* personnages LPC si disponibles, sinon ceux dessinés en code */
    const lpcOk = (typeof LPC !== 'undefined') && LPC.disponible();
    let player, cap;
    if (lpcOk) {
      const lookJoueur = (State.get().child.look && State.get().child.look.lpc) || LPC.lookParDefaut();
      player = LPC.spriteFixe(this, lookJoueur, -78, -34, 1.6);
      cap = LPC.spriteFixe(this, LPC.lookPnj('marin'), -6, -34, 1.6);
    }
    if (!player) {
      Art.character(this, 'fi_player', this.playerLook);
      player = this.add.sprite(-78, -46, 'fi_player', 0).setScale(2);
    }
    if (!cap) {
      Art.character(this, 'fi_capitaine', this.capLook);
      cap = this.add.sprite(-6, -46, 'fi_capitaine', 0).setScale(2);
    }
    this.boat.add([player, cap]);
    /* le capitaine bouge un peu, comme s'il parlait */
    this.tweens.add({ targets: cap, y: cap.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.tweens.add({ targets: this.boat, angle: { from: -1.8, to: 1.8 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: this.boat, y: 496, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    /* mouettes */
    this.gulls = [];
    for (let i = 0; i < 3; i++) {
      const g = this.add.image(Phaser.Math.Between(-200, this.W), Phaser.Math.Between(70, 190), 'fi_gull0')
        .setDepth(4).setScale(Phaser.Math.FloatBetween(0.8, 1.5));
      g.setData('spd', Phaser.Math.FloatBetween(24, 52));
      this.gulls.push(g);
    }
  }

  /* animation continue du décor */
  animateDecor(time, dt) {
    this.clouds.forEach((c) => {
      c.x += c.getData('spd') * dt;
      if (c.x > this.W + 90) c.x = -90;
    });
    this.waves.forEach((w) => {
      w.tilePositionX += w.getData('spd') * dt;
      w.y = w.getData('base') + Math.sin(time * 0.0016 + w.getData('ph')) * w.getData('amp');
    });
    this.gulls.forEach((g, i) => {
      g.x += g.getData('spd') * dt;
      g.y += Math.sin(time * 0.002 + i) * 0.25;
      if (g.x > this.W + 60) { g.x = -60; g.y = Phaser.Math.Between(70, 190); }
      g.setTexture(Math.floor(time / 190 + i) % 2 ? 'fi_gull0' : 'fi_gull1');
    });
  }

  /* ============================================================
     BARRE D'ÉTAT ET CONSIGNE
     ============================================================ */
  createHud() {
    const c = this.add.container(0, 0).setDepth(30);
    const g = this.add.graphics();
    g.fillStyle(0x0b2233, 0.9); g.fillRect(0, 0, this.W, 46);
    g.fillStyle(0x8fd6f2, 0.55); g.fillRect(0, 44, this.W, 3);
    c.add(g);
    c.add(this.add.image(28, 23, 'fi_ico_ancre'));
    const title = this.label(52, 23, 'Pêche responsable', 22, '#ffffff');
    title.setOrigin(0, 0.5);
    c.add(title);
    this.hudCount = this.label(560, 23, '', 20, '#ffe9a8');
    c.add(this.hudCount);
    c.add(this.button(882, 23, 132, 34, 'Quitter', 0xe8663d, () => this.leave()));
    this.updateHud();
  }

  updateHud() {
    const n = Math.min(this.catchIndex + 1, this.plan.length);
    this.hudCount.setText('Prise ' + n + ' / ' + this.plan.length);
    this.tweens.add({ targets: this.hudCount, scale: { from: 1.25, to: 1 }, duration: 260, ease: 'Back.out' });
  }

  createHint() {
    this.hintBox = this.add.container(this.W / 2, 88).setDepth(23);
    const g = this.add.graphics();
    g.fillStyle(0x0b2233, 0.78); g.fillRoundedRect(-340, -34, 680, 68, 18);
    g.lineStyle(3, 0x8fd6f2, 0.85); g.strokeRoundedRect(-340, -34, 680, 68, 18);
    this.hintIcon = this.add.image(-300, 0, 'fi_ico_canne').setScale(1.25);
    this.hintText = this.add.text(-266, 0, '', {
      fontFamily: '"Trebuchet MS", "Verdana", sans-serif',
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      align: 'left', lineSpacing: 4
    }).setOrigin(0, 0.5);
    this.hintText.setResolution(2);
    this.hintBox.add([g, this.hintIcon, this.hintText]);
  }

  /* consigne très courte : deux lignes maximum */
  setHint(icon, line1, line2) {
    if (this.textures.exists('fi_ico_' + icon)) this.hintIcon.setTexture('fi_ico_' + icon);
    this.hintText.setText(line2 ? line1 + '\n' + line2 : line1);
    this.tweens.killTweensOf(this.hintBox);
    this.hintBox.setScale(0.92);
    this.tweens.add({ targets: this.hintBox, scale: 1, duration: 260, ease: 'Back.out' });
  }

  leave() {
    if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
    this.scene.start('Village');
  }

  /* ============================================================
     BOUCLE DE JEU
     ============================================================ */
  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    this.animateDecor(time, dt);

    const down = this.input.activePointer.isDown || this.keySpace.isDown;
    const justDown = down && !this._wasDown;
    this._wasDown = down;
    if (this.busy) return;

    if (this.step === 'castgauge') {
      this.updateCast(dt, down, justDown);
    } else if (this.step === 'reel') {
      this.updateReel(dt, down);
    }
  }

  /* ============================================================
     FABRIQUE DE TEXTURES — tout est dessiné à la main
     ============================================================ */
  buildTextures() {
    const W = this.W;

    /* ---------- ciel dégradé ---------- */
    Art.make(this, 'fi_sky', W, 300, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2f8fd0');
      g.addColorStop(0.55, '#79ccee');
      g.addColorStop(1, '#dff2f7');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      /* quelques oiseaux minuscules au loin */
      x.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 14; i++) {
        const px = (i * 97) % w, py = 30 + ((i * 53) % 120);
        x.fillRect(px, py, 3, 1); x.fillRect(px + 3, py - 1, 3, 1);
      }
    });

    /* ---------- soleil ---------- */
    Art.make(this, 'fi_sun', 120, 120, (x, w, h) => {
      const cx = w / 2, cy = h / 2;
      const g = x.createRadialGradient(cx, cy, 10, cx, cy, 58);
      g.addColorStop(0, 'rgba(255,245,190,0.95)');
      g.addColorStop(0.45, 'rgba(255,230,140,0.35)');
      g.addColorStop(1, 'rgba(255,230,140,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 58, 0, 7); x.fill();
      x.fillStyle = '#f7d95f'; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill();
      x.fillStyle = '#fff2b8'; x.beginPath(); x.arc(cx - 5, cy - 6, 18, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - 9, cy - 10, 7, 0, 7); x.fill();
    });

    /* ---------- nuages ---------- */
    for (let v = 0; v < 2; v++) {
      Art.make(this, 'fi_cloud' + v, 150, 66, (x, w, h) => {
        const blobs = v === 0
          ? [[42, 40, 22], [72, 34, 26], [104, 42, 19], [60, 46, 20]]
          : [[36, 42, 18], [64, 36, 22], [92, 40, 24], [118, 46, 15]];
        x.fillStyle = '#cfe4ef';
        blobs.forEach((b) => { x.beginPath(); x.arc(b[0], b[1] + 4, b[2], 0, 7); x.fill(); });
        x.fillStyle = '#ffffff';
        blobs.forEach((b) => { x.beginPath(); x.arc(b[0], b[1], b[2] - 1, 0, 7); x.fill(); });
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.fillRect(24, 44, 100, 6);
      });
    }

    /* ---------- la mer ---------- */
    Art.make(this, 'fi_sea', W, 340, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#57bde0');
      g.addColorStop(0.35, '#3fa4d6');
      g.addColorStop(1, '#1c6a9c');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      /* reflets */
      x.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i = 0; i < 130; i++) {
        const px = Math.random() * w, py = Math.random() * h;
        x.fillRect(px, py, 2 + Math.random() * 14, 2);
      }
      /* traînée du soleil */
      x.fillStyle = 'rgba(255,240,180,0.13)';
      for (let i = 0; i < 26; i++) {
        const py = i * 12;
        x.fillRect(780 - i * 3, py, 90 + i * 6, 4);
      }
    });

    /* ---------- bandes de vagues (motif répétable) ---------- */
    const waveCols = [
      ['#bfe9f7', '#6cc6ea'],
      ['#8fdcf5', '#3fa4d6'],
      ['#ffffff', '#8fdcf5']
    ];
    waveCols.forEach((c, i) => {
      Art.make(this, 'fi_wave' + i, 160, 26, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        for (let px = 0; px < w; px++) {
          const y = 11 + Math.sin((px / w) * Math.PI * 2) * 6;
          x.fillStyle = c[0]; x.fillRect(px, Math.round(y), 1, 3);
          x.fillStyle = c[1]; x.fillRect(px, Math.round(y) + 3, 1, 3);
        }
        /* petites crêtes d'écume */
        x.fillStyle = '#ffffff';
        [18, 74, 122].forEach((px) => {
          const y = 11 + Math.sin((px / w) * Math.PI * 2) * 6;
          x.fillRect(px, Math.round(y) - 1, 8, 2);
        });
      });
    });

    /* ---------- le bateau ---------- */
    Art.make(this, 'fi_boat', 320, 180, (x, w, h) => {
      /* coque */
      x.fillStyle = '#8d5f34';
      x.beginPath(); x.moveTo(8, 92); x.lineTo(312, 92); x.lineTo(276, 154); x.lineTo(44, 154); x.closePath(); x.fill();
      x.fillStyle = '#b07a45';
      x.beginPath(); x.moveTo(14, 96); x.lineTo(306, 96); x.lineTo(280, 138); x.lineTo(46, 138); x.closePath(); x.fill();
      x.fillStyle = '#c9975f';
      for (let y = 100; y < 136; y += 9) x.fillRect(18 + (y - 100) * 0.5, y, 280 - (y - 100), 3);
      /* bande rouge */
      x.fillStyle = '#c9483c'; x.fillRect(16, 92, 288, 6);
      x.fillStyle = '#e0665a'; x.fillRect(16, 92, 288, 2);
      /* pont */
      x.fillStyle = '#c9a06a'; x.fillRect(14, 84, 292, 9);
      x.fillStyle = '#b08853';
      for (let px = 20; px < 300; px += 22) x.fillRect(px, 84, 2, 9);
      /* bastingage */
      x.fillStyle = '#8d6a3e';
      for (let px = 20; px < 300; px += 26) x.fillRect(px, 62, 4, 22);
      x.fillRect(16, 60, 288, 4);
      x.fillStyle = '#c9975f'; x.fillRect(16, 60, 288, 2);
      /* cabine à droite */
      x.fillStyle = '#e2d7c2'; x.fillRect(212, 30, 88, 54);
      x.fillStyle = '#cbbfa6'; x.fillRect(212, 30, 88, 4);
      x.fillStyle = '#7a9bb8';
      x.beginPath(); x.moveTo(204, 32); x.lineTo(308, 32); x.lineTo(300, 18); x.lineTo(212, 18); x.closePath(); x.fill();
      x.fillStyle = '#9ab8d0'; x.fillRect(206, 28, 102, 4);
      /* hublots */
      [[236, 54], [276, 54]].forEach((p) => {
        x.fillStyle = '#7a4f2a'; x.beginPath(); x.arc(p[0], p[1], 13, 0, 7); x.fill();
        x.fillStyle = '#bfe3f5'; x.beginPath(); x.arc(p[0], p[1], 10, 0, 7); x.fill();
        x.fillStyle = '#8fc9e8'; x.beginPath(); x.arc(p[0] + 3, p[1] + 3, 7, 0, 7); x.fill();
      });
      /* mât et fanion */
      x.fillStyle = '#8d5f34'; x.fillRect(186, 0, 7, 84);
      x.fillStyle = '#e8503a';
      x.beginPath(); x.moveTo(193, 4); x.lineTo(232, 16); x.lineTo(193, 28); x.closePath(); x.fill();
      /* bouée accrochée */
      x.fillStyle = '#e8503a'; x.beginPath(); x.arc(320 - 12, 74, 12, 0, 7); x.fill();
      x.fillStyle = '#f2f0e8'; x.beginPath(); x.arc(320 - 12, 74, 8, 0, 7); x.fill();
      x.fillStyle = '#b07a45'; x.beginPath(); x.arc(320 - 12, 74, 4, 0, 7); x.fill();
      /* canne à pêche à l'avant */
      x.strokeStyle = '#6b4526'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(56, 76); x.lineTo(4, 8); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(4, 8); x.lineTo(2, 96); x.stroke();
      /* caisse et cordage sur le pont */
      x.fillStyle = '#b07a45'; x.fillRect(96, 62, 30, 22);
      x.fillStyle = '#8d5f34'; x.fillRect(96, 62, 30, 3); x.fillRect(96, 81, 30, 3);
      x.fillStyle = '#c9a06a'; x.fillRect(108, 62, 3, 22);
      x.strokeStyle = '#d8c49a'; x.lineWidth = 3;
      x.beginPath(); x.arc(146, 76, 8, 0, 7); x.stroke();
      x.beginPath(); x.arc(146, 76, 4, 0, 7); x.stroke();
    });

    /* ---------- mouettes (deux positions d'ailes) ---------- */
    for (let v = 0; v < 2; v++) {
      Art.make(this, 'fi_gull' + v, 34, 22, (x, w, h) => {
        const up = v === 0;
        x.fillStyle = '#f7f7f2';
        x.beginPath(); x.ellipse(17, 13, 8, 4, 0, 0, 7); x.fill();
        x.fillStyle = '#e6e6de';
        x.beginPath();
        if (up) { x.moveTo(16, 12); x.lineTo(2, 2); x.lineTo(12, 12); }
        else { x.moveTo(16, 12); x.lineTo(3, 19); x.lineTo(12, 12); }
        x.closePath(); x.fill();
        x.beginPath();
        if (up) { x.moveTo(18, 12); x.lineTo(32, 2); x.lineTo(22, 12); }
        else { x.moveTo(18, 12); x.lineTo(31, 19); x.lineTo(22, 12); }
        x.closePath(); x.fill();
        x.fillStyle = '#f7f7f2'; x.beginPath(); x.arc(24, 10, 3, 0, 7); x.fill();
        x.fillStyle = '#f2b333'; x.fillRect(26, 9, 5, 2);
        x.fillStyle = '#2f2838'; x.fillRect(24, 9, 2, 2);
      });
    }

    /* ---------- particules ---------- */
    Art.make(this, 'fi_spark', 12, 12, (x) => {
      x.fillStyle = '#fff3c4'; x.fillRect(5, 0, 2, 12); x.fillRect(0, 5, 12, 2);
      x.fillStyle = '#ffd75f'; x.fillRect(3, 3, 6, 6);
      x.fillStyle = '#ffffff'; x.fillRect(5, 5, 2, 2);
    });
    Art.make(this, 'fi_drop', 10, 14, (x) => {
      x.fillStyle = '#6cc6ea'; x.fillRect(2, 3, 6, 10); x.fillRect(3, 0, 4, 4);
      x.fillStyle = '#bfe3f5'; x.fillRect(3, 4, 2, 5);
      x.fillStyle = '#ffffff'; x.fillRect(3, 3, 2, 2);
    });

    /* ---------- curseur de la jauge de lancer ---------- */
    Art.make(this, 'fi_cursor', 22, 78, (x, w, h) => {
      x.fillStyle = '#20242c'; x.fillRect(9, 16, 4, 60);
      x.fillStyle = '#ffe9a8'; x.fillRect(10, 16, 2, 60);
      x.fillStyle = '#20242c';
      x.beginPath(); x.moveTo(11, 22); x.lineTo(0, 2); x.lineTo(22, 2); x.closePath(); x.fill();
      x.fillStyle = '#f5c542';
      x.beginPath(); x.moveTo(11, 18); x.lineTo(3, 4); x.lineTo(19, 4); x.closePath(); x.fill();
    });

    /* ---------- icônes de consigne ---------- */
    this.buildIcons();

    /* ---------- cartes des trois zones de pêche ---------- */
    this.buildZoneCards();
  }

  /* petites icônes 32x32 pour la barre de consigne */
  buildIcons() {
    const set = {
      canne: (x) => {
        x.strokeStyle = '#8d5f34'; x.lineWidth = 4;
        x.beginPath(); x.moveTo(4, 29); x.lineTo(24, 5); x.stroke();
        x.strokeStyle = '#e8eef2'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(24, 5); x.lineTo(28, 24); x.stroke();
        x.fillStyle = '#9aa6b5'; x.fillRect(26, 22, 4, 5);
        x.fillStyle = '#f5c542'; x.beginPath(); x.arc(11, 22, 4, 0, 7); x.fill();
      },
      poisson: (x) => {
        x.fillStyle = '#4fa8d8'; x.beginPath(); x.ellipse(17, 16, 11, 7, 0, 0, 7); x.fill();
        x.fillStyle = '#2f7fa8';
        x.beginPath(); x.moveTo(8, 16); x.lineTo(1, 9); x.lineTo(1, 23); x.closePath(); x.fill();
        x.fillStyle = '#bfe3f5'; x.beginPath(); x.ellipse(18, 19, 8, 3, 0, 0, 7); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(23, 13, 3, 0, 7); x.fill();
        x.fillStyle = '#2f2838'; x.beginPath(); x.arc(24, 13, 1.6, 0, 7); x.fill();
      },
      loupe: (x) => {
        x.strokeStyle = '#6b4526'; x.lineWidth = 5;
        x.beginPath(); x.moveTo(20, 20); x.lineTo(29, 29); x.stroke();
        x.fillStyle = '#f2f0e8'; x.beginPath(); x.arc(14, 13, 11, 0, 7); x.fill();
        x.fillStyle = '#bfe3f5'; x.beginPath(); x.arc(14, 13, 9, 0, 7); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(11, 10, 4, 0, 7); x.fill();
        x.strokeStyle = '#9aa6b5'; x.lineWidth = 3;
        x.beginPath(); x.arc(14, 13, 10, 0, 7); x.stroke();
      },
      regle: (x) => {
        x.fillStyle = '#f5c542'; x.fillRect(2, 10, 28, 13);
        x.fillStyle = '#e0a63c'; x.fillRect(2, 19, 28, 4);
        x.fillStyle = '#6b4526';
        for (let i = 5; i < 30; i += 5) x.fillRect(i, 10, 2, i % 10 === 0 ? 9 : 5);
      },
      poubelle: (x) => {
        x.fillStyle = '#5fbf7a';
        x.beginPath(); x.moveTo(7, 11); x.lineTo(25, 11); x.lineTo(22, 30); x.lineTo(10, 30); x.closePath(); x.fill();
        x.fillStyle = '#8fd4a0'; x.fillRect(9, 13, 4, 15);
        x.fillStyle = '#3f8f58'; x.fillRect(4, 6, 24, 6);
        x.fillRect(13, 2, 6, 4);
      },
      coche: (x) => {
        x.fillStyle = '#5fbf7a'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill();
        x.fillStyle = '#8fd4a0'; x.beginPath(); x.arc(16, 16, 11, 0, 7); x.fill();
        x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.lineCap = 'round';
        x.beginPath(); x.moveTo(9, 16); x.lineTo(14, 22); x.lineTo(24, 10); x.stroke();
      },
      ancre: (x) => {
        x.strokeStyle = '#e8eef2'; x.lineWidth = 3;
        x.beginPath(); x.moveTo(16, 8); x.lineTo(16, 27); x.stroke();
        x.beginPath(); x.moveTo(8, 12); x.lineTo(24, 12); x.stroke();
        x.beginPath(); x.arc(16, 20, 10, 0.5, Math.PI - 0.5); x.stroke();
        x.fillStyle = '#e8eef2'; x.beginPath(); x.arc(16, 6, 4, 0, 7); x.fill();
        x.fillStyle = '#0b2233'; x.beginPath(); x.arc(16, 6, 2, 0, 7); x.fill();
      },
      vague: (x) => {
        x.fillStyle = '#3fa4d6'; x.fillRect(2, 14, 28, 15);
        x.fillStyle = '#6cc6ea'; x.fillRect(2, 11, 12, 4); x.fillRect(17, 14, 13, 4);
        x.fillStyle = '#bfe3f5'; x.fillRect(4, 9, 8, 2); x.fillRect(19, 12, 8, 2);
      }
    };
    Object.keys(set).forEach((k) => Art.make(this, 'fi_ico_' + k, 32, 32, set[k]));
  }

  /* un petit poisson générique, utile pour illustrer les zones */
  miniFish(x, px, py, s, col, dark) {
    x.fillStyle = col;
    x.beginPath(); x.ellipse(px, py, s, s * 0.55, 0, 0, 7); x.fill();
    x.fillStyle = dark;
    x.beginPath(); x.moveTo(px - s * 0.85, py); x.lineTo(px - s * 1.6, py - s * 0.6);
    x.lineTo(px - s * 1.6, py + s * 0.6); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(px + s * 0.4, py - s * 0.2, 2, 2);
  }

  /* les trois zones de pêche, illustrées */
  buildZoneCards() {
    Art.make(this, 'fi_zone_surface', 210, 140, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#9fe6fa'); g.addColorStop(1, '#3fa4d6');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.16)';
      for (let i = 0; i < 5; i++) {
        x.beginPath(); x.moveTo(20 + i * 40, 0); x.lineTo(46 + i * 40, 0);
        x.lineTo(12 + i * 40, h); x.lineTo(-6 + i * 40, h); x.closePath(); x.fill();
      }
      x.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) x.fillRect(6 + i * 54, 8 + (i % 2) * 4, 34, 3);
      this.miniFish(x, 70, 52, 11, '#9fc4d8', '#6f95ab');
      this.miniFish(x, 118, 74, 9, '#9fc4d8', '#6f95ab');
      this.miniFish(x, 152, 44, 8, '#4f7f8c', '#35606d');
      this.miniFish(x, 92, 100, 10, '#4f7f8c', '#35606d');
      x.fillStyle = 'rgba(255,255,255,0.5)';
      [[40, 120], [170, 108], [130, 128]].forEach((b) => { x.beginPath(); x.arc(b[0], b[1], 3, 0, 7); x.fill(); });
    });

    Art.make(this, 'fi_zone_milieu', 210, 140, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#3fa4d6'); g.addColorStop(1, '#1f6d9e');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      /* algues qui montent du bas */
      x.fillStyle = '#2f7a4a';
      for (let i = 0; i < 4; i++) {
        const bx = 24 + i * 52;
        for (let y = h; y > 60; y -= 6) x.fillRect(bx + Math.sin(y / 12 + i) * 6, y, 6, 6);
      }
      this.miniFish(x, 84, 56, 13, '#b9c6cf', '#7d8f9c');
      this.miniFish(x, 148, 88, 10, '#c9cfd6', '#8e99a4');
      this.miniFish(x, 48, 96, 8, '#a8894e', '#7d6538');
      x.fillStyle = 'rgba(255,255,255,0.45)';
      [[160, 40, 4], [172, 62, 3], [150, 22, 2]].forEach((b) => { x.beginPath(); x.arc(b[0], b[1], b[2], 0, 7); x.fill(); });
    });

    Art.make(this, 'fi_zone_fond', 210, 140, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1f6d9e'); g.addColorStop(1, '#0e3f60');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      /* sable */
      x.fillStyle = '#e0cb92';
      x.beginPath(); x.moveTo(0, 112); x.quadraticCurveTo(60, 100, 120, 110);
      x.quadraticCurveTo(180, 120, 210, 106); x.lineTo(210, 140); x.lineTo(0, 140); x.closePath(); x.fill();
      x.fillStyle = '#c9b47c';
      for (let i = 0; i < 60; i++) x.fillRect(Math.random() * w, 112 + Math.random() * 26, 2, 2);
      /* rochers */
      x.fillStyle = '#5f6f7a';
      x.beginPath(); x.ellipse(34, 108, 24, 14, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(178, 112, 20, 12, 0, 0, 7); x.fill();
      x.fillStyle = '#7b8a94';
      x.beginPath(); x.ellipse(30, 104, 18, 9, 0, 0, 7); x.fill();
      /* une sole posée sur le sable et une étoile */
      x.fillStyle = '#b2986c';
      x.beginPath(); x.ellipse(112, 124, 26, 9, 0, 0, 7); x.fill();
      x.fillStyle = '#8f7950'; x.fillRect(90, 123, 44, 2);
      x.fillStyle = '#e27a5a';
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 13;
        x.lineTo(168 + Math.cos(a) * r, 126 + Math.sin(a) * r);
      }
      x.closePath(); x.fill();
    });
  }

  /* ============================================================
     SILHOUETTES DE POISSONS — au moins cinq formes différentes
     ============================================================ */
  fishTexture(f) {
    const key = 'fi_fish_' + f.id;
    Art.make(this, key, 340, 210, (x, w, h) => this.drawFish(x, w, h, f));
    return key;
  }

  drawFish(x, w, h, f) {
    const C = f.colors;
    const body = this.hex(C.body), belly = this.hex(C.belly);
    const fin = this.hex(C.fin), spot = this.hex(C.spot);
    const deep = this.shade(C.fin, -34);
    const light = this.shade(C.body, 26);
    const cx = w / 2, cy = h / 2;
    x.lineJoin = 'round';

    const eye = (ex, ey, r) => {
      x.fillStyle = '#f7f7f2'; x.beginPath(); x.arc(ex, ey, r, 0, 7); x.fill();
      x.fillStyle = '#20242c'; x.beginPath(); x.arc(ex + r * 0.25, ey, r * 0.55, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(ex - r * 0.4, ey - r * 0.6, 3, 3);
    };

    /* --- l'hippocampe a sa propre silhouette, tout debout --- */
    if (f.id === 'hippocampe') {
      x.strokeStyle = fin; x.lineWidth = 34; x.lineCap = 'round';
      x.beginPath();
      x.moveTo(cx + 6, cy - 78);
      x.bezierCurveTo(cx + 44, cy - 46, cx - 26, cy - 4, cx + 8, cy + 40);
      x.stroke();
      x.strokeStyle = body; x.lineWidth = 26;
      x.beginPath();
      x.moveTo(cx + 6, cy - 78);
      x.bezierCurveTo(cx + 44, cy - 46, cx - 26, cy - 4, cx + 8, cy + 40);
      x.stroke();
      /* queue enroulée */
      x.strokeStyle = fin; x.lineWidth = 18; x.beginPath();
      x.arc(cx - 6, cy + 54, 22, -1.1, 4.4); x.stroke();
      x.strokeStyle = body; x.lineWidth = 12; x.beginPath();
      x.arc(cx - 6, cy + 54, 22, -1.1, 4.4); x.stroke();
      /* tête et museau */
      x.fillStyle = body;
      x.beginPath(); x.ellipse(cx + 2, cy - 82, 24, 20, -0.3, 0, 7); x.fill();
      x.fillStyle = fin; x.fillRect(cx + 18, cy - 84, 40, 12);
      x.fillStyle = body; x.fillRect(cx + 18, cy - 84, 34, 9);
      /* petite couronne d'épines */
      x.fillStyle = deep;
      for (let i = 0; i < 5; i++) x.fillRect(cx - 14 + i * 7, cy - 104 + Math.abs(i - 2) * 3, 5, 10);
      /* anneaux du corps */
      x.strokeStyle = spot; x.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const px = cx + 6 + Math.sin(t * 3.1) * 22 - t * 8;
        const py = cy - 62 + t * 96;
        x.beginPath(); x.moveTo(px - 13, py); x.lineTo(px + 13, py - 3); x.stroke();
      }
      /* nageoire dorsale */
      x.fillStyle = belly;
      x.beginPath(); x.ellipse(cx + 30, cy - 8, 10, 26, 0.3, 0, 7); x.fill();
      eye(cx + 8, cy - 86, 7);
      return;
    }

    /* --- étoile de mer --- */
    if (f.shape === 'etoile') {
      const R = 96, r0 = 40;
      const star = (rad, inner, col) => {
        x.fillStyle = col; x.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const rr = i % 2 ? inner : rad;
          x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        x.closePath(); x.fill();
      };
      star(R, r0, fin);
      star(R - 10, r0 - 6, body);
      /* pastilles claires sur les bras */
      x.fillStyle = belly;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        for (let k = 1; k <= 4; k++) {
          const rr = 16 + k * 15;
          x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 5 - k * 0.6, 0, 7); x.fill();
        }
      }
      x.fillStyle = spot; x.beginPath(); x.arc(cx, cy, 13, 0, 7); x.fill();
      x.fillStyle = belly; x.beginPath(); x.arc(cx - 3, cy - 3, 6, 0, 7); x.fill();
      return;
    }

    /* --- poisson plat, posé sur le sable --- */
    if (f.shape === 'plat') {
      /* frange de nageoires tout autour */
      x.fillStyle = fin;
      x.beginPath(); x.ellipse(cx, cy, 138, 62, 0, 0, 7); x.fill();
      x.fillStyle = deep;
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        x.fillRect(cx + Math.cos(a) * 134 - 3, cy + Math.sin(a) * 58 - 3, 7, 7);
      }
      x.fillStyle = body;
      x.beginPath(); x.ellipse(cx, cy, 124, 52, 0, 0, 7); x.fill();
      x.fillStyle = light;
      x.beginPath(); x.ellipse(cx - 10, cy - 10, 96, 32, 0, 0, 7); x.fill();
      /* mouchetures de camouflage */
      x.fillStyle = spot;
      for (let i = 0; i < 42; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random();
        const px = cx + Math.cos(a) * 112 * r, py = cy + Math.sin(a) * 44 * r;
        x.beginPath(); x.arc(px, py, 2 + Math.random() * 5, 0, 7); x.fill();
      }
      /* queue arrondie */
      x.fillStyle = fin;
      x.beginPath(); x.ellipse(cx - 136, cy, 20, 26, 0, 0, 7); x.fill();
      /* les deux yeux du même côté */
      eye(cx + 84, cy - 16, 9);
      eye(cx + 100, cy + 4, 8);
      x.strokeStyle = deep; x.lineWidth = 3;
      x.beginPath(); x.arc(cx + 116, cy + 20, 12, 0.2, 1.6); x.stroke();
      return;
    }

    /* --- corps très long, façon anguille --- */
    if (f.shape === 'long') {
      const n = 72;
      for (let i = n; i >= 0; i--) {
        const t = i / n;
        const px = 34 + t * (w - 76);
        const py = cy + Math.sin(t * Math.PI * 2.1 + 0.4) * 30;
        const r = 26 * (1 - t * 0.78) + 3;
        x.fillStyle = fin;
        x.beginPath(); x.arc(px, py + 4, r, 0, 7); x.fill();
        x.fillStyle = i % 8 < 4 ? body : light;
        x.beginPath(); x.arc(px, py, r - 3, 0, 7); x.fill();
      }
      /* nageoire du dessus, ondulée */
      x.fillStyle = fin;
      x.beginPath();
      for (let i = 0; i <= n; i++) {
        const t = i / n, px = 34 + t * (w - 76);
        const py = cy + Math.sin(t * Math.PI * 2.1 + 0.4) * 30 - (26 * (1 - t * 0.78));
        x.lineTo(px, py - 8 - Math.sin(t * 14) * 4);
      }
      for (let i = n; i >= 0; i--) {
        const t = i / n, px = 34 + t * (w - 76);
        const py = cy + Math.sin(t * Math.PI * 2.1 + 0.4) * 30 - (26 * (1 - t * 0.78));
        x.lineTo(px, py + 2);
      }
      x.closePath(); x.fill();
      /* ventre plus clair */
      x.fillStyle = belly;
      x.beginPath(); x.ellipse(64, cy + 22, 34, 9, 0.2, 0, 7); x.fill();
      /* tête et bouche */
      x.fillStyle = body;
      x.beginPath(); x.ellipse(38, cy + 4, 30, 24, 0, 0, 7); x.fill();
      x.fillStyle = deep;
      x.beginPath(); x.moveTo(12, cy + 10); x.lineTo(46, cy + 6); x.lineTo(46, cy + 16); x.closePath(); x.fill();
      x.fillStyle = spot;
      for (let i = 0; i < 12; i++) {
        const t = i / 12, px = 60 + t * (w - 140);
        const py = cy + Math.sin(t * Math.PI * 2.1 + 0.4) * 30;
        x.beginPath(); x.arc(px, py - 4, 3, 0, 7); x.fill();
      }
      eye(34, cy - 6, 8);
      return;
    }

    /* --- corps rond et haut (dorade) --- */
    if (f.shape === 'rond') {
      x.fillStyle = fin;
      x.beginPath(); x.moveTo(cx - 78, cy); x.lineTo(cx - 150, cy - 48);
      x.lineTo(cx - 122, cy); x.lineTo(cx - 150, cy + 48); x.closePath(); x.fill();
      /* nageoire dorsale épineuse */
      x.fillStyle = fin;
      x.beginPath(); x.moveTo(cx - 60, cy - 54);
      for (let i = 0; i <= 8; i++) x.lineTo(cx - 60 + i * 16, cy - 84 + (i % 2) * 12);
      x.lineTo(cx + 70, cy - 40); x.closePath(); x.fill();
      x.fillStyle = fin;
      x.beginPath(); x.ellipse(cx - 10, cy + 62, 52, 18, 0, 0, 7); x.fill();
      /* corps */
      x.fillStyle = body;
      x.beginPath(); x.ellipse(cx, cy, 90, 74, 0, 0, 7); x.fill();
      x.fillStyle = belly;
      x.beginPath(); x.ellipse(cx - 6, cy + 26, 74, 42, 0, 0, 7); x.fill();
      x.fillStyle = light;
      x.beginPath(); x.ellipse(cx + 6, cy - 24, 62, 34, 0, 0, 7); x.fill();
      /* écailles */
      x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2;
      for (let r = 0; r < 5; r++) {
        for (let c2 = 0; c2 < 7; c2++) {
          const px = cx - 62 + c2 * 20, py = cy - 42 + r * 20 + (c2 % 2) * 8;
          if ((px - cx) * (px - cx) / 7000 + (py - cy) * (py - cy) / 4800 > 1) continue;
          x.beginPath(); x.arc(px, py, 9, 0.4, 2.7); x.stroke();
        }
      }
      /* trait doré entre les yeux */
      x.fillStyle = spot; x.fillRect(cx + 46, cy - 34, 26, 8);
      x.fillStyle = deep;
      x.beginPath(); x.ellipse(cx + 44, cy + 14, 22, 12, -0.4, 0, 7); x.fill();
      /* museau */
      x.fillStyle = body;
      x.beginPath(); x.moveTo(cx + 74, cy - 34); x.lineTo(cx + 104, cy + 2);
      x.lineTo(cx + 72, cy + 34); x.closePath(); x.fill();
      x.strokeStyle = deep; x.lineWidth = 4;
      x.beginPath(); x.moveTo(cx + 104, cy + 2); x.lineTo(cx + 84, cy + 10); x.stroke();
      eye(cx + 58, cy - 18, 12);
      return;
    }

    /* --- forme fusiforme, la plus courante --- */
    x.fillStyle = fin;
    x.beginPath(); x.moveTo(cx - 92, cy); x.lineTo(cx - 156, cy - 46);
    x.lineTo(cx - 128, cy); x.lineTo(cx - 156, cy + 46); x.closePath(); x.fill();
    x.fillStyle = deep;
    x.beginPath(); x.moveTo(cx - 92, cy); x.lineTo(cx - 150, cy - 40);
    x.lineTo(cx - 130, cy); x.closePath(); x.fill();
    /* dorsale */
    x.fillStyle = fin;
    x.beginPath(); x.moveTo(cx - 40, cy - 40); x.lineTo(cx + 4, cy - 82);
    x.lineTo(cx + 40, cy - 36); x.closePath(); x.fill();
    /* nageoire du ventre */
    x.beginPath(); x.moveTo(cx - 24, cy + 36); x.lineTo(cx - 6, cy + 66);
    x.lineTo(cx + 26, cy + 34); x.closePath(); x.fill();
    /* corps */
    x.fillStyle = body;
    x.beginPath(); x.ellipse(cx, cy, 112, 46, 0, 0, 7); x.fill();
    x.fillStyle = light;
    x.beginPath(); x.ellipse(cx - 4, cy - 14, 96, 24, 0, 0, 7); x.fill();
    x.fillStyle = belly;
    x.beginPath(); x.ellipse(cx - 6, cy + 20, 92, 22, 0, 0, 7); x.fill();
    /* motifs du dos */
    x.fillStyle = spot;
    for (let i = 0; i < 9; i++) {
      const px = cx - 84 + i * 20;
      x.beginPath();
      x.moveTo(px, cy - 40);
      x.quadraticCurveTo(px + 7, cy - 26, px, cy - 14);
      x.quadraticCurveTo(px + 12, cy - 26, px + 8, cy - 40);
      x.closePath(); x.fill();
    }
    /* pectorale */
    x.fillStyle = deep;
    x.beginPath(); x.ellipse(cx + 22, cy + 16, 26, 13, 0.5, 0, 7); x.fill();
    /* opercule et bouche */
    x.strokeStyle = deep; x.lineWidth = 4;
    x.beginPath(); x.arc(cx + 46, cy, 34, -1.1, 1.1); x.stroke();
    x.fillStyle = body;
    x.beginPath(); x.moveTo(cx + 96, cy - 26); x.lineTo(cx + 124, cy + 2);
    x.lineTo(cx + 94, cy + 26); x.closePath(); x.fill();
    x.strokeStyle = deep; x.lineWidth = 4;
    x.beginPath(); x.moveTo(cx + 124, cy + 2); x.lineTo(cx + 102, cy + 10); x.stroke();
    eye(cx + 76, cy - 12, 11);
  }

  /* ============================================================
     DÉCHETS ET POUBELLES
     ============================================================ */
  trashTexture(t) {
    const key = 'fi_trash_' + t.id;
    Art.make(this, key, 120, 120, (x, w, h) => {
      const id = t.id;
      if (id === 'bouteille') {
        x.fillStyle = '#8fd0e0';
        x.beginPath(); x.moveTo(46, 22); x.lineTo(74, 22); x.lineTo(80, 46);
        x.lineTo(80, 106); x.lineTo(40, 106); x.lineTo(40, 46); x.closePath(); x.fill();
        x.fillStyle = '#bfe8f5'; x.fillRect(46, 30, 10, 70);
        x.fillStyle = '#4c9be8'; x.fillRect(38, 60, 44, 22);
        x.fillStyle = '#ffffff'; x.fillRect(42, 66, 36, 4); x.fillRect(42, 74, 24, 4);
        x.fillStyle = '#e8663d'; x.fillRect(48, 8, 24, 16);
        x.fillStyle = '#f2905f'; x.fillRect(48, 8, 24, 4);
      } else if (id === 'sac_plastique') {
        x.fillStyle = '#e8eef2';
        x.beginPath(); x.moveTo(24, 44); x.lineTo(96, 44); x.lineTo(88, 108);
        x.lineTo(32, 108); x.closePath(); x.fill();
        x.fillStyle = '#cfdbe2';
        x.beginPath(); x.moveTo(24, 44); x.lineTo(52, 44); x.lineTo(46, 108); x.lineTo(32, 108); x.closePath(); x.fill();
        x.strokeStyle = '#e8eef2'; x.lineWidth = 8;
        x.beginPath(); x.arc(42, 44, 14, Math.PI, 0); x.stroke();
        x.beginPath(); x.arc(78, 44, 14, Math.PI, 0); x.stroke();
        x.fillStyle = '#9fb8c4';
        for (let i = 0; i < 5; i++) x.fillRect(34 + i * 12, 60 + (i % 2) * 16, 3, 22);
      } else if (id === 'canette') {
        x.fillStyle = '#9aa6b5'; x.fillRect(38, 24, 44, 76);
        x.fillStyle = '#c4cfd8'; x.fillRect(44, 24, 12, 76);
        x.fillStyle = '#7b8794'; x.fillRect(38, 24, 44, 8); x.fillRect(38, 92, 44, 8);
        x.fillStyle = '#e8503a'; x.fillRect(38, 44, 44, 30);
        x.fillStyle = '#ffffff'; x.fillRect(46, 52, 28, 6); x.fillRect(46, 62, 18, 5);
        x.fillStyle = '#c4cfd8'; x.beginPath(); x.ellipse(60, 24, 22, 7, 0, 0, 7); x.fill();
        x.fillStyle = '#7b8794'; x.beginPath(); x.ellipse(60, 24, 12, 4, 0, 0, 7); x.fill();
      } else if (id === 'journal') {
        x.fillStyle = '#d8d3c4';
        x.beginPath(); x.moveTo(16, 34); x.lineTo(104, 30); x.lineTo(100, 96); x.lineTo(20, 100); x.closePath(); x.fill();
        x.fillStyle = '#efeade'; x.fillRect(22, 38, 74, 56);
        x.fillStyle = '#8a8577'; x.fillRect(28, 44, 62, 8);
        for (let i = 0; i < 6; i++) x.fillRect(28, 58 + i * 6, i % 2 ? 40 : 60, 3);
        x.fillStyle = '#b5b0a2'; x.fillRect(58, 30, 3, 68);
      } else if (id === 'bocal') {
        x.fillStyle = '#8fd4a0';
        x.beginPath(); x.moveTo(34, 40); x.lineTo(86, 40); x.lineTo(86, 100);
        x.quadraticCurveTo(60, 110, 34, 100); x.closePath(); x.fill();
        x.fillStyle = '#b8e8c4'; x.fillRect(40, 46, 12, 52);
        x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(66, 50, 8, 44);
        x.fillStyle = '#9aa6b5'; x.fillRect(30, 22, 60, 18);
        x.fillStyle = '#c4cfd8'; x.fillRect(30, 22, 60, 6);
        x.fillStyle = '#7b8794'; for (let i = 0; i < 6; i++) x.fillRect(34 + i * 10, 28, 4, 12);
      } else {
        /* vieille basket */
        x.fillStyle = '#4c6f8f';
        x.beginPath(); x.moveTo(18, 92); x.lineTo(24, 56); x.lineTo(52, 50);
        x.quadraticCurveTo(70, 62, 100, 74); x.lineTo(104, 92); x.closePath(); x.fill();
        x.fillStyle = '#5f88ad';
        x.beginPath(); x.moveTo(24, 70); x.lineTo(52, 56); x.quadraticCurveTo(72, 68, 96, 78);
        x.lineTo(96, 84); x.lineTo(24, 84); x.closePath(); x.fill();
        x.fillStyle = '#efece4'; x.fillRect(14, 88, 94, 14);
        x.fillStyle = '#cfc9bb'; x.fillRect(14, 98, 94, 5);
        x.fillStyle = '#efece4';
        for (let i = 0; i < 4; i++) {
          x.fillRect(30 + i * 12, 58 + i * 3, 20, 4);
        }
        x.fillStyle = '#2f3a4a'; x.beginPath(); x.arc(30, 60, 5, 0, 7); x.fill();
      }
    });
    return key;
  }

  binTexture(b) {
    const key = 'fi_bin_' + b.id;
    Art.make(this, key, 104, 124, (x, w, h) => {
      const col = this.hex(b.color);
      const dark = this.shade(b.color, -46);
      const light = this.shade(b.color, 34);
      /* corps */
      x.fillStyle = dark;
      x.beginPath(); x.moveTo(14, 34); x.lineTo(90, 34); x.lineTo(82, 120); x.lineTo(22, 120); x.closePath(); x.fill();
      x.fillStyle = col;
      x.beginPath(); x.moveTo(19, 38); x.lineTo(85, 38); x.lineTo(78, 116); x.lineTo(26, 116); x.closePath(); x.fill();
      x.fillStyle = light; x.fillRect(24, 40, 10, 74);
      x.fillStyle = dark;
      for (let i = 0; i < 3; i++) x.fillRect(24 + i * 22, 44, 3, 70);
      /* couvercle */
      x.fillStyle = dark; x.fillRect(6, 18, 92, 18);
      x.fillStyle = col; x.fillRect(6, 18, 92, 12);
      x.fillStyle = light; x.fillRect(6, 18, 92, 4);
      x.fillStyle = dark; x.fillRect(40, 8, 24, 12);
      x.fillStyle = light; x.fillRect(40, 8, 24, 4);
      /* fente */
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(30, 54, 44, 10);
    });
    return key;
  }

  /* ============================================================
     1. ARRIVÉE EN MER ET DIALOGUE D'INTRODUCTION
     ============================================================ */
  intro() {
    this.step = 'intro';
    this.setHint('ancre', 'Bienvenue à bord !', 'Écoute le Capitaine Marin.');
    this.say([
      "Salut moussaillon ! Bienvenue sur mon bateau.",
      "Aujourd'hui, on pêche en prenant soin de la mer : on ne garde que ce qu'il faut.",
      "Quatre prises, et on rentre au village. Prêt ?"
    ], () => this.stepCast());
  }

  /* ============================================================
     2. MINI-JEU — LANCER LA LIGNE
     ============================================================ */
  stepCast() {
    this.step = 'zone';
    this.clearPanel();
    this.updateHud();
    this.setHint('canne', 'Choisis ta zone de pêche.', 'Clique sur une des trois cartes.');

    const zones = [
      { id: 'surface', label: 'En surface', sub: "Tout en haut de l'eau" },
      { id: 'milieu', label: 'Entre deux eaux', sub: 'Au milieu, dans le bleu' },
      { id: 'fond', label: 'Près du fond', sub: 'Tout en bas, sur le sable' }
    ];

    zones.forEach((z, i) => {
      const x = 175 + i * 305;
      const y = 330;
      const card = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(0x0b2233, 0.45); g.fillRoundedRect(-118, -108, 236, 226, 18);
      g.fillStyle(0xf2ece0, 1); g.fillRoundedRect(-113, -113, 226, 222, 16);
      g.fillStyle(0x0b2233, 1); g.fillRoundedRect(-106, -106, 212, 142, 10);
      card.add(g);
      card.add(this.add.image(0, -35, 'fi_zone_' + z.id));
      card.add(this.label(0, 56, z.label, 24, '#123449'));
      card.add(this.label(0, 84, z.sub, 15, '#4a6272'));
      card.setSize(236, 226);
      card.setInteractive(new Phaser.Geom.Rectangle(-126, -121, 252, 242), Phaser.Geom.Rectangle.Contains);
      card.on('pointerover', () => { if (!this.busy) this.tweens.add({ targets: card, scale: 1.05, duration: 140, ease: 'Back.out' }); });
      card.on('pointerout', () => this.tweens.add({ targets: card, scale: 1, duration: 140 }));
      card.on('pointerdown', () => {
        if (this.busy || this.step !== 'zone') return;
        this.chosenZone = z.id;
        this.tweens.add({
          targets: card, scale: 0.9, duration: 90, yoyo: true,
          onComplete: () => this.castGauge()
        });
      });
      /* petite entrée en cascade */
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, duration: 340, delay: i * 90, ease: 'Back.out' });
      this.panel.add(card);
    });
  }

  /* la jauge : lente et généreuse, on peut rater sans rien perdre */
  castGauge() {
    this.clearPanel();
    this.setHint('canne', 'Appuie sur ESPACE (ou clique)', 'quand la flèche est dans le vert !');

    const bx = 190, by = 386, bw = 580, bh = 52;
    const gw = 176;
    const gx = bx + 34 + Math.random() * (bw - 68 - gw);
    this.cast = { x: bx, y: by, w: bw, h: bh, gx: gx, gw: gw, pos: bx + 6, dir: 1, spd: 300, tries: 0 };

    const g = this.add.graphics();
    g.fillStyle(0x0b2233, 0.8); g.fillRoundedRect(bx - 20, by - 24, bw + 40, bh + 48, 18);
    g.fillStyle(0xd9e8f0, 1); g.fillRoundedRect(bx, by, bw, bh, 10);
    g.fillStyle(0xa8c4d4, 1); g.fillRoundedRect(bx, by, bw, 10, 10);
    g.fillStyle(0x5fbf7a, 1); g.fillRect(gx, by, gw, bh);
    g.fillStyle(0x8fe0a4, 1); g.fillRect(gx, by, gw, 12);
    g.fillStyle(0x3f8f58, 1); g.fillRect(gx, by + bh - 8, gw, 8);
    g.lineStyle(4, 0x123449, 1); g.strokeRoundedRect(bx, by, bw, bh, 10);
    this.panel.add(g);
    this.panel.add(this.label(bx + bw / 2, by - 44, 'Vise le vert !', 26, '#ffffff'));

    this.castCursor = this.add.image(this.cast.pos, by + bh / 2 - 4, 'fi_cursor');
    this.panel.add(this.castCursor);

    this.armed = false;
    this.step = 'castgauge';
  }

  updateCast(dt, down, justDown) {
    const c = this.cast;
    c.pos += c.dir * c.spd * dt;
    if (c.pos > c.x + c.w - 6) { c.pos = c.x + c.w - 6; c.dir = -1; }
    if (c.pos < c.x + 6) { c.pos = c.x + 6; c.dir = 1; }
    this.castCursor.x = c.pos;
    /* on attend que le joueur relâche avant d'écouter (évite les clics hérités) */
    if (!down) this.armed = true;
    if (justDown && this.armed) { this.armed = false; this.castTry(); }
  }

  castTry() {
    const c = this.cast;
    const ok = c.pos >= c.gx && c.pos <= c.gx + c.gw;
    if (ok) {
      this.step = 'wait';
      this.stars(c.pos, c.y + c.h / 2);
      this.cameras.main.shake(140, 0.004);
      this.toast('Joli lancer !');
      this.time.delayedCall(650, () => this.stepReel());
    } else {
      c.tries++;
      /* on ralentit un peu à chaque essai : ça devient de plus en plus facile */
      c.spd = Math.max(170, c.spd - 40);
      this.toast(this.pick([
        'Presque ! On relance la ligne.',
        'Pas grave, essaie encore !',
        'Tout près ! Encore un petit coup.'
      ]));
      this.tweens.add({ targets: this.castCursor, scale: { from: 1.35, to: 1 }, duration: 260, ease: 'Back.out' });
    }
  }

  /* ============================================================
     3. MINI-JEU — REMONTER LA PRISE
     ============================================================ */
  stepReel() {
    this.clearPanel();
    this.chooseCatch();
    this.setHint('poisson', 'Ça mord ! Maintiens ESPACE (ou la souris)', 'pour garder la zone bleue sur la prise.');

    const bx = 812, by = 132, bw = 62, bh = 366;
    this.reel = {
      x: bx, y: by, w: bw, h: bh,
      zh: 112, zone: by + bh * 0.6, vel: 0,
      fish: by + bh * 0.4, target: by + bh * 0.4, timer: 0.6,
      prog: 0
    };

    const back = this.add.graphics();
    back.fillStyle(0x0b2233, 0.82); back.fillRoundedRect(bx - 24, by - 26, bw + 92, bh + 52, 20);
    back.fillStyle(0x1c6a9c, 1); back.fillRoundedRect(bx, by, bw, bh, 12);
    back.fillStyle(0x2f8cbe, 0.9); back.fillRoundedRect(bx + 5, by + 5, bw - 10, bh - 10, 10);
    for (let i = 1; i < 8; i++) {
      back.fillStyle(0x57bde0, 0.35);
      back.fillRect(bx + 8, by + (bh / 8) * i, bw - 16, 2);
    }
    /* rail de la barre de progression */
    back.fillStyle(0x123449, 1); back.fillRoundedRect(bx + bw + 14, by, 30, bh, 10);
    this.panel.add(back);
    this.panel.add(this.label(bx + 30, by - 44, 'Remonte !', 24, '#ffffff'));

    this.reelZoneG = this.add.graphics();
    this.reelProgG = this.add.graphics();
    this.reelFish = this.add.image(bx + bw / 2, this.reel.fish, 'fi_ico_poisson').setScale(1.5);
    this.panel.add([this.reelZoneG, this.reelFish, this.reelProgG]);

    this._wasDown = true;   /* on ignore le clic qui vient de finir le lancer */
    this.step = 'reel';
  }

  updateReel(dt, hold) {
    const r = this.reel;
    /* la zone monte quand on maintient, redescend quand on lâche */
    r.vel += (hold ? -700 : 560) * dt;
    r.vel *= 0.93;
    r.zone += r.vel * dt;
    const top = r.y + r.zh / 2, bot = r.y + r.h - r.zh / 2;
    if (r.zone < top) { r.zone = top; r.vel = Math.max(0, r.vel); }
    if (r.zone > bot) { r.zone = bot; r.vel = Math.min(0, r.vel); }

    /* la prise choisit une nouvelle hauteur de temps en temps */
    r.timer -= dt;
    if (r.timer <= 0) {
      r.timer = 0.8 + Math.random() * 1.3;
      r.target = r.y + 30 + Math.random() * (r.h - 60);
    }
    r.fish += (r.target - r.fish) * Math.min(1, dt * 1.7);

    const inside = Math.abs(r.fish - r.zone) < r.zh / 2;
    /* on avance vite quand c'est bon, on redescend très lentement sinon */
    r.prog = Phaser.Math.Clamp(r.prog + (inside ? dt * 0.34 : -dt * 0.03), 0, 1);

    /* dessin */
    this.reelZoneG.clear();
    this.reelZoneG.fillStyle(inside ? 0x8fe0a4 : 0xbfe3f5, 0.45);
    this.reelZoneG.fillRoundedRect(r.x + 4, r.zone - r.zh / 2, r.w - 8, r.zh, 10);
    this.reelZoneG.lineStyle(4, inside ? 0x5fbf7a : 0xffffff, 0.95);
    this.reelZoneG.strokeRoundedRect(r.x + 4, r.zone - r.zh / 2, r.w - 8, r.zh, 10);

    this.reelFish.y = r.fish;
    this.reelFish.setScale(inside ? 1.7 : 1.5);

    this.reelProgG.clear();
    const px = r.x + r.w + 14, ph = r.h * r.prog;
    this.reelProgG.fillStyle(0xf5c542, 1);
    this.reelProgG.fillRoundedRect(px + 3, r.y + r.h - ph + 3, 24, Math.max(0, ph - 6), 8);
    this.reelProgG.fillStyle(0xffe9a8, 1);
    this.reelProgG.fillRect(px + 6, r.y + r.h - ph + 6, 6, Math.max(0, ph - 14));

    if (r.prog >= 1) this.reelDone();
  }

  reelDone() {
    this.step = 'wait';
    this.cameras.main.shake(220, 0.007);
    this.splash(560, 430);
    this.stars(this.reel.x + this.reel.w / 2, this.reel.y);
    this.toast('Ça remonte !');
    this.time.delayedCall(750, () => {
      if (this.current.kind === 'trash') this.stepTrash();
      else this.stepIdentify();
    });
  }

  /* ============================================================
     CHOIX DE LA PRISE (toujours à partir de GameData)
     ============================================================ */
  chooseCatch() {
    if (this.plan[this.catchIndex] === 'trash') {
      let list = GameData.trash.filter((t) => this.usedTrash.indexOf(t.id) < 0);
      if (!list.length) list = GameData.trash;
      const t = this.pick(list);
      this.usedTrash.push(t.id);
      this.current = { kind: 'trash', trash: t };
      return;
    }

    let list = GameData.fish.filter((f) => f.habitat === this.chosenZone && this.caughtIds.indexOf(f.id) < 0);
    if (!list.length) list = GameData.fish.filter((f) => this.caughtIds.indexOf(f.id) < 0);
    if (!list.length) list = GameData.fish.slice();

    /* pour la dernière prise, on montre une espèce fragile si le joueur n'en a pas encore vu */
    const last = (this.catchIndex === this.plan.length - 1);
    if (last && !this.protectedSeen) {
      const prot = list.filter((f) => f.protected);
      if (prot.length) list = prot;
    }

    const f = this.pick(list);
    this.caughtIds.push(f.id);
    if (f.protected) this.protectedSeen = true;

    /* la première prise est petite, la deuxième est belle : on voit les deux cas */
    let want = 'libre';
    if (this.catchIndex === 0) want = 'petit';
    else if (this.catchIndex === 1) want = 'grand';
    this.current = { kind: 'fish', fish: f, size: this.pickSize(f, want) };
  }

  pickSize(f, want) {
    const lo = f.sizeRange[0], hi = f.sizeRange[1], min = f.minSize;
    if (want === 'petit' && lo < min) return Phaser.Math.Between(lo, Math.max(lo, min - 1));
    if (want === 'grand' && hi > min) return Phaser.Math.Between(Math.min(hi, min + 1), hi);
    return Phaser.Math.Between(lo, hi);
  }

  /* ============================================================
     4. MINI-JEU — IDENTIFIER LE POISSON
     ============================================================ */
  stepIdentify() {
    this.step = 'identify';
    this.clearPanel();
    this.scrim(0.4);
    const f = this.current.fish;
    this.setHint('loupe', 'Quel est ce poisson ?', 'Choisis son nom, sans crainte de te tromper.');

    const img = this.add.image(this.W / 2, 250, this.fishTexture(f)).setScale(0);
    this.panel.add(img);
    this.tweens.add({ targets: img, scale: 1, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: img, y: 258, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 420 });
    this.identFish = img;

    const others = Phaser.Utils.Array.Shuffle(
      GameData.fish.filter((o) => o.id !== f.id)
    ).slice(0, 2);
    const options = Phaser.Utils.Array.Shuffle([f].concat(others));

    this.identButtons = [];
    options.forEach((o, i) => {
      const b = this.button(175 + i * 305, 452, 268, 70, o.name, 0x3f8fd4, () => this.tryIdentify(o));
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 300, delay: 260 + i * 80, ease: 'Back.out' });
      this.identButtons.push(b);
      this.panel.add(b);
    });
  }

  tryIdentify(o) {
    if (this.step !== 'identify') return;
    const f = this.current.fish;
    if (o.id === f.id) {
      this.step = 'wait';
      this.stars(this.W / 2, 250);
      this.cameras.main.shake(150, 0.005);
      this.toast('Bravo, c’est bien ' + f.name + ' !');
      this.time.delayedCall(650, () => {
        this.say(['Bien vu, matelot : c’est ' + f.name + ' !', f.fact], () => this.stepDecide());
      });
    } else {
      this.say([
        'Pas tout à fait, mais tu observes bien !',
        this.hintFor(f),
        'Regarde encore et réessaie.'
      ]);
    }
  }

  /* indice construit à partir des données de l'espèce */
  hintFor(f) {
    const formes = {
      fusiforme: 'un corps allongé comme une torpille',
      plat: 'un corps tout plat, posé sur le sable',
      rond: 'un corps rond et haut',
      long: 'un corps très long, comme un ruban',
      etoile: "la forme d'une étoile"
    };
    const lieux = {
      surface: "tout près de la surface",
      milieu: 'entre deux eaux',
      fond: 'tout au fond, près du sable'
    };
    return 'Indice : il a ' + (formes[f.shape] || 'une drôle de forme') +
      ' et il vit ' + (lieux[f.habitat] || 'dans la mer') + '.';
  }

  /* ============================================================
     5. MINI-JEU — MESURER ET DÉCIDER
     ============================================================ */
  stepDecide() {
    this.step = 'decide';
    this.clearPanel();
    this.scrim(0.42);
    const f = this.current.fish;
    const size = this.current.size;
    this.setHint('regle', 'Mesure la prise, puis décide :', 'on la relâche, ou on la garde ?');

    const img = this.add.image(this.W / 2, 210, this.fishTexture(f)).setScale(0.82);
    this.panel.add(img);
    this.tweens.add({ targets: img, y: 218, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.decideFish = img;

    this.drawRuler(f, size);

    this.panel.add(this.button(178, 520, 250, 74, 'Relâcher', 0x3f8fd4,
      () => this.decide('relacher'), "on la remet à l'eau"));
    this.panel.add(this.button(480, 520, 250, 74, 'Garder', 0x5fbf7a,
      () => this.decide('garder'), 'elle va dans la caisse'));
    this.panel.add(this.button(782, 520, 250, 74, 'Demander conseil', 0xf2b333,
      () => this.decide('conseil'), 'le capitaine explique'));
  }

  /* la règle graduée, avec la taille de la prise */
  drawRuler(f, size) {
    const x0 = 170, x1 = 790, y = 396;
    const maxCm = Math.max(f.sizeRange[1], f.minSize + 6);
    const k = (x1 - x0) / maxCm;
    const g = this.add.graphics();
    g.fillStyle(0x0b2233, 0.5); g.fillRoundedRect(x0 - 14, y - 10, x1 - x0 + 28, 74, 12);
    g.fillStyle(0xf5c542, 1); g.fillRoundedRect(x0, y, x1 - x0, 54, 8);
    g.fillStyle(0xe0a63c, 1); g.fillRect(x0, y + 40, x1 - x0, 14);
    this.panel.add(g);

    const ticks = this.add.graphics();
    ticks.fillStyle(0x6b4526, 1);
    for (let cm = 0; cm <= maxCm; cm++) {
      const px = x0 + cm * k;
      if (cm % 10 === 0) ticks.fillRect(px, y, 3, 26);
      else if (cm % 5 === 0) ticks.fillRect(px, y, 2, 18);
      else if (k > 5) ticks.fillRect(px, y, 1, 10);
    }
    this.panel.add(ticks);
    for (let cm = 0; cm <= maxCm; cm += 10) {
      this.panel.add(this.label(x0 + cm * k + 12, y + 36, String(cm), 14, '#6b4526'));
    }

    /* repère de la règle du jeu (taille minimale) */
    const mx = x0 + f.minSize * k;
    const mg = this.add.graphics();
    mg.fillStyle(0x3f8f58, 1);
    for (let yy = y - 8; yy < y + 58; yy += 10) mg.fillRect(mx - 2, yy, 4, 6);
    this.panel.add(mg);
    this.panel.add(this.label(mx, y + 70, 'règle du jeu : ' + f.minSize + ' cm', 15, '#8fe0a4'));

    /* repère de la prise */
    const px = x0 + size * k;
    const pg = this.add.graphics();
    pg.fillStyle(0xe8503a, 1);
    pg.fillRect(px - 3, y - 22, 6, 78);
    pg.fillTriangle(px - 14, y - 34, px + 14, y - 34, px, y - 16);
    this.panel.add(pg);
    const tag = this.label(px, y - 48, size + ' cm', 24, '#ffffff');
    this.panel.add(tag);
    this.tweens.add({ targets: tag, scale: { from: 1.4, to: 1 }, duration: 380, ease: 'Back.out' });
  }

  decide(choice) {
    if (this.step !== 'decide') return;
    const f = this.current.fish;
    const size = this.current.size;
    const mustRelease = f.protected || size < f.minSize;

    if (choice === 'conseil') {
      const lines = ['Regarde bien, moussaillon.'];
      if (f.protected) {
        lines.push(f.name + ' est une espèce fragile. Dans notre jeu, on la remet toujours à l’eau.');
      } else if (size < f.minSize) {
        lines.push('Dans notre jeu, on garde ' + f.name + ' à partir de ' + f.minSize +
          ' cm. Ta prise fait ' + size + ' cm : elle est encore petite.');
      } else {
        lines.push('Dans notre jeu, on garde ' + f.name + ' à partir de ' + f.minSize +
          ' cm. Ta prise fait ' + size + ' cm : elle a bien grandi.');
      }
      lines.push('À toi de choisir maintenant.');
      this.say(lines);
      return;
    }

    if (mustRelease && choice === 'garder') {
      this.say([
        'Attends une seconde, matelot…',
        f.why,
        'Essaie encore : que fait-on de cette prise ?'
      ]);
      return;
    }

    /* décision acceptée */
    this.step = 'wait';
    const good = [];
    if (choice === 'relacher') {
      this.releasedCount++;
      good.push('Parfait, tu la remets à l’eau. Elle repart nager !');
      good.push(f.why);
    } else {
      this.keptCount++;
      good.push('D’accord, celle-là on peut la garder.');
      good.push(f.why);
    }
    good.push(f.fact);

    this.stars(this.W / 2, 220);
    this.cameras.main.shake(160, 0.005);
    this.toast(choice === 'relacher' ? 'Belle décision !' : 'Bonne prise !');

    /* animation : le poisson replonge ou rejoint la caisse */
    if (this.decideFish) {
      this.tweens.killTweensOf(this.decideFish);
      if (choice === 'relacher') {
        this.tweens.add({
          targets: this.decideFish, y: 640, angle: 25, scale: 0.5, duration: 700, ease: 'Quad.in',
          onComplete: () => this.splash(this.W / 2, 470)
        });
      } else {
        this.tweens.add({ targets: this.decideFish, x: 178, y: 500, scale: 0.28, angle: -20, duration: 700, ease: 'Quad.in' });
      }
    }

    this.time.delayedCall(820, () => this.say(good, () => this.nextCatch()));
  }

  /* ============================================================
     6. MINI-JEU — TRIER LE DÉCHET
     ============================================================ */
  stepTrash() {
    this.step = 'trash';
    this.clearPanel();
    this.scrim(0.45);
    const t = this.current.trash;
    this.trashCount++;
    this.setHint('poubelle', 'Ce n’est pas un poisson…', 'Mets ce déchet dans la bonne poubelle !');

    const img = this.add.image(this.W / 2, 190, this.trashTexture(t)).setScale(0);
    this.panel.add(img);
    this.tweens.add({ targets: img, scale: 1.5, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: img, angle: { from: -5, to: 5 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 420 });
    this.trashImg = img;
    this.panel.add(this.label(this.W / 2, 292, t.name, 26, '#ffffff'));

    GameData.bins.forEach((b, i) => {
      const x = 128 + i * 176;
      const c = this.add.container(x, 430);
      c.add(this.add.image(0, 0, this.binTexture(b)));
      c.add(this.label(0, 86, b.label, 22, '#ffffff'));
      c.setSize(110, 200);
      c.setInteractive(new Phaser.Geom.Rectangle(-63, -78, 126, 206), Phaser.Geom.Rectangle.Contains);
      c.on('pointerover', () => { if (!this.busy) this.tweens.add({ targets: c, scale: 1.08, y: 422, duration: 130, ease: 'Back.out' }); });
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, y: 430, duration: 130 }));
      c.on('pointerdown', () => {
        if (this.busy || this.step !== 'trash') return;
        this.tweens.add({ targets: c, scale: 0.9, duration: 90, yoyo: true, onComplete: () => this.tryBin(b, c) });
      });
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 300, delay: 200 + i * 70, ease: 'Back.out' });
      this.panel.add(c);
    });
  }

  tryBin(bin, container) {
    const t = this.current.trash;
    if (bin.id === t.bin) {
      this.step = 'wait';
      this.stars(container.x, container.y - 40);
      this.cameras.main.shake(150, 0.005);
      this.toast('Bien trié !');
      if (this.trashImg) {
        this.tweens.killTweensOf(this.trashImg);
        this.tweens.add({
          targets: this.trashImg, x: container.x, y: container.y - 30,
          scale: 0.4, angle: 180, duration: 520, ease: 'Quad.in'
        });
      }
      this.time.delayedCall(680, () => {
        this.say([
          'Bien joué ! ' + t.name + ' va dans la poubelle « ' + bin.label + ' ».',
          t.fact,
          'Ramasser un déchet en mer, c’est déjà protéger les animaux.'
        ], () => this.nextCatch());
      });
    } else {
      this.say([
        'Presque ! Regarde bien la matière.',
        this.binHint(t),
        'Réessaie, tu vas trouver.'
      ]);
    }
  }

  binHint(t) {
    const matieres = {
      plastique: 'Cet objet est surtout fait de plastique.',
      metal: 'Cet objet est fait de métal : il est dur et il brille.',
      papier: 'Cet objet est fait de papier.',
      verre: 'Cet objet est fait de verre : il est transparent et lourd.',
      dechet: 'Cet objet mélange plusieurs matières collées ensemble : on ne peut pas les séparer.'
    };
    return matieres[t.bin] || 'Regarde bien de quoi cet objet est fait.';
  }

  /* ============================================================
     ENCHAÎNEMENT DES PRISES
     ============================================================ */
  nextCatch() {
    this.catchIndex++;
    this.clearPanel();
    if (this.catchIndex >= this.plan.length) { this.finish(); return; }
    this.updateHud();
    this.step = 'wait';
    this.toast('Prise ' + (this.catchIndex + 1) + ' sur ' + this.plan.length + ' !');
    this.time.delayedCall(600, () => this.stepCast());
  }

  /* ============================================================
     7. BILAN ET RÉCOMPENSES
     ============================================================ */
  finish() {
    this.step = 'done';
    this.clearPanel();
    this.setHint('coche', 'Mission terminée !', 'Bravo, matelot.');

    const rel = this.releasedCount;
    const bilan = [
      'Quelle belle sortie en mer, moussaillon !',
      'Tu as remis ' + rel + (rel > 1 ? ' prises' : ' prise') + ' à l’eau, et tu as sorti ' +
        this.trashCount + (this.trashCount > 1 ? ' déchets' : ' déchet') + ' de la mer.',
      'Si on pêche trop, il ne reste plus assez de poissons pour faire des petits : on appelle ça la surpêche.',
      'C’est pour ça que, dans notre jeu, on relâche les plus petits et les espèces fragiles.',
      'Et un déchet ramassé, c’est un animal de moins en danger. Merci, matelot !'
    ];

    this.say(bilan, () => this.giveRewards());
  }

  giveRewards() {
    const total = 45;
    const fiches = ['ency_ocean_1', 'ency_animaux_1', 'ency_env_1'];

    if (typeof State !== 'undefined' && State.get && State.get()) {
      State.addPoints(total);
      fiches.forEach((id) => State.discover(id));
      State.addBadge('ocean');
      State.completeQuest('peche');
      /* l'ancre décorative rejoint l'inventaire du terrain */
      const inv = State.get().inventory;
      inv.ancre = (inv.ancre || 0) + 1;
      State.log('Sortie en mer terminée : ' + total + ' piécettes', 'quest');
      State.save();
    }

    const back = () => {
      if (typeof UI !== 'undefined' && UI.hideAll) UI.hideAll();
      this.scene.start('Village', { from: 'peche' });
    };

    if (typeof UI !== 'undefined' && UI.rewardPanel) {
      UI.rewardPanel({
        points: total,
        badge: 'ocean',
        ency: fiches,
        item: 'ancre',
        title: 'Mission terminée !'
      }, back);
    } else {
      back();
    }
  }
};
