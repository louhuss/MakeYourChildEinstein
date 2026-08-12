/* ============================================================
   SCENE-MENU.JS — démarrage, écran titre et création du héros.
   ============================================================ */

/* ---------- 1. Préparation ---------- */
const SceneBoot = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    /* On repère si un fichier n'a pas pu être chargé. C'est ce qui arrive
       quand on ouvre index.html directement : le navigateur refuse de lire
       les images voisines, et le jeu s'affiche en damier vert. */
    this.echecs = [];
    this.load.on('loaderror', (f) => this.echecs.push(f.key));

    /* les planches de tuiles Kenney (licence CC0) */
    Tileset.preload(this);
    /* calques de personnages LPC */
    LPC.preloadManifest(this);
  }
  create() {
    /* Message clair plutôt qu'un décor cassé. */
    const surFichier = location.protocol === 'file:';
    if (surFichier || (this.echecs && this.echecs.length)) {
      document.getElementById('loading').innerHTML =
        '<div style="max-width:560px;text-align:center;padding:30px;line-height:1.6">' +
        '<div style="font-size:44px">🔌</div>' +
        '<h2 style="margin:14px 0 10px">Il faut lancer le jeu avec son serveur</h2>' +
        '<p style="font-weight:normal;font-size:16px">Ton navigateur refuse de charger les images ' +
        'quand on ouvre le fichier directement depuis le disque. C\'est une sécurité de Chrome, ' +
        'pas un bug du jeu.</p>' +
        '<p style="font-weight:normal;font-size:16px"><b>Ferme cet onglet et double-clique sur ' +
        '<code>demarrer-serveur.bat</code></b>, dans le dossier du jeu. Il ouvrira la bonne adresse ' +
        'tout seul.</p></div>';
      document.getElementById('loading').classList.remove('gone');
      return;
    }

    State.load();
    Art.init(this);
    Tileset.makeWater(this);
    UI.init();
    UI.applyAccess();

    const suite = (ok) => {
      if (ok) console.log('Personnages LPC actifs');
      const el = document.getElementById('loading');
      if (el) el.classList.add('gone');
      this.scene.start('Title');
    };
    try { LPC.chargerCalques(this, suite); }
    catch (e) { console.warn('LPC indisponible :', e.message); suite(false); }
  }
};

