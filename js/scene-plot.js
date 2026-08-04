/* ============================================================
   SCENE-PLOT.JS — le terrain du joueur, en tuiles Kenney.
   On y pose, déplace et retire les objets achetés avec les
   piécettes. Tout est sauvegardé automatiquement.
   ============================================================ */

const ScenePlot = class extends Phaser.Scene {

  constructor() { super('Plot'); }

  create() {
    const T = Tileset.SIZE;
    this.T = T;
    this.GW = 18; this.GH = 12;        /* taille de la grille cultivable */
    this.ox = 6; this.oy = 7;          /* position de la grille dans le monde */
    this.selected = null;
    this.placed = [];

    UI.showHud(true);
    UI.setQuest('');

    const K = Tileset.T;
    const COLS = this.ox + this.GW + 6, ROWS = this.oy + this.GH + 5;
    this.cameras.main.setBounds(0, 0, COLS * T, ROWS * T);
    this.ZOOM = 1;
    this.cameras.main.setZoom(this.ZOOM);
    this.cameras.main.roundPixels = true;

    /* ---------- le sol ---------- */
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = (c * 7 + r * 5) % 11;
        const f = v === 0 ? K.HERBE_FLEURS : (v < 3 ? K.HERBE_BRINS : K.HERBE);
        this.add.image(c * T, r * T, Tileset.TOWN, f).setOrigin(0).setDepth(-1000);
      }
    }

    /* allée de terre devant la maison */
    for (let r = this.oy - 2; r < ROWS - 1; r++) {
      for (let c = 2; c < 5; c++) {
        this.add.image(c * T, r * T, Tileset.TOWN,
          Tileset.one(K.TERRE, c + r)).setOrigin(0).setDepth(-999);
      }
    }

    /* ---------- la maison, assemblée tuile par tuile ---------- */
    const mur = K.MUR_BOIS, toitH = K.TOIT_ROUGE, toitB = K.TOIT_ROUGE_BAS;
    const hc = 2, hr = 1, hw = 4;
    for (let i = 0; i < hw; i++) {
      const bord = i === 0 ? 0 : (i === hw - 1 ? 2 : 1);
      this.add.image((hc + i) * T, hr * T, Tileset.TOWN, toitH[bord]).setOrigin(0).setDepth(hr * T);
      this.add.image((hc + i) * T, (hr + 1) * T, Tileset.TOWN, toitB[bord]).setOrigin(0).setDepth(hr * T);
      this.add.image((hc + i) * T, (hr + 2) * T, Tileset.TOWN,
        i === 1 ? K.MUR_FENETRE_ROUGE : mur[bord]).setOrigin(0).setDepth(hr * T);
      this.add.image((hc + i) * T, (hr + 3) * T, Tileset.TOWN,
        i === 2 ? K.PORTE_BOIS : mur[bord]).setOrigin(0).setDepth(hr * T);
    }
    this.add.image((hc + 2) * T, (hr + 1) * T, Tileset.TOWN, K.TOIT_ROUGE_POINTE)
      .setOrigin(0).setDepth(hr * T);

    /* ---------- clôture autour du terrain ---------- */
    for (let c = this.ox - 1; c <= this.ox + this.GW; c++) {
      this.add.image(c * T, (this.oy - 1) * T, Tileset.TOWN,
        Tileset.one(K.CLOTURE_H, c)).setOrigin(0).setDepth((this.oy - 1) * T);
      this.add.image(c * T, (this.oy + this.GH) * T, Tileset.TOWN,
        Tileset.one(K.CLOTURE_H, c)).setOrigin(0).setDepth(9e5);
    }
    for (let r = this.oy; r < this.oy + this.GH; r++) {
      this.add.image((this.ox - 1) * T, r * T, Tileset.TOWN,
        Tileset.one(K.CLOTURE_V, r)).setOrigin(0).setDepth(r * T);
      this.add.image((this.ox + this.GW) * T, r * T, Tileset.TOWN,
        Tileset.one(K.CLOTURE_V, r)).setOrigin(0).setDepth(r * T);
    }

    /* ---------- la grille de pose ---------- */
    this.cells = [];
    for (let r = 0; r < this.GH; r++) {
      for (let c = 0; c < this.GW; c++) {
        const cell = this.add.rectangle((this.ox + c) * T, (this.oy + r) * T, T, T, 0xffffff, 0)
          .setOrigin(0).setStrokeStyle(1, 0xffffff, 0.12).setDepth(-50)
          .setInteractive({ useHandCursor: true });
        cell.gx = c; cell.gy = r;
        cell.on('pointerover', () => this.hover(cell));
        cell.on('pointerdown', () => this.clickCell(cell));
        this.cells.push(cell);
      }
    }
    this.ghost = this.add.rectangle(0, 0, T, T, 0x5fbf46, 0.4).setOrigin(0)
      .setDepth(9e5 + 1).setVisible(false);

    this.drawPlaced();
    this.buildBar();

    /* ---------- bandeau du haut ---------- */
    const W = this.scale.width;
    this.titre = this.add.text(0, 0, '🎨 Ton terrain — choisis un objet, puis clique sur une case', {
      fontFamily: 'Verdana', fontSize: '15px', color: '#2f2838',
      backgroundColor: '#ffffffdd', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(9e6).setScale(1 / this.ZOOM);

    this.btnRetour = this.mkButton(0, 0, '← Retour au village', 0x3d7fd8, () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.start('Village'));
    });
    this.btnBoutique = this.mkButton(0, 0, '🛍️ Boutique', 0x5fbf46, () => UI.openDecorShop());

    this.input.keyboard.on('keydown-ESC', () => { this.selected = null; this.buildBar(); });
    this.cameras.main.centerOn((this.ox + this.GW / 2) * T, (this.oy + this.GH / 2) * T);
    this.cameras.main.fadeIn(300);
  }

  mkButton(x, y, label, color, fn) {
    const g = this.add.container(x, y).setDepth(9e6).setScale(1 / this.ZOOM);
    const t = this.add.text(0, 0, label, {
      fontFamily: 'Verdana', fontSize: '13px', color: '#fff8ee', fontStyle: 'bold'
    }).setOrigin(0.5);
    const r = this.add.rectangle(0, 0, t.width + 26, 34, color).setStrokeStyle(3, 0x2f2838);
    g.add([r, t]);
    r.setInteractive({ useHandCursor: true })
      .on('pointerover', () => g.setScale(1.05))
      .on('pointerout', () => g.setScale(1))
      .on('pointerdown', fn);
    return g;
  }

  itemDef(id) { return GameData.decorItems.filter(d => d.id === id)[0]; }
  tuile(id) { return Tileset.DECOR[id]; }

  /* ---------- objets posés ---------- */
  drawPlaced() {
    this.placed.forEach(o => o.destroy());
    this.placed = [];
    const T = this.T;
    State.get().plot.forEach((p, index) => {
      const def = this.itemDef(p.itemId), tui = this.tuile(p.itemId);
      if (!def || !tui) return;
      const x = (this.ox + p.gx) * T, y = (this.oy + p.gy) * T;
      const grp = this.add.container(x, y).setDepth(y + T);
      tui.cases.forEach((frame, i) => {
        const im = this.add.image(0, (i - (tui.cases.length - 1)) * T, tui.feuille, frame).setOrigin(0);
        grp.add(im);
      });
      grp.setSize(T, T);
      grp.setInteractive(new Phaser.Geom.Rectangle(0, 0, T, T), Phaser.Geom.Rectangle.Contains);
      grp.on('pointerdown', (pointer, lx, ly, ev) => {
        if (ev) ev.stopPropagation();
        State.removeItem(index);
        UI.toast(def.name + ' repris dans ton sac 🎒');
        this.drawPlaced(); this.buildBar();
      });
      this.placed.push(grp);
    });
  }

  free(gx, gy, w, h) {
    if (gx < 0 || gy < 0 || gx + w > this.GW || gy + h > this.GH) return false;
    return !State.get().plot.some(p => {
      const d = this.itemDef(p.itemId);
      return d && gx < p.gx + d.w && gx + w > p.gx && gy < p.gy + 1 && gy + h > p.gy;
    });
  }

  hover(cell) {
    if (!this.selected) { this.ghost.setVisible(false); return; }
    const def = this.itemDef(this.selected);
    const ok = this.free(cell.gx, cell.gy, def.w, 1);
    this.ghost.setVisible(true)
      .setPosition((this.ox + cell.gx) * this.T, (this.oy + cell.gy) * this.T)
      .setFillStyle(ok ? 0x5fbf46 : 0xd23f30, 0.4);
  }

  clickCell(cell) {
    if (!this.selected) { UI.toast('Choisis d\'abord un objet en bas 👇'); return; }
    const def = this.itemDef(this.selected);
    if (!this.free(cell.gx, cell.gy, def.w, 1)) { UI.toast('Il y a déjà quelque chose ici.'); return; }
    if (State.placeItem(this.selected, cell.gx, cell.gy)) {
      UI.toast(def.name + ' posé ! ✨', 'good');
      this.cameras.main.shake(70, 0.002);
      if (!State.get().inventory[this.selected]) this.selected = null;
      this.drawPlaced(); this.buildBar();
    }
  }

  /* ---------- barre d'inventaire ---------- */
  buildBar() {
    if (this.bar) this.bar.destroy();
    const W = this.scale.width, H = this.scale.height;
    this.bar = this.add.container(0, 0).setDepth(9e6).setScale(1 / this.ZOOM);
    this.bar.add(this.add.rectangle(0, 0, W - 40, 84, 0x2f2838, 0.92)
      .setStrokeStyle(3, 0xf5c542));

    const inv = State.get().inventory;
    const keys = Object.keys(inv).filter(k => this.tuile(k));
    if (!keys.length) {
      this.bar.add(this.add.text(0, 0,
        'Ton sac est vide — gagne des piécettes en mission, puis va à la boutique !', {
          fontFamily: 'Verdana', fontSize: '13px', color: '#fff8ee'
        }).setOrigin(0.5));
      return;
    }
    const startX = -(keys.length * 70) / 2 + 35;
    keys.forEach((k, i) => {
      const def = this.itemDef(k), tui = this.tuile(k);
      if (!def) return;
      const x = startX + i * 70, y = 0;
      const on = this.selected === k;
      const box = this.add.rectangle(x, y, 62, 66, on ? 0x5fbf46 : 0x4a4458)
        .setStrokeStyle(3, on ? 0xffffff : 0x8a839c)
        .setInteractive({ useHandCursor: true });
      this.bar.add(box);
      /* aperçu de la vraie tuile */
      tui.cases.forEach((frame, j) => {
        const im = this.add.image(x, y - 8 + (j - (tui.cases.length - 1)) * 16, tui.feuille, frame)
          .setScale(2.2);
        this.bar.add(im);
      });
      this.bar.add(this.add.text(x, y + 22, '× ' + inv[k], {
        fontFamily: 'Verdana', fontSize: '11px', color: '#fff8ee'
      }).setOrigin(0.5));
      box.on('pointerdown', () => {
        this.selected = (this.selected === k) ? null : k;
        this.buildBar();
        UI.toast(this.selected ? 'Clique sur une case pour poser « ' + def.name + ' »' : 'Objet reposé.');
      });
      box.on('pointerover', () => box.setScale(1.06));
      box.on('pointerout', () => box.setScale(1));
    });
  }

  /* l'interface suit la caméra, à taille réelle malgré le zoom */
  update() {
    const v = this.cameras.main.worldView;
    if (this.titre) this.titre.setPosition(v.centerX, v.y + 34);
    if (this.btnRetour) this.btnRetour.setPosition(v.x + 52, v.y + 34);
    if (this.btnBoutique) this.btnBoutique.setPosition(v.right - 44, v.y + 34);
    if (this.bar) this.bar.setPosition(v.centerX, v.bottom - 18);
  }

  shutdown() { UI.hideAll(); }
};
