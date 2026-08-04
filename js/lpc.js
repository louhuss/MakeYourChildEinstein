/* ============================================================
   LPC.JS — personnages composés par calques (Liberated Pixel Cup).
   Un personnage = un empilement d'images : corps, tête, visage,
   bas, haut, chaussures, cheveux, chapeau…
   On ne garde que l'animation de marche (lignes 8 à 11 de la
   planche, 9 images chacune) et on fabrique une petite planche
   de 9 × 4 images, prête pour Phaser.

   RÈGLE ABSOLUE : le corps n'est jamais affiché seul. Sans haut
   ET sans bas, le système refuse de composer et le jeu retombe
   sur les personnages dessinés en code. Jeu pour enfants.
   ============================================================ */

const LPC = (function () {

  let manifest = null;
  let pret = false;
  const composes = {};

  const CATS_HABIT = ['haut', 'bas'];            /* obligatoires */
  const CATS_BASE = ['corps', 'tete', 'visage']; /* toujours posées */

  /* ---------- chargement ---------- */
  function preloadManifest(scene) {
    scene.load.json('lpc_manifest', 'assets/lpc-slim/manifest.json');
    scene.load.json('lpc_palettes', 'assets/lpc-slim/palettes.json');
  }

  /* ---------- colorisation ----------
     Les planches LPC sont livrées dans une teinte de base. Pour obtenir
     d'autres couleurs, on remplace chaque pixel par la couleur de même
     niveau de luminosité dans la rampe choisie. Six teintes suffisent :
     c'est exactement la façon dont ces sprites sont dessinés. */
  let palettes = null;

  function hexVersRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function coloriser(img, rampe) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0);
    if (!rampe || !rampe.length) return c;
    const cible = rampe.map(hexVersRgb);
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 20) continue;
      /* luminosité perçue, puis rang dans la rampe */
      const lum = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) / 255;
      let k = Math.round(lum * (cible.length - 1));
      if (k < 0) k = 0; if (k >= cible.length) k = cible.length - 1;
      p[i] = cible[k][0]; p[i + 1] = cible[k][1]; p[i + 2] = cible[k][2];
    }
    x.putImageData(d, 0, 0);
    return c;
  }

  /* noms de couleurs en français */
  const NOMS_COULEURS = {
    black: 'Noir', white: 'Blanc', gray: 'Gris', grey: 'Gris', brown: 'Marron',
    tan: 'Beige', walnut: 'Noyer', leather: 'Cuir', red: 'Rouge', maroon: 'Bordeaux',
    rose: 'Rose pâle', pink: 'Rose', orange: 'Orange', yellow: 'Jaune', gold: 'Doré',
    green: 'Vert', forest: 'Vert foncé', teal: 'Bleu-vert', blue: 'Bleu',
    lightblue: 'Bleu clair', sky: 'Ciel', darkblue: 'Bleu nuit', navy: 'Marine',
    purple: 'Violet', lavender: 'Lavande',
    light: 'Claire', fair: 'Très claire', olive: 'Olive', amber: 'Ambrée',
    taupe: 'Taupe', bronze: 'Bronze', dark: 'Foncée',
    ash: 'Cendré', platinum: 'Platine', blonde: 'Blond', ginger: 'Roux',
    redhead: 'Rousse', chestnut: 'Châtain', silver: 'Argent'
  };
  function nomCouleur(id) {
    return NOMS_COULEURS[id] || (id.charAt(0).toUpperCase() + id.slice(1));
  }

  function couleursDe(categorie) {
    if (!palettes || !manifest || !manifest.palettes) return [];
    const fam = manifest.palettes[categorie];
    return fam && palettes[fam] ? Object.keys(palettes[fam]) : [];
  }

  /* charge toutes les images de calques, puis appelle onDone */
  function chargerCalques(scene, onDone) {
    manifest = scene.cache.json.get('lpc_manifest');
    palettes = scene.cache.json.get('lpc_palettes') || {};
    if (!manifest || !manifest.calques) { pret = false; return onDone(false); }

    const aCharger = [];
    manifest.ordreCalques.forEach(function (cat) {
      (manifest.calques[cat] || []).forEach(function (item) {
        item.cle = 'lpc_' + cat + '_' + item.id;
        aCharger.push(item);
      });
    });
    if (!aCharger.length) { pret = false; return onDone(false); }

    aCharger.forEach(function (it) {
      scene.load.image(it.cle, 'assets/lpc-slim/' + it.fichier);
    });
    scene.load.once('complete', function () {
      pret = habillageComplet();
      onDone(pret);
    });
    scene.load.start();
  }

  function habillageComplet() {
    if (!manifest) return false;
    return CATS_HABIT.every(function (c) {
      return (manifest.calques[c] || []).length > 0;
    });
  }
  function disponible() { return pret && habillageComplet(); }

  /* ---------- catalogue pour l'éditeur ---------- */
  function categories() {
    if (!manifest) return [];
    const libelles = {
      corps: 'Couleur de peau', tete: 'Visage', visage: 'Expression',
      cheveux: 'Coiffure', haut: 'Haut', bas: 'Bas',
      chaussures: 'Chaussures', chapeau: 'Chapeau', lunettes: 'Lunettes', dos: 'Dans le dos'
    };
    /* on n'expose jamais une option « aucun » pour le haut et le bas */
    return manifest.ordreCalques
      .filter(function (c) { return (manifest.calques[c] || []).length > 0; })
      .map(function (c) {
        return {
          id: c, label: libelles[c] || c,
          obligatoire: CATS_HABIT.indexOf(c) >= 0 || CATS_BASE.indexOf(c) >= 0,
          items: manifest.calques[c]
        };
      });
  }

  function lookParDefaut() {
    const l = {};
    if (!manifest) return l;
    manifest.ordreCalques.forEach(function (c) {
      const liste = manifest.calques[c] || [];
      if (!liste.length) return;
      if (CATS_BASE.indexOf(c) >= 0 || CATS_HABIT.indexOf(c) >= 0 ||
          c === 'chaussures' || c === 'cheveux') {
        l[c] = liste[0].id;
        const dispo = couleursDe(c);
        if (dispo.length) l[c + 'Couleur'] = dispo[0];
      }
    });
    return l;
  }

  /* tirage au sort d'un personnage — toujours habillé */
  function tirageAleatoire() {
    const l = {};
    if (!manifest) return l;
    const pioche = function (c) {
      const liste = manifest.calques[c] || [];
      return liste.length ? liste[Math.floor(Math.random() * liste.length)].id : null;
    };
    /* Les cheveux tirent surtout des teintes naturelles : une chevelure
       verte ou rose reste possible, mais une fois sur six seulement. */
    const NATURELS = ['black', 'brown', 'chestnut', 'blonde', 'ginger',
                      'redhead', 'ash', 'platinum', 'white'];
    const couleurAuHasard = function (c) {
      let dispo = couleursDe(c);
      if (!dispo.length) return;
      if (c === 'cheveux' && Math.random() > 0.17) {
        const nat = dispo.filter(function (x) { return NATURELS.indexOf(x) >= 0; });
        if (nat.length) dispo = nat;
      }
      l[c + 'Couleur'] = dispo[Math.floor(Math.random() * dispo.length)];
    };
    CATS_BASE.concat(CATS_HABIT).forEach(function (c) {
      const v = pioche(c); if (v) { l[c] = v; couleurAuHasard(c); }
    });
    /* la peau doit rester la même sur le corps et la tête */
    if (l.corpsCouleur) l.teteCouleur = l.corpsCouleur;
    ['cheveux', 'chaussures'].forEach(function (c) {
      const v = pioche(c); if (v) { l[c] = v; couleurAuHasard(c); }
    });
    /* les accessoires n'apparaissent qu'une fois sur trois */
    ['chapeau', 'lunettes', 'dos'].forEach(function (c) {
      if (Math.random() < 0.34) { const v = pioche(c); if (v) l[c] = v; }
    });
    return l;
  }

  /* ---------- composition ---------- */
  function itemDe(cat, id) {
    if (!manifest) return null;
    return (manifest.calques[cat] || []).filter(function (i) { return i.id === id; })[0];
  }

  /* Fabrique (et met en cache) la planche de marche d'un personnage.
     Renvoie la clef de texture, ou null si le look n'est pas habillé. */
  function composer(scene, look) {
    if (!disponible()) return null;
    /* garde-fou : pas de haut ou pas de bas → on refuse */
    if (!look || !look.haut || !look.bas) return null;

    const signature = manifest.ordreCalques.map(function (c) {
      return (look[c] || '-') + '~' + (look[c + 'Couleur'] || '');
    }).join('_');
    const cle = 'lpcperso_' + signature;
    if (composes[cle]) return cle;
    if (scene.textures.exists(cle)) { composes[cle] = true; return cle; }

    const M = manifest.marche, T = manifest.cadre;
    const L = M.nbImages * T, H = M.nbLignes * T;
    const c = document.createElement('canvas');
    c.width = L; c.height = H;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    let posees = 0;
    manifest.ordreCalques.forEach(function (cat) {
      const id = look[cat];
      if (!id) return;
      const item = itemDe(cat, id);
      if (!item || !scene.textures.exists(item.cle)) return;
      let src = scene.textures.get(item.cle).getSourceImage();
      /* colorisation éventuelle */
      const fam = manifest.palettes ? manifest.palettes[cat] : null;
      const nomCouleur = look[cat + 'Couleur'];
      if (fam && nomCouleur && palettes[fam] && palettes[fam][nomCouleur]) {
        src = coloriser(src, palettes[fam][nomCouleur]);
      }
      /* on découpe uniquement les lignes de marche */
      x.drawImage(src, 0, M.ligneDepart * T, L, H, 0, 0, L, H);
      posees++;
    });
    if (posees < 4) return null;      /* corps + tête + haut + bas au minimum */

    const tex = scene.textures.addCanvas(cle, c);
    if (tex && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    /* découpage en images */
    const t = scene.textures.get(cle);
    let n = 0;
    for (let ligne = 0; ligne < M.nbLignes; ligne++) {
      for (let i = 0; i < M.nbImages; i++) t.add(n++, 0, i * T, ligne * T, T, T);
    }
    composes[cle] = true;
    return cle;
  }

  /* crée les animations de marche pour une planche composée */
  function animer(scene, cle) {
    if (!manifest) return;
    const M = manifest.marche;
    manifest.directions.forEach(function (d, ligne) {
      const anim = cle + '-walk-' + d, repos = cle + '-idle-' + d;
      if (!scene.anims.exists(anim)) {
        const images = [];
        for (let i = 1; i < M.nbImages; i++) images.push(ligne * M.nbImages + i);
        scene.anims.create({
          key: anim, frameRate: 9, repeat: -1,
          frames: images.map(function (f) { return { key: cle, frame: f }; })
        });
      }
      if (!scene.anims.exists(repos)) {
        scene.anims.create({ key: repos, frameRate: 1,
          frames: [{ key: cle, frame: ligne * M.nbImages }] });
      }
    });
  }

  /* portrait pour l'interface : la première image de la marche vers le bas */
  function portrait(scene, look, taille) {
    const cle = composer(scene, look);
    if (!cle) return null;
    const T = manifest.cadre, M = manifest.marche;
    const src = scene.textures.get(cle).getSourceImage();
    const S = taille || 96;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#8fd0f0'; x.fillRect(0, 0, S, S);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, S * 0.7, S, S * 0.3);
    /* rangée « vers le bas » : le visage face à nous */
    const ligne = manifest.directions.indexOf('down');
    x.drawImage(src, 0, ligne * T, T, T, 0, 0, S, S);
    return c.toDataURL();
  }

  /* Apparence stable d'un habitant : tirée au sort une seule fois, puis
     conservée dans la sauvegarde. Sans ça, un PNJ changerait de tête
     entre le village et une mission. */
  function lookPnj(id) {
    if (!disponible()) return null;
    const d = (typeof State !== 'undefined' && State.get) ? State.get() : null;
    if (!d) return tirageAleatoire();
    if (!d.pnjLooks) d.pnjLooks = {};
    if (!d.pnjLooks[id]) {
      d.pnjLooks[id] = tirageAleatoire();
      if (State.save) State.save();
    }
    return d.pnjLooks[id];
  }

  /* Personnage immobile, pour les scènes de mission. */
  function spriteFixe(scene, look, x, y, echelle) {
    if (!disponible()) return null;
    const cle = composer(scene, look || lookParDefaut());
    if (!cle) return null;
    animer(scene, cle);
    /* rangée 2 = marche vers le bas : le personnage nous fait face */
    const imageDeFace = manifest.directions.indexOf('down') * manifest.marche.nbImages;
    const s = scene.add.sprite(x, y, cle, imageDeFace);
    s.setOrigin(0.5, 0.9);
    if (echelle) s.setScale(echelle);
    s.animPrefix = cle;
    return s;
  }

  return {
    preloadManifest: preloadManifest, chargerCalques: chargerCalques,
    lookPnj: lookPnj, spriteFixe: spriteFixe,
    couleursDe: couleursDe, nomCouleur: nomCouleur, coloriser: coloriser,
    disponible: disponible, categories: categories,
    lookParDefaut: lookParDefaut, tirageAleatoire: tirageAleatoire,
    composer: composer, animer: animer, portrait: portrait,
    manifest: function () { return manifest; }
  };
})();