/* ---------- 2. Écran titre ---------- */
const SceneTitle = class extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    UI.showHud(false);
    UI.hideAll();

    /* une illustration de fond, dessinée en code */
    Art.make(this, 'titlebg', 480, 300, function (x) {
      const sky = x.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#7fc9f2'); sky.addColorStop(0.55, '#bfe6f7'); sky.addColorStop(1, '#e8f6ff');
      x.fillStyle = sky; x.fillRect(0, 0, 480, 300);
      /* soleil */
      x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(400, 60, 34, 0, 7); x.fill();
      x.fillStyle = '#fff6d0'; x.beginPath(); x.arc(400, 60, 24, 0, 7); x.fill();
      /* collines */
      x.fillStyle = '#7fc26a';
      x.beginPath(); x.moveTo(0, 190); x.quadraticCurveTo(120, 130, 250, 185);
      x.quadraticCurveTo(370, 235, 480, 175); x.lineTo(480, 300); x.lineTo(0, 300); x.fill();
      x.fillStyle = '#6bb257';
      x.beginPath(); x.moveTo(0, 215); x.quadraticCurveTo(150, 175, 300, 220);
      x.quadraticCurveTo(400, 250, 480, 215); x.lineTo(480, 300); x.lineTo(0, 300); x.fill();
      /* mer au fond */
      x.fillStyle = '#57b6e0'; x.fillRect(0, 176, 480, 16);
      x.fillStyle = '#8fd8f2';
      for (let i = 0; i < 30; i++) x.fillRect(Math.random() * 480, 178 + Math.random() * 12, 6, 1);
      /* petites maisons */
      const house = function (hx, hy, s, wall, roof) {
        x.fillStyle = wall; x.fillRect(hx, hy, 34 * s, 24 * s);
        x.fillStyle = roof;
        x.beginPath(); x.moveTo(hx - 4 * s, hy); x.lineTo(hx + 17 * s, hy - 16 * s);
        x.lineTo(hx + 38 * s, hy); x.fill();
        x.fillStyle = '#7a4f2a'; x.fillRect(hx + 13 * s, hy + 10 * s, 8 * s, 14 * s);
        x.fillStyle = '#bfe3f5'; x.fillRect(hx + 4 * s, hy + 5 * s, 7 * s, 7 * s);
        x.fillRect(hx + 23 * s, hy + 5 * s, 7 * s, 7 * s);
      };
      house(60, 200, 1, '#f7ece0', '#c9483c');
      house(150, 214, 1.2, '#f2dfb8', '#4a76c9');
      house(280, 205, 1, '#efe6d2', '#4f9b58');
      house(370, 220, 0.9, '#f7ece0', '#c9483c');
      /* arbres */
      const tree = function (tx, ty, s) {
        x.fillStyle = '#8d5f34'; x.fillRect(tx - 2 * s, ty - 10 * s, 4 * s, 12 * s);
        x.fillStyle = '#3f8f38'; x.beginPath(); x.arc(tx, ty - 16 * s, 10 * s, 0, 7); x.fill();
        x.fillStyle = '#54a848'; x.beginPath(); x.arc(tx - 3 * s, ty - 19 * s, 7 * s, 0, 7); x.fill();
      };
      [[30, 240, 1.3], [110, 250, 1], [225, 245, 1.2], [330, 255, 1], [440, 245, 1.4]]
        .forEach(function (t) { tree(t[0], t[1], t[2]); });
      /* fleurs au premier plan */
      for (let i = 0; i < 40; i++) {
        const fx = Math.random() * 480, fy = 250 + Math.random() * 48;
        x.fillStyle = '#4f9b3a'; x.fillRect(fx, fy, 1, 5);
        x.fillStyle = ['#e8503a', '#f5c542', '#ef6fb0', '#ffffff'][i % 4];
        x.fillRect(fx - 1, fy - 3, 3, 3);
      }
    });

    const bg = this.add.image(W / 2, H / 2, 'titlebg');
    bg.setDisplaySize(W, H);

    /* nuages qui dérivent */
    Art.make(this, 'cloud', 90, 34, function (x) {
      x.fillStyle = '#ffffff';
      [[26, 20, 18], [50, 18, 14], [66, 22, 12], [16, 24, 12]].forEach(function (c) {
        x.beginPath(); x.arc(c[0], c[1], c[2], 0, 7); x.fill();
      });
      x.fillRect(12, 20, 60, 12);
    });
    for (let i = 0; i < 5; i++) {
      const c = this.add.image(Math.random() * W, 50 + Math.random() * 90, 'cloud')
        .setAlpha(0.85).setScale(0.8 + Math.random());
      this.tweens.add({
        targets: c, x: c.x + W + 200, duration: 40000 + Math.random() * 30000,
        repeat: -1, onRepeat: () => { c.x = -200; }
      });
    }

    /* titre */
    const t1 = this.add.text(W / 2, 118, 'MAKE YOUR CHILD', {
      fontFamily: 'Verdana', fontSize: '42px', color: '#fff8ee', fontStyle: 'bold'
    }).setOrigin(0.5).setStroke('#2f2838', 9).setShadow(0, 8, '#00000055', 8);
    const t2 = this.add.text(W / 2, 178, 'EINSTEIN', {
      fontFamily: 'Verdana', fontSize: '54px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(0.5).setStroke('#2f2838', 10).setShadow(0, 6, '#00000044', 6);
    this.tweens.add({ targets: [t1, t2], y: '-=8', duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(W / 2, 222, 'Explore, apprends, construis ton monde', {
      fontFamily: 'Verdana', fontSize: '15px', color: '#2f2838'
    }).setOrigin(0.5).setBackgroundColor('#ffffffaa').setPadding(10, 5, 10, 5);

    /* boutons */
    const mkBtn = (y, label, color, fn) => {
      const g = this.add.container(W / 2, y);
      const r = this.add.rectangle(0, 0, 300, 58, color).setStrokeStyle(5, 0x2f2838);
      const tx = this.add.text(0, 0, label, {
        fontFamily: 'Verdana', fontSize: '20px', color: '#fff8ee', fontStyle: 'bold'
      }).setOrigin(0.5);
      g.add([r, tx]);
      r.setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.tweens.add({ targets: g, scale: 1.05, duration: 120 }))
        .on('pointerout', () => this.tweens.add({ targets: g, scale: 1, duration: 120 }))
        .on('pointerdown', fn);
      return g;
    };

    const d = State.get();
    let y = 300;
    if (d.child.name) {
      mkBtn(y, '▶  Continuer  (' + d.child.name + ')', 0x5fbf46, () => this.enterVillage());
      y += 74;
    }
    mkBtn(y, d.child.name ? '✨  Nouveau héros' : '▶  Commencer l\'aventure', 0x3d7fd8, () => {
      this.scene.start('Creator');
    });
    y += 74;
    mkBtn(y, '👪  Espace parents', 0x8a7fa8, () => UI.openParentGate());

    this.add.text(W / 2, H - 24,
      'Prototype de démonstration · aucune donnée n\'est envoyée sur Internet',
      { fontFamily: 'Verdana', fontSize: '11px', color: '#2f2838' }).setOrigin(0.5).setAlpha(0.7);

    /* astuce du jour */
    if (GameData.tips && GameData.tips.length) {
      this.add.text(W / 2, H - 52, Phaser.Utils.Array.GetRandom(GameData.tips), {
        fontFamily: 'Verdana', fontSize: '12px', color: '#2f2838',
        backgroundColor: '#ffffffaa', padding: { x: 8, y: 4 }
      }).setOrigin(0.5);
    }
  }

  enterVillage() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('Village'));
  }
};

