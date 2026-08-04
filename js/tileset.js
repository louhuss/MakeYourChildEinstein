/* ============================================================
   TILESET.JS — le catalogue des tuiles Kenney.
   Les planches « Tiny Town » et « Tiny Farm » font 12 × 11
   tuiles de 16 px. Ici on donne un nom lisible à chaque numéro
   pour ne plus manipuler que du vocabulaire : T.HERBE, T.ARBRE…
   Licence des images : CC0 (Kenney) — usage libre, y compris
   commercial, sans attribution obligatoire.
   ============================================================ */

const Tileset = (function () {

  const SIZE = 16;
  const TOWN = 'town';      /* clef de la planche du village */
  const FARM = 'farm';      /* clef de la planche de la ferme */

  /* ---------- Tiny Town ---------- */
  const T = {
    /* sols */
    HERBE: 0, HERBE_BRINS: 1, HERBE_FLEURS: 2, HERBE_CAILLOUX: 43,
    TERRE: [40, 41, 42, 25],
    /* raccords herbe → terre (coins et bords du carré de terre) */
    BORD_NO: 12, BORD_N: 13, BORD_NE: 14,
    BORD_O: 24, BORD_CENTRE: 25, BORD_E: 26,
    BORD_SO: 36, BORD_S: 37, BORD_SE: 38,
    /* végétation : les arbres tiennent sur deux tuiles (haut + bas) */
    ARBRE_VERT: [4, 16], ARBRE_ROND: [5, 17], ARBRE_ORANGE: [3, 15],
    ARBRE_VERT2: [7, 19], ARBRE_ORANGE2: [10, 22],
    BUISSON: 5, CHAMPIGNONS: 29,
    /* clôtures */
    CLOTURE_H: [44, 45, 46], CLOTURE_V: [47, 59], CLOTURE_POTEAU: 56,
    CLOTURE_H2: [68, 69, 70], CLOTURE_BARRE: [80, 81, 82],
    PANNEAU: 83,
    /* murs et toits : maisons */
    MUR_BOIS: [72, 73, 75], MUR_GRIS: [76, 77, 79],
    MUR_FENETRE_GRIS: 51, MUR_FENETRE_ROUGE: 55,
    TOIT_GRIS: [48, 49, 50], TOIT_GRIS_BAS: [60, 61, 62], TOIT_GRIS_POINTE: 63,
    TOIT_ROUGE: [52, 53, 54], TOIT_ROUGE_BAS: [64, 65, 66], TOIT_ROUGE_POINTE: 67,
    PORTE_BOIS: 85, PORTE_BOIS2: 86, PORTE_GRISE: 84, PORTE_GRISE2: 89,
    ARCHE_BOIS: 74, ARCHE_GRISE: 78,
    /* pierre : musée, gare */
    PIERRE: [96, 97, 98], CRENEAU: [99, 100, 101, 102],
    PIERRE_CLAIRE: [108, 109, 110], DALLE: 126, ARCHE_PIERRE: [111, 112, 113, 114],
    /* objets */
    ECHELLE: 103, BOITE_LETTRES: 104, TONNEAU: 106, POT: 107,
    SAC_OR: 93, RUCHE: 94, CIBLE: 95, COFFRE: 130, COFFRE_OUVERT: 131,
    CLEF: 117, PIOCHE: 115, FOURCHE: 116, MARTEAU: 128
  };

  /* ---------- Tiny Farm ---------- */
  const F = {
    /* parcelles de terre labourée */
    PARCELLE: [0, 1, 12, 13, 24, 25, 36, 37],
    PARCELLE_LARGE: [48, 49, 50, 51, 60, 61, 62, 63],
    /* cultures : [jeune pousse, mûre] */
    CAROTTE: [5, 8], AUBERGINE: [17, 20], MAIS: [29, 32],
    TOMATE: [41, 44], CHOU: [53, 56], BLE: [65, 68],
    POUSSE: [4, 16, 28, 40, 52, 64],
    /* sacs de graines et cageots */
    SACHET: [9, 21, 33, 45, 57, 69], CAGEOT: [11, 23, 35, 47, 59, 71],
    /* outils et objets */
    ARROSOIR: 84, SEAU: 85, MARTEAU: 86, HACHE: 87, PANNEAU: 88, CAILLOUX: 89,
    FOIN: [96, 97], TOURNESOL: 83, BUISSON_BAIES: 78, HERBES: 80,
    /* animaux */
    MOUTON: 120, VACHE: 121, POULE: 122, RUCHE: 123, SAC: 125,
    /* bâtiments de ferme */
    GRANGE_MUR: [102, 103, 104], GRANGE_MUR2: [114, 115, 116],
    GRANGE_PORTE: [126, 127, 128],
    /* chemins dans l'herbe */
    CHEMIN: [93, 94, 95, 105, 106, 107, 117, 118, 119, 129, 131]
  };

  /* prend un élément au hasard dans une liste, ou la valeur si c'en est une */
  function one(v, seed) {
    if (!Array.isArray(v)) return v;
    if (seed === undefined) return v[Math.floor(Math.random() * v.length)];
    return v[Math.abs(Math.floor(seed)) % v.length];
  }

  /* chargement des planches : à appeler dans preload() */
  function preload(scene) {
    const base = 'assets/';
    scene.load.spritesheet(TOWN,
      base + 'kenney_tiny-town/Tilemap/tilemap_packed.png',
      { frameWidth: SIZE, frameHeight: SIZE });
    scene.load.spritesheet(FARM,
      base + 'kenney_tiny-farm/Tilemap/tilemap_packed.png',
      { frameWidth: SIZE, frameHeight: SIZE });
  }

  /* Correspondance entre les objets du jeu et les tuiles réelles.
     feuille : 'town' ou 'farm' ; cases : une ou plusieurs tuiles empilées
     de haut en bas ; l et h : encombrement sur la grille. */
  const DECOR = {
    tonneau:       { feuille: TOWN, cases: [106], l: 1, h: 1 },
    pot:           { feuille: TOWN, cases: [107], l: 1, h: 1 },
    coffre:        { feuille: TOWN, cases: [130], l: 1, h: 1 },
    panneau:       { feuille: TOWN, cases: [83],  l: 1, h: 1 },
    boite_lettres: { feuille: TOWN, cases: [104], l: 1, h: 1 },
    ruche:         { feuille: TOWN, cases: [94],  l: 1, h: 1 },
    buisson:       { feuille: TOWN, cases: [5],   l: 1, h: 1 },
    fleurs:        { feuille: TOWN, cases: [2],   l: 1, h: 1 },
    cloture:       { feuille: TOWN, cases: [44],  l: 1, h: 1 },
    arbre:         { feuille: TOWN, cases: [4, 16], l: 1, h: 2 },
    sapin:         { feuille: TOWN, cases: [3, 15], l: 1, h: 2 },
    ancre:         { feuille: TOWN, cases: [106], l: 1, h: 1 },
    foin:          { feuille: FARM, cases: [96],  l: 1, h: 1 },
    table:         { feuille: FARM, cases: [98],  l: 1, h: 1 },
    lit:           { feuille: FARM, cases: [100], l: 1, h: 1 },
    tournesol:     { feuille: FARM, cases: [83],  l: 1, h: 1 },
    cailloux:      { feuille: FARM, cases: [89],  l: 1, h: 1 },
    mouton:        { feuille: FARM, cases: [120], l: 1, h: 1 },
    vache:         { feuille: FARM, cases: [121], l: 1, h: 1 },
    poule:         { feuille: FARM, cases: [122], l: 1, h: 1 },
    carre_potager: { feuille: FARM, cases: [0],   l: 1, h: 1 },
    buisson2:      { feuille: FARM, cases: [78],  l: 1, h: 1 }
  };

  /* Tiny Town ne contient pas d'eau : on la dessine dans la même palette */
  function makeWater(scene) {
    const mk = function (key, draw) {
      if (scene.textures.exists(key)) return;
      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      draw(x);
      const tx = scene.textures.addCanvas(key, c);
      if (tx && tx.setFilter) tx.setFilter(Phaser.Textures.FilterMode.NEAREST);
    };
    const base = '#4a9dd8', fonce = '#3b82b8', clair = '#6fc0e8', mousse = '#cfeeff';
    for (let f = 0; f < 3; f++) {
      mk('eau' + f, function (x) {
        x.fillStyle = base; x.fillRect(0, 0, SIZE, SIZE);
        x.fillStyle = fonce;
        for (let i = 0; i < 14; i++) x.fillRect((i * 5 + f * 3) % SIZE, (i * 7 + f) % SIZE, 2, 1);
        x.fillStyle = clair;
        x.fillRect((2 + f * 4) % SIZE, 4, 5, 1);
        x.fillRect((9 + f * 3) % SIZE, 11, 4, 1);
      });
    }
    mk('eau_profonde', function (x) {
      x.fillStyle = fonce; x.fillRect(0, 0, SIZE, SIZE);
      x.fillStyle = '#2f6d9c';
      for (let i = 0; i < 12; i++) x.fillRect((i * 6) % SIZE, (i * 5) % SIZE, 2, 1);
    });
    for (let f = 0; f < 2; f++) {
      mk('ecume' + f, function (x) {
        x.clearRect(0, 0, SIZE, SIZE);
        x.fillStyle = mousse;
        for (let i = 0; i < SIZE; i += 2) x.fillRect(i, f, 2, 1 + ((i + f) % 2));
        x.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 1; i < SIZE; i += 4) x.fillRect(i, 2 + f, 2, 1);
      });
    }
  }

  return { SIZE: SIZE, TOWN: TOWN, FARM: FARM, T: T, F: F, DECOR: DECOR, one: one,
           preload: preload, makeWater: makeWater };
})();
