/* ============================================================
   SCENE-VILLAGE.JS — le Village des Explorateurs.
   Monde central : on s'y promène, on parle aux habitants,
   on entre dans les bâtiments et on part en mission.
   ============================================================ */

const SceneVillage = class extends Phaser.Scene {

  constructor() { super('Village'); }

  init(data) { this.arrival = (data && data.from) || null; }

  create() {
    const T = Tileset.SIZE;              /* 16 px par case, comme les tuiles Kenney */
    this.T = T;
    /* Zoom de la caméra. 2 = vue large (on voit 30 cases sur 19),
       3 = vue rapprochée. Tous les textes du monde s'y adaptent
       automatiquement grâce à ECHELLE_TEXTE. */
    /* Zoom réglable à la molette, conservé d'une partie à l'autre.
       1 = tout le village d'un coup, 2,5 = au plus près des personnages. */
    const reglages = State.get().settings || {};
    this.ZOOM = reglages.zoom || 1;   /* vue la plus large par défaut */
    this.ECHELLE_TEXTE = 1 / this.ZOOM;
    this.textesMonde = [];
    /* Un personnage LPC mesure ~30 px, les nôtres ~22 : l'étiquette se
       place juste au-dessus du crâne dans les deux cas. */
    this.HAUTEUR_ETIQUETTE =
      (typeof LPC !== 'undefined' && LPC.disponible()) ? 36 : 27;
    this.COLS = 66; this.ROWS = 46;
    /* emprises des bâtiments : on n'y sème pas d'arbres */
    this.zonesBaties = [[8,16,6,6],[23,6,5,6],[47,27,5,6],[49,14,6,6],
                        [24,34,5,6],[37,6,6,6],[5,6,5,6],[55,20,6,6]];
    this.W = this.COLS * T; this.H = this.ROWS * T;

    /* IMPORTANT : sans cette ligne, le joueur reste enfermé dans les
       limites par défaut (la taille de la fenêtre) et ne peut pas
       descendre jusqu'au port. */
    this.physics.world.setBounds(0, 0, this.W, this.H);

    this.solids = this.physics.add.staticGroup();
    this.buildGround();
    this.interactables = [];

    this.waterEdge.forEach((p) => {
      const b = this.add.rectangle(p[0] * T + T / 2, p[1] * T + T / 2, T, T);
      this.physics.add.existing(b, true);
      this.solids.add(b);
    });

    this.buildBuildings();
    this.buildDecor();
    this.buildPlayer();
    this.buildNpcs();

    this.physics.add.collider(this.player, this.solids);

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(this.ZOOM);
    this.cameras.main.roundPixels = true;
    this.cameras.main.fadeIn(400);

    /* plus de commandes clavier : tout se joue à la souris */

    /* ---------- invite d'interaction, sous forme de bouton ---------- */
    this.prompt = this.add.container(0, 0).setDepth(99999).setVisible(false);
    this.promptG = this.add.graphics();
    this.promptKey = this.add.text(0, 0, 'Clic', {
      fontFamily: 'Verdana', fontSize: '12px', color: '#4a3418', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: 'Verdana', fontSize: '15px', color: '#3b2f1c', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.prompt.add([this.promptG, this.promptKey, this.promptText]);
    this.promptLabel = null;

    /* le bouton se dessine à la taille du texte */
    this.drawPrompt = (label) => {
      this.promptText.setText(label);
      const kw = 50, pad = 11, gap = 9;
      const w = pad + kw + gap + this.promptText.width + pad;
      const h = 30;
      const g = this.promptG;
      g.clear();
      /* ombre portée */
      g.fillStyle(0x2a2118, 0.28);
      g.fillRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, 9);
      /* corps du bouton */
      g.fillStyle(0xfff6e2, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
      g.lineStyle(2.5, 0x6b4a22, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 9);
      /* touche du clavier */
      g.fillStyle(0xf5c542, 1);
      g.fillRoundedRect(-w / 2 + pad, -9, kw, 18, 5);
      g.lineStyle(2, 0x6b4a22, 1);
      g.strokeRoundedRect(-w / 2 + pad, -9, kw, 18, 5);
      this.promptKey.setPosition(-w / 2 + pad + kw / 2, 0);
      this.promptText.setPosition(-w / 2 + pad + kw + gap, 0);
      /* petite flèche vers l'objet, en dessous */
      g.fillStyle(0xfff6e2, 1);
      g.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, 0, h / 2 + 8);
      g.lineStyle(2.5, 0x6b4a22, 1);
      g.lineBetween(-6, h / 2 - 1, 0, h / 2 + 8);
      g.lineBetween(6, h / 2 - 1, 0, h / 2 + 8);
      this.prompt.setSize(w, h);
      this.prompt.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains);
    };
    this.prompt.setScale(this.ECHELLE_TEXTE);
    this.prompt.on('pointerdown', () => this.interact());
    /* petit rebond permanent pour attirer l'œil */
    /* léger battement, calculé à partir de l'échelle du moment */
    this.time.addEvent({ delay: 700, loop: true, callback: () => {
      if (!this.prompt.visible) return;
      const e = this.ECHELLE_TEXTE;
      this.tweens.add({ targets: this.prompt, scaleX: e * 1.06, scaleY: e * 1.06,
        duration: 340, yoyo: true, ease: 'Sine.easeInOut' });
    }});


    /* ============================================================
       COMMANDES : tout à la souris.
       On maintient le bouton enfoncé, le personnage marche vers le
       curseur et suit ses mouvements. On relâche, il s'arrête net.
       Un clic bref sur un personnage ou une porte déclenche l'action.
       ============================================================ */
    this.suit = false;
    this.curseurMonde = new Phaser.Math.Vector2();

    const positionMonde = (p) => this.cameras.main.getWorldPoint(p.x, p.y);

    this.input.on('pointerdown', (p) => {
      if (UI.isOpen()) return;
      const wp = positionMonde(p);
      /* clic directement sur quelque chose d'interactif ? */
      let cible = null, meilleure = 26;
      this.interactables.forEach((it) => {
        const d = Phaser.Math.Distance.Between(wp.x, wp.y, it.x, it.y);
        if (d < meilleure) { meilleure = d; cible = it; }
      });
      if (cible && Phaser.Math.Distance.Between(this.player.x, this.player.y, cible.x, cible.y) < 60) {
        cible.action();
        return;
      }
      this.suit = true;
      this.curseurMonde.set(wp.x, wp.y);
    });

    this.input.on('pointermove', (p) => {
      if (!this.suit) return;
      const wp = positionMonde(p);
      this.curseurMonde.set(wp.x, wp.y);
    });

    const stop = () => { this.suit = false; };
    this.input.on('pointerup', stop);
    this.input.on('pointerupoutside', stop);
    this.input.on('gameout', stop);

    /* molette de la souris : zoom avant / arrière */
    this.input.on('wheel', (p, objets, dx, dy) => {
      if (UI.isOpen()) return;
      const pas = dy > 0 ? -0.25 : 0.25;
      this.appliquerZoom(Phaser.Math.Clamp(this.ZOOM + pas, 1, 2.5));
    });

    this.appliquerZoom = (z) => {
      this.ZOOM = Math.round(z * 100) / 100;
      this.ECHELLE_TEXTE = 1 / this.ZOOM;
      this.cameras.main.setZoom(this.ZOOM);
      /* on remet à l'échelle tous les textes flottants du monde, sans avoir
         à tenir une liste à jour : ils se reconnaissent à leur profondeur */
      this.children.list.forEach((o) => {
        if (o.type === 'Text' && o.depth >= 99990) o.setScale(this.ECHELLE_TEXTE);
      });
      if (this.prompt) this.prompt.setScale(this.ECHELLE_TEXTE);
      const s = State.get().settings || (State.get().settings = {});
      s.zoom = this.ZOOM;
      State.save();
      UI.toast('Zoom ' + this.ZOOM.toFixed(2).replace('.', ',') + ' ×  (molette pour ajuster)');
    };

    /* le clavier ne sert plus qu'à fermer les fenêtres */
    this.input.keyboard.on('keydown-ESC', () => { if (UI.isOpen()) UI.hideAll(); });

    UI.showHud(true);
    this.updateQuestLabel();

    /* le marché bouge tout seul pendant qu'on joue */
    this.time.addEvent({
      delay: 45000, loop: true, callback: () => {
        State.nextDay();
        UI.toast('🌙 Un jour passe au village… les coffres de la banque ont bougé !');
      }
    });

    /* l'eau vit : on alterne les images des tuiles de mer */
    this.waterFrame = 0;
    this.time.addEvent({
      delay: 480, loop: true, callback: () => {
        this.waterFrame = (this.waterFrame + 1) % 3;
        this.waterTiles.forEach((t) => t.setTexture('eau' + ((this.waterFrame + t.phase) % 3)));
        this.foam.forEach((f, i) => f.setTexture('ecume' + ((this.waterFrame + i) % 2)));
      }
    });

    /* petites conversations entre habitants */
    this.time.addEvent({ delay: 14000, loop: true, callback: () => this.npcChat() });

    if (this.arrival === 'peche' || this.arrival === 'ferme' || this.arrival === 'feu') {
      const pos = { peche: [31, 33], ferme: [51, 33], feu: [17, 25] }[this.arrival];
      this.player.setPosition(pos[0] * T, pos[1] * T);
    }
    if (State.get().tutorial === 0) this.time.delayedCall(600, () => this.tutorial());
  }

  /* ============================================================
     LE SOL — tuiles Kenney « Tiny Town », 16 px.
     Les chemins de terre se raccordent tout seuls à l'herbe grâce
     au bloc de 9 tuiles prévu pour ça (autotuilage).
     ============================================================ */
  buildGround() {
    const T = this.T, K = Tileset.T;

    const isSea = (c, r) => r > this.ROWS - 9 + Math.sin(c * 0.35) * 1.6;
    const isBeach = (c, r) => !isSea(c, r) && r > this.ROWS - 12 + Math.sin(c * 0.35) * 1.6;

    /* tracé des chemins */
    const paths = {};
    const line = (c0, r0, c1, r1, w) => {
      w = w || 2;
      const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
      for (let s = 0; s <= steps; s++) {
        const c = Math.round(c0 + (c1 - c0) * s / steps);
        const r = Math.round(r0 + (r1 - r0) * s / steps);
        for (let dc = 0; dc < w; dc++) for (let dr = 0; dr < w; dr++) paths[(c + dc) + ',' + (r + dr)] = 1;
      }
    };
    line(8, 24, 54, 24, 3);              /* rue principale */
    line(30, 8, 30, 40, 3);              /* axe nord-sud vers le port */
    line(12, 14, 12, 24, 2);
    line(12, 14, 30, 14, 2);
    line(46, 14, 46, 24, 2);
    line(30, 14, 46, 14, 2);
    line(18, 24, 18, 34, 2);
    line(46, 24, 46, 34, 2);
    this.paths = paths;
    this.isSea = isSea;

    /* nature de chaque case */
    const terrain = [];
    for (let r = 0; r < this.ROWS; r++) {
      terrain[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        if (isSea(c, r)) terrain[r][c] = r > this.ROWS - 5 ? 'profond' : 'eau';
        else if (isBeach(c, r)) terrain[r][c] = 'sable';
        else if (paths[c + ',' + r]) terrain[r][c] = 'chemin';
        else terrain[r][c] = 'herbe';
      }
    }
    this.terrain = terrain;
    const kind = (c, r) => (c < 0 || r < 0 || c >= this.COLS || r >= this.ROWS) ? 'herbe' : terrain[r][c];
    const dur = (c, r) => { const k = kind(c, r); return k === 'chemin' || k === 'sable'; };

    /* le bloc de 9 tuiles : on choisit selon les voisins */
    const AUTO = [
      [K.BORD_NO, K.BORD_N, K.BORD_NE],
      [K.BORD_O,  K.BORD_CENTRE, K.BORD_E],
      [K.BORD_SO, K.BORD_S, K.BORD_SE]
    ];

    this.waterTiles = [];
    this.foam = [];

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const k = terrain[r][c];
        const x = c * T, y = r * T;
        let img;

        if (k === 'eau' || k === 'profond') {
          img = this.add.image(x, y, k === 'profond' ? 'eau_profonde' : 'eau0').setOrigin(0);
          if (k === 'eau') { img.phase = (c + r) % 3; this.waterTiles.push(img); }
          img.setDepth(-1000);
          /* écume au contact de la terre */
          if (!isSea(c, r - 1)) {
            const f = this.add.image(x, y, 'ecume0').setOrigin(0).setDepth(-998);
            this.foam.push(f);
          }
          continue;
        }

        /* herbe partout en fond : les raccords se posent par-dessus */
        const v = (c * 7 + r * 5) % 11;
        const fond = v === 0 ? K.HERBE_FLEURS : (v < 3 ? K.HERBE_BRINS : K.HERBE);
        this.add.image(x, y, Tileset.TOWN, fond).setOrigin(0).setDepth(-1000);

        if (k === 'chemin' || k === 'sable') {
          const n = dur(c, r - 1), s = dur(c, r + 1), o = dur(c - 1, r), e = dur(c + 1, r);
          let frame;
          if (n && s && o && e) {
            frame = Tileset.one(K.TERRE, c * 3 + r);      /* plein milieu */
          } else {
            const ligne = n ? (s ? 1 : 2) : 0;
            const col = o ? (e ? 1 : 2) : 0;
            frame = AUTO[ligne][col];
          }
          this.add.image(x, y, Tileset.TOWN, frame).setOrigin(0).setDepth(-999);
        }
      }
    }

    /* barrière invisible le long de l'eau, sauf sur le ponton */
    this.waterEdge = [];
    for (let c = 0; c < this.COLS; c++) {
      const surPonton = (c >= 29 && c <= 32);
      for (let r = 0; r < this.ROWS; r++) {
        if (!isSea(c, r)) continue;
        if (surPonton && r < this.ROWS - 4) continue;
        this.waterEdge.push([c, r]);
        break;
      }
    }
  }

  /* ---------- outils de pose de tuiles ---------- */
  put(c, r, frame, depthBonus) {
    const T = this.T;
    const i = this.add.image(c * T, r * T, Tileset.TOWN, frame).setOrigin(0);
    i.setDepth((r + 1) * T + (depthBonus || 0));
    return i;
  }
  solid(c, r, w, h) {
    const T = this.T;
    const b = this.add.rectangle(c * T + (w * T) / 2, r * T + (h * T) / 2, w * T, h * T);
    this.physics.add.existing(b, true);
    this.solids.add(b);
    return b;
  }

  /* ---------- bâtiments, assemblés tuile par tuile ---------- */
  /* Une maison : 3 rangées de toit et 3 rangées de mur, soit 6 tuiles
     de haut. À 16 px la tuile, cela fait 96 px — trois fois la taille
     d'un habitant, ce qui donne enfin des proportions crédibles. */
  maison(c, r, w, style, opts) {
    opts = opts || {};
    const K = Tileset.T;
    const rouge = style === 'rouge';
    const toitH = rouge ? K.TOIT_ROUGE : K.TOIT_GRIS;
    const toitB = rouge ? K.TOIT_ROUGE_BAS : K.TOIT_GRIS_BAS;
    const pointe = rouge ? K.TOIT_ROUGE_POINTE : K.TOIT_GRIS_POINTE;
    const mur = opts.pierre ? K.PIERRE : (opts.bois ? K.MUR_BOIS : K.MUR_GRIS);
    const fen = rouge ? K.MUR_FENETRE_ROUGE : K.MUR_FENETRE_GRIS;
    const porte = opts.bois ? K.PORTE_BOIS : K.PORTE_GRISE;
    const milieu = Math.floor(w / 2);

    for (let i = 0; i < w; i++) {
      const bord = i === 0 ? 0 : (i === w - 1 ? 2 : 1);
      /* toit */
      this.put(c + i, r, toitH[bord]);
      this.put(c + i, r + 1, toitH[bord]);
      this.put(c + i, r + 2, toitB[bord]);
      /* murs : rangée haute avec fenêtres, rangée du milieu, rangée de la porte */
      this.put(c + i, r + 3, (i === 1 || i === w - 2) ? fen : mur[bord]);
      this.put(c + i, r + 4, (i === milieu && w > 4) ? fen : mur[bord]);
      this.put(c + i, r + 5, i === milieu ? porte : mur[bord]);
    }
    if (w >= 3) this.put(c + milieu, r + 2, pointe);

    /* on ne traverse pas les murs ; la porte reste accessible par le bas */
    this.solid(c, r, w, 5);
    return { porteC: c + milieu, porteR: r + 5 };
  }

  arbre(c, r, sorte) {
    const K = Tileset.T;
    const a = sorte || Tileset.one([K.ARBRE_VERT, K.ARBRE_ROND, K.ARBRE_ORANGE,
                                    K.ARBRE_VERT2, K.ARBRE_ORANGE2], c * 3 + r * 7);
    this.put(c, r, a[0], -8);
    this.put(c, r + 1, a[1]);
    this.solid(c, r + 1, 1, 1);
  }

  cloture(c, r, longueur, vertical) {
    const K = Tileset.T;
    for (let i = 0; i < longueur; i++) {
      if (vertical) this.put(c, r + i, Tileset.one(K.CLOTURE_V, i));
      else this.put(c + i, r, Tileset.one(K.CLOTURE_H, i));
      this.solid(vertical ? c : c + i, vertical ? r + i : r, 1, 1);
    }
  }

  /* ---------- le village ---------- */
  buildBuildings() {
    const T = this.T;
    const etiquette = (c, r, texte, bientot) => {
      const t = this.add.text(c * T, r * T, texte, {
        fontFamily: 'Verdana', fontSize: '12px', color: '#fff8ee',
        backgroundColor: '#2f2838cc', padding: { x: 6, y: 3 }
      }).setOrigin(0.5, 1).setDepth(99998).setScale(this.ECHELLE_TEXTE);
      this.textesMonde.push(t);
      if (bientot) t.setColor('#c9c0ae');
      return t;
    };
    const entree = (c, r, label, action) => {
      this.interactables.push({ x: c * T + T / 2, y: r * T + T, label: label, action: action, kind: 'door' });
    };

    let m;
    m = this.maison(8, 16, 6, 'gris', { pierre: true });
    etiquette(11, 15.4, '🏦 La Banque des Curieux');
    entree(m.porteC, m.porteR, 'Entrer à la banque', () => this.enterBank());

    m = this.maison(23, 6, 5, 'rouge');
    etiquette(25.5, 5.4, '🛍️ La Boutique');
    entree(m.porteC, m.porteR, 'Entrer dans la boutique', () => this.enterShop());

    m = this.maison(47, 27, 5, 'rouge', { bois: true });
    etiquette(49.5, 26.4, '🏠 Ta maison');
    entree(m.porteC, m.porteR, 'Aller sur ton terrain', () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.start('Plot'));
    });

    m = this.maison(49, 14, 6, 'gris', { bois: true });
    etiquette(52, 13.4, '🌾 La Ferme');
    entree(m.porteC, m.porteR, 'Aller au potager', () => this.startFarm());

    m = this.maison(24, 34, 5, 'gris', { bois: true });
    etiquette(26.5, 33.4, '⚓ Le Port');
    entree(m.porteC, m.porteR, 'Partir en mer', () => this.startFishing());

    m = this.maison(37, 6, 6, 'gris', { pierre: true });
    etiquette(40, 5.4, '🏛️ Le Musée', true);
    entree(m.porteC, m.porteR, 'Regarder', () => this.soon('Le Musée des Inventions',
      'Grand-Père Élio prépare une exposition sur les grandes inventions.'));

    m = this.maison(5, 6, 5, 'gris', { pierre: true });
    etiquette(7.5, 5.4, '🔭 L\'Observatoire', true);
    entree(m.porteC, m.porteR, 'Regarder', () => this.soon('L\'Observatoire',
      'Noor règle son télescope pour t\'emmener dans l\'espace.'));

    m = this.maison(55, 20, 6, 'rouge', { pierre: true });
    etiquette(58, 19.4, '🚂 La Gare', true);
    entree(m.porteC, m.porteR, 'Regarder', () => this.soon('La Gare des Voyages',
      'Sacha prépare un train pour découvrir les pays du monde.'));
  }

  /* ---------- décor ---------- */
  buildDecor() {
    const K = Tileset.T, T = this.T;
    const libre = (c, r) => {
      if (this.paths[c + ',' + r] || this.isSea(c, r)) return false;
      if (this.terrain[r] && this.terrain[r][c] !== 'herbe') return false;
      /* on garde les abords des bâtiments dégagés */
      return !this.zonesBaties.some(z => c >= z[0] - 1 && c < z[0] + z[2] + 1 &&
                                          r >= z[1] - 1 && r < z[1] + z[3] + 1);
    };

    /* bosquets */
    let poses = [];
    for (let i = 0; i < 420; i++) {
      const c = Phaser.Math.Between(1, this.COLS - 2);
      const r = Phaser.Math.Between(2, this.ROWS - 14);
      if (!libre(c, r) || !libre(c, r + 1)) continue;
      if (poses.some(p => Math.abs(p[0] - c) < 2 && Math.abs(p[1] - r) < 2)) continue;
      poses.push([c, r]);
      this.arbre(c, r);
      if (poses.length > 90) break;
    }

    /* buissons, champignons, fleurs */
    for (let i = 0; i < 70; i++) {
      const c = Phaser.Math.Between(1, this.COLS - 2), r = Phaser.Math.Between(2, this.ROWS - 12);
      if (!libre(c, r)) continue;
      this.put(c, r, Tileset.one([K.BUISSON, K.CHAMPIGNONS, K.HERBE_CAILLOUX], i));
    }

    /* clôtures autour de la ferme et du jardin */
    this.cloture(50, 20, 6, false);
    this.cloture(50, 21, 4, true);
    this.cloture(47, 32, 5, false);

    /* le campement d'Ayla, à l'écart, à l'ouest de la banque */
    this.put(17, 24, K.TONNEAU);
    this.put(18, 25, K.CAILLOUX || K.HERBE_CAILLOUX);
    const feuLabel = this.add.text(17 * T + T / 2, 23.4 * T, '🔥 Le Campement', {
      fontFamily: 'Verdana', fontSize: '12px', color: '#fff8ee',
      backgroundColor: '#2f2838cc', padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 1).setDepth(99998).setScale(this.ECHELLE_TEXTE);
    this.textesMonde.push(feuLabel);
    this.interactables.push({
      x: 17 * T + T / 2, y: 25 * T + T, label: 'Rejoindre le campement', kind: 'door',
      action: () => this.startFire()
    });

    /* panneau sur la place */
    const p = this.put(31, 26, K.PANNEAU);
    this.interactables.push({
      x: 31 * T + T / 2, y: 26 * T + T, label: 'Lire le panneau', kind: 'sign',
      action: () => UI.say('Panneau du village', null, [
        'Bienvenue au Village des Explorateurs !',
        'Au sud : le port. À l\'est : la ferme et ta maison.',
        'À l\'ouest : la banque. Au nord : la boutique et le musée.'
      ])
    });

    /* le port : ponton en dalles, tonneaux, caisses */
    for (let r = this.ROWS - 12; r < this.ROWS - 3; r++)
      for (let c = 29; c <= 32; c++)
        this.add.image(c * T, r * T, Tileset.TOWN, K.DALLE).setOrigin(0).setDepth(-997);
    this.put(28, this.ROWS - 11, K.TONNEAU);
    this.put(33, this.ROWS - 10, K.POT);
    this.put(28, this.ROWS - 9, K.COFFRE);

    /* quelques objets qui donnent vie à la place */
    this.put(27, 25, K.TONNEAU); this.put(35, 25, K.POT);
    this.put(20, 23, K.BOITE_LETTRES); this.put(44, 23, K.RUCHE);
  }

  /* ============================================================
     FABRIQUE DE PERSONNAGES
     Si les calques LPC sont disponibles ET que la tenue est
     complete, on compose un personnage LPC. Sinon on garde nos
     personnages dessines en code. Le sprite porte un prefixe
     d'animation, pour que le reste du code ignore lequel des
     deux systemes est utilise.
     ============================================================ */
  creerPersonnage(cleBase, look, x, y) {
    if (typeof LPC !== 'undefined' && LPC.disponible()) {
      const lookLpc = (look && look.lpc) ? look.lpc : LPC.lookParDefaut();
      const cle = LPC.composer(this, lookLpc);
      if (cle) {
        LPC.animer(this, cle);
        const s = this.physics.add.sprite(x, y, cle, 0);
        s.setOrigin(0.5, 0.9);
        s.setSize(10, 6).setOffset(27, 52);
        s.animPrefix = cle;
        s.play(cle + '-idle-down');
        return s;
      }
    }
    Art.character(this, cleBase, look);
    this.makeAnims(cleBase);
    const s = this.physics.add.sprite(x, y, cleBase, 0);
    s.setSize(8, 5).setOffset(4, 18);
    s.animPrefix = cleBase;
    s.play(cleBase + '-idle-down');
    return s;
  }

  /* ---------- le joueur ---------- */
  buildPlayer() {
    const T = this.T;
    const look = State.get().child.look;
    this.player = this.creerPersonnage('player', look, 31 * T, 28 * T);
    this.player.setCollideWorldBounds(true);
    this.player.dir = 'down';
    this.player.setDepth(this.player.y);
  }

  makeAnims(key) {
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((d, row) => {
      const walk = key + '-walk-' + d, idle = key + '-idle-' + d;
      if (!this.anims.exists(walk)) {
        this.anims.create({
          key: walk, frameRate: 8, repeat: -1,
          frames: [0, 1, 2, 3].map(f => ({ key: key, frame: row * 4 + f }))
        });
      }
      if (!this.anims.exists(idle)) {
        this.anims.create({ key: idle, frames: [{ key: key, frame: row * 4 }], frameRate: 1 });
      }
    });
  }

  /* ---------- les habitants ---------- */
  buildNpcs() {
    const T = this.T;
    const spots = {
      marin: [30, 34], maya: [49, 21], awa: [14, 23], theo: [26, 13],
      lina: [33, 27], elio: [42, 13], noor: [10, 13], sacha: [55, 27],
      ayla: [18, 24]
    };
    this.npcs = [];
    GameData.npcs.forEach((n) => {
      const p = spots[n.id] || [27, 20];
      const look = Object.assign({ cloth: 3, pants: 10, shoes: 11 }, n.look || {});
      if (typeof LPC !== 'undefined' && LPC.disponible() && !look.lpc) look.lpc = LPC.lookPnj(n.id);
      const s = this.creerPersonnage('npc_' + n.id, look, p[0] * T, p[1] * T);
      s.setImmovable(true);
      s.data0 = { def: n, home: { x: p[0] * T, y: p[1] * T }, wait: Math.random() * 2000, target: null };
      s.setDepth(s.y);
      this.npcs.push(s);

      /* étiquette de nom */
      /* Nom flottant : pas de fond, un contour foncé pour rester lisible
         sur l'herbe comme sur la terre, et placé bien au-dessus du crâne. */
      const tag = this.add.text(s.x, s.y - this.HAUTEUR_ETIQUETTE, n.name, {
        fontFamily: 'Verdana', fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5, 1).setDepth(99997).setScale(this.ECHELLE_TEXTE);
      tag.setStroke('#2b2231', 5);
      tag.setShadow(0, 2, 'rgba(0,0,0,0.45)', 3);
      tag.setAlpha(0.92);
      s.tag = tag;

      this.interactables.push({
        x: s.x, y: s.y, label: 'Parler à ' + n.name, kind: 'npc', npc: s,
        action: () => this.talkTo(s)
      });
      this.physics.add.collider(this.player, s);
    });
  }

  bubble(sprite, text, ms) {
    if (sprite.bub) sprite.bub.destroy();
    const t = this.add.text(sprite.x, sprite.y - this.HAUTEUR_ETIQUETTE - 14, text, {
      fontFamily: 'Verdana', fontSize: '11px', color: '#2f2838',
      backgroundColor: '#fff8ee', padding: { x: 6, y: 4 }, wordWrap: { width: 240 }
    }).setOrigin(0.5, 1).setDepth(99999).setScale(this.ECHELLE_TEXTE);
    sprite.bub = t;
    this.tweens.add({ targets: t, y: t.y - 4, duration: 300, yoyo: false });
    this.time.delayedCall(ms || 3200, () => { if (t && t.destroy) t.destroy(); if (sprite.bub === t) sprite.bub = null; });
  }

  npcChat() {
    if (!GameData.npcChats || !GameData.npcChats.length) return;
    const chat = Phaser.Utils.Array.GetRandom(GameData.npcChats);
    const a = this.npcs.filter(n => n.data0.def.id === chat.a)[0];
    const b = this.npcs.filter(n => n.data0.def.id === chat.b)[0];
    if (a) this.bubble(a, chat.lines[0], 3000);
    if (b) this.time.delayedCall(1600, () => this.bubble(b, chat.lines[1] || '…', 3000));
  }

  talkTo(s) {
    const n = s.data0.def;
    const look = Object.assign({ cloth: 3 }, n.look || {});
    const portrait = Art.portrait(look);
    const q = State.get().quests;

    if (n.id === 'marin') {
      const lines = q.peche === 'done'
        ? n.afterQuest.concat(['Tu veux repartir en mer avec moi ?'])
        : n.greetings.concat(['Ça te dirait de venir pêcher avec moi ?',
                              'Je t\'apprendrai à reconnaître les poissons.']);
      UI.say(n.name, portrait, lines, null, [
        { label: '⚓ Partir en mer !', action: () => this.startFishing() },
        { label: 'Plus tard', action: () => { } }
      ]);
      return;
    }
    if (n.id === 'maya') {
      const lines = q.ferme === 'done'
        ? n.afterQuest.concat(['On retourne au potager quand tu veux !'])
        : n.greetings.concat(['J\'ai besoin d\'un coup de main au potager.',
                              'Tu découvriras d\'où viennent les fruits !']);
      UI.say(n.name, portrait, lines, null, [
        { label: '🌾 Aller au potager', action: () => this.startFarm() },
        { label: 'Plus tard', action: () => { } }
      ]);
      return;
    }
    if (n.id === 'ayla') {
      const lines = q.feu === 'done'
        ? n.afterQuest.concat(['On peut raviver le foyer ensemble, si tu veux.'])
        : n.greetings.concat(['Tu veux bien m\'aider à le rallumer ?']);
      UI.say(n.name, portrait, lines, null, [
        { label: '🔥 Rejoindre le campement', action: () => this.startFire() },
        { label: 'Plus tard', action: () => { } }
      ]);
      return;
    }
    if (n.id === 'awa') {
      UI.say(n.name, portrait, n.greetings.concat([
        'Ici, tu peux garder ton argent de poche… ou le faire grandir.',
        'Attention : plus un coffre monte vite, plus il peut aussi descendre !'
      ]), null, [
        { label: '🏦 Ouvrir mon compte', action: () => UI.openBank() },
        { label: 'Au revoir', action: () => { } }
      ]);
      return;
    }
    if (n.id === 'theo') {
      UI.say(n.name, portrait, n.greetings, null, [
        { label: '🎁 Les récompenses', action: () => UI.openRewardShop() },
        { label: '🛍️ Objets pour mon terrain', action: () => UI.openDecorShop() },
        { label: 'Au revoir', action: () => { } }
      ]);
      return;
    }
    const pool = (q.peche === 'done' || q.ferme === 'done' || q.feu === 'done') && n.afterQuest && n.afterQuest.length
      ? n.greetings.concat(n.afterQuest) : n.greetings.concat(n.idle || []);
    UI.say(n.name, portrait, [Phaser.Utils.Array.GetRandom(pool),
                              Phaser.Utils.Array.GetRandom(n.idle || pool)]);
  }

  /* ---------- entrées de bâtiments ---------- */
  enterBank() {
    UI.say('Awa, la banquière', Art.portrait(this.lookOf('awa')), [
      'Bienvenue à la Banque des Curieux !'
    ], () => UI.openBank());
  }
  enterShop() {
    UI.say('Théo, le commerçant', Art.portrait(this.lookOf('theo')), [
      'Entre donc ! Qu\'est-ce qui te ferait plaisir ?'
    ], null, [
      { label: '🎁 Récompenses des parents', action: () => UI.openRewardShop() },
      { label: '🛍️ Objets pour le terrain', action: () => UI.openDecorShop() },
      { label: 'Juste regarder', action: () => { } }
    ]);
  }
  lookOf(id) {
    const n = GameData.npcs.filter(x => x.id === id)[0];
    return Object.assign({ cloth: 3 }, (n && n.look) || {});
  }
  soon(title, text) {
    UI.say(title, null, [text, 'Ce lieu ouvrira dans une prochaine mise à jour !']);
  }
  startFishing() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => { UI.hideAll(); this.scene.start('Fishing'); });
  }
  startFarm() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => { UI.hideAll(); this.scene.start('Farm'); });
  }
  startFire() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => { UI.hideAll(); this.scene.start('Fire'); });
  }

  updateQuestLabel() {
    const q = State.get().quests;
    if (q.peche !== 'done') UI.setQuest('Va voir le Capitaine Marin au port ⚓');
    else if (q.ferme !== 'done') UI.setQuest('Va aider Maya à la ferme 🌾');
    else if (q.feu !== 'done') UI.setQuest('Va aider Ayla à rallumer le feu du campement 🔥');
    else UI.setQuest('Explore le village, décore ton terrain et fais grandir ton épargne !');
  }

  tutorial() {
    State.get().tutorial = 1; State.save();
    UI.say('Lina', Art.portrait(this.lookOf('lina')), [
      'Salut ' + (State.get().child.name || 'toi') + ' ! Bienvenue au village !',
      'Maintiens le clic de la souris : je te suis !',
      'Clique sur quelqu\'un pour lui parler.',
      'Le Capitaine Marin t\'attend au port, en bas !'
    ]);
  }

  interact() {
    if (UI.isOpen() || !this.near) return;
    this.near.action();
  }

  /* ---------- boucle ---------- */
  update(time, delta) {
    const p = this.player;
    const speed = 62;
    let vx = 0, vy = 0;

    /* on marche tant que le bouton est maintenu */
    if (this.suit && !UI.isOpen()) {
      const dx = this.curseurMonde.x - p.x, dy = this.curseurMonde.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) { vx = dx / d; vy = dy / d; }
    }

    const len = Math.hypot(vx, vy) || 1;
    p.setVelocity((vx / len) * speed, (vy / len) * speed);

    if (vx || vy) {
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
      if (p.dir !== dir || !p.anims.isPlaying) { p.dir = dir; p.play(p.animPrefix + '-walk-' + dir, true); }
    } else {
      p.play(p.animPrefix + '-idle-' + p.dir, true);
    }
    p.setDepth(p.y);

    /* habitants : petites promenades */
    this.npcs.forEach((s) => {
      const d = s.data0;
      d.wait -= delta;
      if (d.wait <= 0 && !d.target) {
        if (Math.random() > 0.45) {
          d.target = {
            x: d.home.x + Phaser.Math.Between(-32, 32),
            y: d.home.y + Phaser.Math.Between(-24, 24)
          };
        }
        d.wait = 1800 + Math.random() * 3500;
        if (Math.random() > 0.85 && d.def.idle && d.def.idle.length) {
          this.bubble(s, Phaser.Utils.Array.GetRandom(d.def.idle));
        }
      }
      if (d.target) {
        const dx = d.target.x - s.x, dy = d.target.y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) { d.target = null; s.setVelocity(0, 0); s.play(s.animPrefix + '-idle-down', true); }
        else {
          s.setVelocity((dx / dist) * 20, (dy / dist) * 20);
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          s.play(s.animPrefix + '-walk-' + dir, true);
        }
      } else s.setVelocity(0, 0);
      s.setDepth(s.y);
      s.tag.setPosition(s.x, s.y - this.HAUTEUR_ETIQUETTE);
      if (s.bub) s.bub.setPosition(s.x, s.y - this.HAUTEUR_ETIQUETTE - 14);
      /* le PNJ garde sa position dans la liste des interactions */
      const it = this.interactables.filter(i => i.npc === s)[0];
      if (it) { it.x = s.x; it.y = s.y; }
    });


    /* invite d'interaction */
    let best = null, bestD = 34;
    this.interactables.forEach((it) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < bestD) { bestD = d; best = it; }
    });
    this.near = best;
    if (best && !UI.isOpen()) {
      if (this.promptLabel !== best.label) {
        this.promptLabel = best.label;
        this.drawPrompt(best.label);
      }
      this.prompt.setVisible(true).setPosition(best.x, best.y - this.HAUTEUR_ETIQUETTE - 16);
    } else {
      this.prompt.setVisible(false);
      this.promptLabel = null;
    }
  }

  shutdown() { UI.hideAll(); }
};