/* ---------- 3. Création du héros ---------- */
const SceneCreator = class extends Phaser.Scene {
  constructor() { super('Creator'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    UI.showHud(false);
    const bg = this.add.image(W / 2, H / 2, 'titlebg');
    bg.setDisplaySize(W, H); bg.setAlpha(0.6);
    this.add.rectangle(W / 2, H / 2, W, H, 0x2f2838, 0.25);

    const d = State.get();
    this.look = Object.assign({}, d.child.look);
    this.name = d.child.name || '';
    this.openPanel();
  }

  openPanel() {
    const self = this;
    const host = document.getElementById('creator');
    host.classList.remove('hidden');

    /* Si les calques LPC sont là, l'éditeur pilote un personnage LPC.
       Sinon il retombe sur nos personnages dessinés en code. */
    const modeLpc = (typeof LPC !== 'undefined') && LPC.disponible();
    let rows;
    if (modeLpc) {
      if (!self.look.lpc) self.look.lpc = LPC.lookParDefaut();
      rows = [];
      LPC.categories().forEach(function (cat) {
        if (cat.id === 'visage') return;              /* une seule expression pour l'instant */
        const titres = { corps: 'Couleur de peau', tete: 'Visage', cheveux: 'Coiffure',
                         haut: 'Haut', bas: 'Bas', chaussures: 'Chaussures', chapeau: 'Chapeau' };
        rows.push({ lpc: true, key: cat.id, label: titres[cat.id] || cat.label, type: 'choice',
                    list: cat.items.map(function (i) { return i.id; }),
                    labels: cat.items.map(function (i) { return i.nom; }),
                    obligatoire: cat.obligatoire });
        const couleurs = LPC.couleursDe(cat.id);
        if (couleurs.length) {
          rows.push({ lpc: true, key: cat.id + 'Couleur', label: 'Couleur — ' + cat.label,
                      type: 'choice', list: couleurs,
                      labels: couleurs.map(function (c) { return LPC.nomCouleur(c); }) });
        }
      });
    } else {
      rows = [
      { key: 'skin',      label: 'Couleur de peau', type: 'swatch', list: Art.SKINS },
      { key: 'hair',      label: 'Coiffure',        type: 'choice', list: Art.HAIRSTYLES,
        labels: ['Court', 'Carré', 'Mi-long', 'Long', 'Couettes', 'Queue',
                 'Bouclé', 'Afro', 'Crête', 'Chignon', 'Tresses', 'Rasé'] },
      { key: 'hairColor', label: 'Couleur des cheveux', type: 'swatch', list: Art.HAIRS },
      { key: 'outfit',    label: 'Tenue',           type: 'choice', list: Art.OUTFITS,
        labels: ['T-shirt', 'Pull', 'Rayé', 'Sweat à capuche', 'Gilet', 'Tunique',
                 'Robe', 'Salopette', 'Marinière'] },
      { key: 'cloth',     label: 'Couleur du haut', type: 'swatch', list: Art.CLOTH },
      { key: 'pants',     label: 'Couleur du bas',  type: 'swatch', list: Art.CLOTH },
      { key: 'shoes',     label: 'Chaussures',      type: 'swatch', list: Art.CLOTH },
      { key: 'hat',       label: 'Chapeau',         type: 'choice', list: Art.HATS,
        labels: ['Aucun', 'Casquette', 'Paille', 'Bandeau', 'Bonnet',
                 'Chapeau', 'Couronne', 'Casque'], value: 'string' },
      { key: 'glasses',   label: 'Lunettes',        type: 'choice', list: Art.GLASSES,
        labels: ['Aucunes', 'Rondes', 'Carrées', 'Soleil'], value: 'string' }
      ];
    }


    function render() {
      let html = '<div class="creator-wrap">' +
        '<div class="creator-preview">' +
          '<img id="cr-img" src="' + (modeLpc ? (LPC.portrait(self, self.look.lpc, 160) || Art.preview(self.look, 6)) : Art.preview(self.look, 6)) + '" alt="Ton personnage">' +
          '<div class="cr-turn">' +
            '<button data-dir="left">◀</button><button data-dir="down">🙂</button>' +
            '<button data-dir="right">▶</button><button data-dir="up">🔄</button>' +
          '</div>' +
          '<input id="cr-name" maxlength="12" placeholder="Ton prénom" value="' +
            self.name.replace(/"/g, '&quot;') + '">' +
          '<p class="tiny">On te demande seulement un prénom ou un surnom.</p>' +
        '</div>' +
        '<div class="creator-options">';

      rows.forEach(function (row, ri) {
        html += '<div class="crow"><h4>' + row.label + '</h4><div class="' +
          (row.type === 'swatch' ? 'swatches' : 'choices') + '">';
        row.list.forEach(function (opt, i) {
          const val = row.lpc ? opt : (row.value === 'string' ? opt : i);
          const courant = row.lpc ? self.look.lpc[row.key] : self.look[row.key];
          const on = courant === val;
          if (row.type === 'swatch') {
            html += '<button class="swatch' + (on ? ' on' : '') + '" data-r="' + ri +
              '" data-v="' + i + '" style="background:' + opt + '"></button>';
          } else {
            html += '<button class="choice' + (on ? ' on' : '') + '" data-r="' + ri +
              '" data-v="' + i + '">' + ((row.labels && row.labels[i]) || opt) + '</button>';
          }
        });
        html += '</div></div>';
      });

      html += '</div></div>' +
        '<div class="creator-actions">' +
        '<button class="btn alt" id="cr-random">🎲 Surprise</button>' +
        '<button class="btn" id="cr-back">← Retour</button>' +
        '<button class="btn big" id="cr-go">C\'est parti ! ➜</button>' +
        '</div>';

      host.innerHTML = html;

      host.querySelectorAll('[data-r]').forEach(function (b) {
        b.onclick = function () {
          const row = rows[+b.getAttribute('data-r')];
          const i = +b.getAttribute('data-v');
          if (row.lpc) {
            self.look.lpc[row.key] = row.list[i];
            /* la peau du visage suit celle du corps */
            if (row.key === 'corpsCouleur') self.look.lpc.teteCouleur = row.list[i];
          } else {
            self.look[row.key] = row.value === 'string' ? row.list[i] : i;
          }
          render();
        };
      });
      host.querySelectorAll('[data-dir]').forEach(function (b) {
        b.onclick = function () {
          if (modeLpc) return;
          document.getElementById('cr-img').src = Art.preview(self.look, 6, b.getAttribute('data-dir'));
        };
      });
      document.getElementById('cr-name').oninput = function (e) { self.name = e.target.value; };
      document.getElementById('cr-random').onclick = function () {
        if (modeLpc) { self.look.lpc = LPC.tirageAleatoire(); render(); return; }
        rows.forEach(function (row) {
          const i = Math.floor(Math.random() * row.list.length);
          self.look[row.key] = row.value === 'string' ? row.list[i] : i;
        });
        render();
      };
      document.getElementById('cr-back').onclick = function () {
        host.classList.add('hidden'); host.innerHTML = '';
        self.scene.start('Title');
      };
      document.getElementById('cr-go').onclick = function () {
        const n = (self.name || '').trim();
        if (n.length < 2) { UI.toast('Écris un prénom ou un surnom (2 lettres minimum).', 'warn'); return; }
        const d = State.get();
        d.child.name = n.charAt(0).toUpperCase() + n.slice(1);
        d.child.look = self.look;
        State.save();
        host.classList.add('hidden'); host.innerHTML = '';
        UI.toast('Bienvenue, ' + d.child.name + ' !', 'good');
        self.cameras.main.fadeOut(300);
        self.time.delayedCall(320, function () { self.scene.start('Village'); });
      };
    }
    render();
  }

  shutdown() {
    const host = document.getElementById('creator');
    host.classList.add('hidden'); host.innerHTML = '';
  }
};
