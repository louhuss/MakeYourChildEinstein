/* ============================================================
   ART.JS — la fabrique de pixel art.
   Tous les décors, bâtiments et personnages sont DESSINÉS en
   code, pixel par pixel, sur des petits canevas. Résultat :
   aucune image à télécharger, le jeu marche hors ligne, et
   chaque élément se modifie en changeant quelques lignes.
   ============================================================ */

const Art = (function () {

  const TILE = 32;

  /* ---------- palette ---------- */
  const P = {
    grass:  ['#6cb948', '#5aa33a', '#82d05c', '#4a8a2f'],
    dirt:   ['#c39a63', '#b08853', '#d4ae79', '#96703f'],
    sand:   ['#eddaa6', '#e0cb92', '#f6e8bd'],
    water:  ['#3fa4d6', '#2f8cbe', '#6cc6ea', '#8fdcf5'],
    wood:   ['#b07a45', '#8d5f34', '#c9975f'],
    plank:  ['#c9a06a', '#b08853', '#8d6a3e'],
    stone:  ['#9aa2ad', '#848c96', '#b3bac3'],
    wall:   ['#f2e9d8', '#e2d7c2', '#cbbfa6'],
    roofR:  ['#c9483c', '#a63a30', '#e0665a'],
    roofB:  ['#4a76c9', '#3a5da6', '#6f97e0'],
    roofG:  ['#4f9b58', '#3d7d45', '#6fbd78'],
    dark:   '#2f2838',
    glass:  ['#bfe3f5', '#8fc9e8']
  };

  function rnd(n) { return Math.floor(Math.random() * n); }

  /* Crée une texture nommée dans Phaser à partir d'un dessin */
  function make(scene, key, w, h, fn) {
    if (scene.textures.exists(key)) return;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    fn(x, w, h);
    const t = scene.textures.addCanvas(key, c);
    /* NEAREST = pas de lissage : les pixels restent nets une fois agrandis */
    if (t && t.setFilter) t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  function speck(x, w, h, color, n, x0, y0) {
    x.fillStyle = color;
    for (let i = 0; i < n; i++) {
      x.fillRect((x0 || 0) + rnd(w), (y0 || 0) + rnd(h), 1, 1);
    }
  }

  /* ============================================================
     TUILES DE SOL
     ============================================================ */
  function tiles(scene) {
    /* herbe : 3 variantes pour éviter l'effet damier */
    for (let v = 0; v < 3; v++) {
      make(scene, 'tile_grass' + v, TILE, TILE, function (x) {
        x.fillStyle = P.grass[0]; x.fillRect(0, 0, TILE, TILE);
        speck(x, TILE, TILE, P.grass[1], 60);
        speck(x, TILE, TILE, P.grass[2], 40);
        /* touffes */
        const n = v === 0 ? 2 : v === 1 ? 4 : 1;
        for (let i = 0; i < n; i++) {
          const tx = 3 + rnd(TILE - 8), ty = 4 + rnd(TILE - 8);
          x.fillStyle = P.grass[3];
          x.fillRect(tx, ty, 1, 4); x.fillRect(tx + 2, ty + 1, 1, 3);
          x.fillStyle = P.grass[2];
          x.fillRect(tx + 1, ty - 1, 1, 4);
        }
      });
    }

    make(scene, 'tile_path', TILE, TILE, function (x) {
      x.fillStyle = P.dirt[0]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, P.dirt[1], 70);
      speck(x, TILE, TILE, P.dirt[2], 50);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = P.stone[1];
        const px = 2 + rnd(26), py = 2 + rnd(26);
        x.fillRect(px, py, 3, 2);
        x.fillStyle = P.stone[2];
        x.fillRect(px, py, 2, 1);
      }
    });

    make(scene, 'tile_sand', TILE, TILE, function (x) {
      x.fillStyle = P.sand[0]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, P.sand[1], 60);
      speck(x, TILE, TILE, P.sand[2], 50);
    });

    make(scene, 'tile_water', TILE, TILE, function (x) {
      x.fillStyle = P.water[0]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, P.water[1], 70);
      x.fillStyle = P.water[2];
      x.fillRect(4, 8, 8, 1); x.fillRect(18, 20, 9, 1);
      x.fillStyle = P.water[3];
      x.fillRect(5, 7, 5, 1); x.fillRect(20, 19, 5, 1);
    });

    make(scene, 'tile_deep', TILE, TILE, function (x) {
      x.fillStyle = P.water[1]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, '#25789f', 70);
      x.fillStyle = P.water[0];
      x.fillRect(6, 12, 7, 1); x.fillRect(19, 24, 8, 1);
    });

    make(scene, 'tile_plank', TILE, TILE, function (x) {
      x.fillStyle = P.plank[0]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, P.plank[1], 40);
      x.fillStyle = P.plank[2];
      x.fillRect(0, 10, TILE, 1); x.fillRect(0, 21, TILE, 1);
      x.fillRect(12, 0, 1, 10); x.fillRect(22, 11, 1, 10); x.fillRect(6, 22, 1, 10);
    });

    make(scene, 'tile_stone', TILE, TILE, function (x) {
      x.fillStyle = P.stone[0]; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, P.stone[1], 50);
      x.strokeStyle = P.stone[1]; x.lineWidth = 1;
      x.strokeRect(0.5, 0.5, 15, 15); x.strokeRect(16.5, 0.5, 15, 15);
      x.strokeRect(0.5, 16.5, 15, 15); x.strokeRect(16.5, 16.5, 15, 15);
    });

    make(scene, 'tile_soil', TILE, TILE, function (x) {
      x.fillStyle = '#8a5f38'; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, '#7a5230', 60);
      x.fillStyle = '#9c6d42';
      for (let y = 3; y < TILE; y += 7) x.fillRect(0, y, TILE, 2);
    });

    make(scene, 'tile_soil_wet', TILE, TILE, function (x) {
      x.fillStyle = '#5f4126'; x.fillRect(0, 0, TILE, TILE);
      speck(x, TILE, TILE, '#4e351f', 60);
      x.fillStyle = '#6d4a2c';
      for (let y = 3; y < TILE; y += 7) x.fillRect(0, y, TILE, 2);
      speck(x, TILE, TILE, '#7fa8c9', 12);
    });

    make(scene, 'tile_carpet', TILE, TILE, function (x) {
      x.fillStyle = '#c96f8f'; x.fillRect(0, 0, TILE, TILE);
      x.fillStyle = '#e08fa9';
      for (let i = 0; i < TILE; i += 8) x.fillRect(i, 0, 4, TILE);
      x.fillStyle = '#a5556f'; x.fillRect(0, 0, TILE, 2); x.fillRect(0, 30, TILE, 2);
    });
  }


  /* ============================================================
     RACCORDS DE TERRAIN
     Dans les jeux type RPG Maker, deux sols ne se touchent jamais
     par un bord net : l'herbe déborde sur le sable, le sable
     déborde sur l'eau. On fabrique ici des bandes et des coins
     transparents que l'on pose PAR-DESSUS la tuile voisine.
     Chaque pièce est carrée : on la fait pivoter pour les 4 côtés.
     ============================================================ */
  function transitions(scene) {

    /* frange irrégulière le long du bord haut d'une tuile */
    function fringe(x, cols, depthPx, seedv) {
      let s = seedv * 7919;
      const rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      x.fillStyle = cols[0];
      for (let i = 0; i < TILE; i += 2) {
        const d = depthPx - 2 + Math.round(rnd() * 4);
        x.fillRect(i, 0, 2, d);
      }
      /* petites touffes qui dépassent */
      x.fillStyle = cols[2];
      for (let i = 0; i < 7; i++) {
        const px = Math.floor(rnd() * TILE);
        x.fillRect(px, depthPx - 1, 2, 2 + Math.round(rnd() * 3));
      }
      /* liseré clair sur l'arête */
      x.fillStyle = cols[2];
      for (let i = 0; i < TILE; i += 2) if (rnd() > 0.4) x.fillRect(i, 0, 2, 1);
      /* ombre douce sous la frange */
      x.fillStyle = 'rgba(40,50,30,0.16)';
      for (let i = 0; i < TILE; i += 2) x.fillRect(i, depthPx, 2, 2);
    }

    /* coin extérieur : un quart de tuile arrondi */
    function corner(x, cols, depthPx, seedv) {
      let s = seedv * 6151;
      const rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      x.fillStyle = cols[0];
      for (let i = 0; i < TILE; i += 2) {
        const dx = i / TILE;
        const d = Math.max(0, depthPx * (1 - dx * 1.6) + rnd() * 3);
        if (d > 0) x.fillRect(i, 0, 2, d);
      }
      x.fillStyle = cols[2];
      for (let i = 0; i < 4; i++) x.fillRect(Math.floor(rnd() * TILE * 0.5), Math.floor(rnd() * depthPx), 2, 2);
    }

    const kinds = {
      grass: { cols: P.grass, d: 11 },
      sand:  { cols: P.sand,  d: 9 },
      path:  { cols: P.dirt,  d: 8 }
    };
    Object.keys(kinds).forEach(function (k) {
      make(scene, 'edge_' + k, TILE, TILE, function (x) { fringe(x, kinds[k].cols, kinds[k].d, k.length + 3); });
      make(scene, 'corner_' + k, TILE, TILE, function (x) { corner(x, kinds[k].cols, kinds[k].d + 3, k.length + 5); });
    });

    /* écume : le liseré blanc là où la mer touche la terre */
    make(scene, 'edge_foam', TILE, TILE, function (x) {
      let s = 1234;
      const rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      x.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < TILE; i += 2) x.fillRect(i, 0, 2, 2 + Math.round(rnd() * 3));
      x.fillStyle = 'rgba(255,255,255,0.45)';
      for (let i = 0; i < TILE; i += 2) if (rnd() > 0.35) x.fillRect(i, 4, 2, 2);
      x.fillStyle = 'rgba(190,235,255,0.5)';
      for (let i = 0; i < TILE; i += 3) if (rnd() > 0.5) x.fillRect(i, 6, 2, 1);
    });

    /* ombre portée générique, à glisser sous les objets */
    make(scene, 'blob_shadow', 40, 20, function (x, w, h) {
      x.fillStyle = 'rgba(35,28,50,0.22)';
      x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(35,28,50,0.14)';
      x.beginPath(); x.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 7); x.fill();
    });
  }

  /* priorité des sols : un sol prioritaire déborde sur son voisin */
  const TERRAIN_RANK = { deep: 0, water: 1, sand: 2, path: 3, stone: 3, grass: 4 };

  /* ============================================================
     VÉGÉTATION ET PETIT DÉCOR
     ============================================================ */
  function nature(scene) {
    make(scene, 'tree_round', 64, 80, function (x) {
      /* tronc */
      x.fillStyle = P.wood[1]; x.fillRect(27, 50, 10, 28);
      x.fillStyle = P.wood[0]; x.fillRect(27, 50, 5, 28);
      x.fillStyle = P.wood[2]; x.fillRect(24, 62, 4, 3); x.fillRect(37, 56, 4, 3);
      /* feuillage */
      const blobs = [[32, 30, 26], [18, 40, 16], [46, 40, 16], [32, 16, 18], [20, 24, 13], [45, 25, 13]];
      x.fillStyle = '#3f8f38';
      blobs.forEach(function (b) { x.beginPath(); x.arc(b[0], b[1], b[2], 0, 7); x.fill(); });
      x.fillStyle = '#4fa844';
      blobs.forEach(function (b) { x.beginPath(); x.arc(b[0] - 2, b[1] - 3, b[2] - 3, 0, 7); x.fill(); });
      x.fillStyle = '#63c257';
      x.beginPath(); x.arc(26, 22, 12, 0, 7); x.fill();
      x.fillStyle = '#7ad86c';
      x.beginPath(); x.arc(24, 18, 6, 0, 7); x.fill();
      speck(x, 50, 44, '#2f7a2c', 40, 8, 10);
    });

    make(scene, 'tree_pine', 56, 84, function (x) {
      x.fillStyle = P.wood[1]; x.fillRect(24, 60, 8, 22);
      const layers = [[28, 58, 24], [28, 44, 20], [28, 31, 16], [28, 19, 11]];
      layers.forEach(function (l, i) {
        x.fillStyle = i % 2 ? '#2f7a3f' : '#37884a';
        x.beginPath();
        x.moveTo(l[0] - l[2], l[1] + 10); x.lineTo(l[0] + l[2], l[1] + 10); x.lineTo(l[0], l[1] - 10);
        x.closePath(); x.fill();
        x.fillStyle = i % 2 ? '#3d9450' : '#47a25c';
        x.beginPath();
        x.moveTo(l[0] - l[2] + 4, l[1] + 8); x.lineTo(l[0] + 2, l[1] + 8); x.lineTo(l[0] - 2, l[1] - 6);
        x.closePath(); x.fill();
      });
    });

    make(scene, 'tree_palm', 60, 80, function (x) {
      x.fillStyle = '#a87c4a';
      for (let i = 0; i < 9; i++) x.fillRect(28 + Math.sin(i / 3) * 4, 76 - i * 6, 7, 6);
      x.fillStyle = '#8d6538';
      for (let i = 0; i < 9; i++) x.fillRect(28 + Math.sin(i / 3) * 4, 76 - i * 6, 3, 6);
      const cx = 30, cy = 22;
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        x.fillStyle = a % 2 ? '#3f9b45' : '#4fb356';
        x.beginPath();
        x.ellipse(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 9, 15, 5, ang, 0, 7);
        x.fill();
      }
      x.fillStyle = '#7a4f2a';
      x.beginPath(); x.arc(cx, cy, 5, 0, 7); x.fill();
    });

    make(scene, 'bush', 36, 28, function (x) {
      x.fillStyle = '#3f8f38';
      [[10, 16, 10], [24, 16, 9], [17, 11, 11]].forEach(function (b) {
        x.beginPath(); x.arc(b[0], b[1], b[2], 0, 7); x.fill();
      });
      x.fillStyle = '#54a848';
      [[9, 13, 7], [23, 14, 6], [16, 8, 7]].forEach(function (b) {
        x.beginPath(); x.arc(b[0], b[1], b[2], 0, 7); x.fill();
      });
      speck(x, 30, 16, '#7ad86c', 14, 4, 6);
    });

    make(scene, 'rock', 30, 24, function (x) {
      x.fillStyle = P.stone[1];
      x.beginPath(); x.ellipse(15, 15, 13, 8, 0, 0, 7); x.fill();
      x.fillStyle = P.stone[0];
      x.beginPath(); x.ellipse(14, 13, 11, 6, 0, 0, 7); x.fill();
      x.fillStyle = P.stone[2];
      x.beginPath(); x.ellipse(12, 11, 6, 3, 0, 0, 7); x.fill();
    });

    const flowerCols = [['#e8503a', '#f5c542'], ['#f2f0e8', '#f5c542'], ['#e07fc0', '#fff2a8'],
                        ['#8f6fd8', '#fff2a8'], ['#f5a742', '#c96f2f']];
    flowerCols.forEach(function (c, i) {
      make(scene, 'flower' + i, 16, 18, function (x) {
        x.fillStyle = '#4f9b3a'; x.fillRect(7, 8, 2, 9);
        x.fillRect(4, 12, 3, 1); x.fillRect(9, 10, 3, 1);
        x.fillStyle = c[0];
        x.fillRect(5, 3, 6, 6); x.fillRect(4, 4, 8, 4); x.fillRect(3, 5, 10, 2);
        x.fillStyle = c[1]; x.fillRect(7, 5, 2, 2);
      });
    });

    make(scene, 'fence', 32, 26, function (x) {
      x.fillStyle = P.wood[1];
      x.fillRect(3, 6, 4, 20); x.fillRect(25, 6, 4, 20);
      x.fillRect(0, 10, 32, 3); x.fillRect(0, 18, 32, 3);
      x.fillStyle = P.wood[2];
      x.fillRect(3, 6, 2, 20); x.fillRect(25, 6, 2, 20);
      x.fillRect(0, 10, 32, 1); x.fillRect(0, 18, 32, 1);
    });

    make(scene, 'bench', 40, 28, function (x) {
      x.fillStyle = P.wood[1]; x.fillRect(4, 16, 32, 4); x.fillRect(6, 20, 3, 7); x.fillRect(31, 20, 3, 7);
      x.fillStyle = P.wood[2]; x.fillRect(4, 16, 32, 2);
      x.fillStyle = P.wood[1]; x.fillRect(6, 6, 28, 3); x.fillRect(6, 11, 28, 3);
      x.fillStyle = P.wood[0]; x.fillRect(6, 6, 28, 1); x.fillRect(6, 11, 28, 1);
    });

    make(scene, 'lamp', 18, 46, function (x) {
      x.fillStyle = '#4a4a55'; x.fillRect(7, 12, 4, 32);
      x.fillStyle = '#5f5f6b'; x.fillRect(7, 12, 2, 32);
      x.fillStyle = '#3a3a45'; x.fillRect(3, 42, 12, 4);
      x.fillStyle = '#f5d76e'; x.fillRect(4, 3, 10, 10);
      x.fillStyle = '#fff3c4'; x.fillRect(6, 5, 6, 6);
      x.fillStyle = '#3a3a45'; x.fillRect(3, 1, 12, 3);
    });

    make(scene, 'sign', 30, 34, function (x) {
      x.fillStyle = P.wood[1]; x.fillRect(13, 16, 4, 18);
      x.fillStyle = P.wood[0]; x.fillRect(2, 3, 26, 15);
      x.fillStyle = P.wood[2]; x.fillRect(2, 3, 26, 2);
      x.fillStyle = '#6b4526';
      x.fillRect(6, 8, 18, 2); x.fillRect(6, 12, 12, 2);
    });

    make(scene, 'crate', 28, 26, function (x) {
      x.fillStyle = P.wood[0]; x.fillRect(1, 4, 26, 21);
      x.fillStyle = P.wood[1]; x.fillRect(1, 4, 26, 2); x.fillRect(1, 23, 26, 2);
      x.fillRect(1, 4, 2, 21); x.fillRect(25, 4, 2, 21);
      x.fillStyle = P.wood[2]; x.fillRect(4, 12, 20, 2);
    });

    make(scene, 'buoy', 22, 22, function (x) {
      x.fillStyle = '#e8503a'; x.beginPath(); x.arc(11, 11, 10, 0, 7); x.fill();
      x.fillStyle = '#f2f0e8'; x.beginPath(); x.arc(11, 11, 6, 0, 7); x.fill();
      x.fillStyle = '#e8503a'; x.beginPath(); x.arc(11, 11, 3, 0, 7); x.fill();
    });

    make(scene, 'boat', 76, 52, function (x) {
      x.fillStyle = P.wood[1];
      x.beginPath(); x.moveTo(6, 30); x.lineTo(70, 30); x.lineTo(62, 46); x.lineTo(14, 46); x.closePath(); x.fill();
      x.fillStyle = P.wood[2];
      x.beginPath(); x.moveTo(8, 32); x.lineTo(68, 32); x.lineTo(64, 38); x.lineTo(12, 38); x.closePath(); x.fill();
      x.fillStyle = '#8d5f34'; x.fillRect(36, 4, 4, 27);
      x.fillStyle = '#f2ece0';
      x.beginPath(); x.moveTo(40, 6); x.lineTo(62, 28); x.lineTo(40, 28); x.closePath(); x.fill();
      x.fillStyle = '#dfd6c4';
      x.beginPath(); x.moveTo(40, 14); x.lineTo(52, 28); x.lineTo(40, 28); x.closePath(); x.fill();
      x.fillStyle = '#e8503a';
      x.beginPath(); x.moveTo(34, 6); x.lineTo(16, 18); x.lineTo(34, 26); x.closePath(); x.fill();
    });

    /* pousses de culture, 4 étapes */
    for (let s = 0; s < 4; s++) {
      make(scene, 'crop' + s, 32, 32, function (x) {
        if (s === 0) {
          x.fillStyle = '#6d4a2c'; x.fillRect(12, 20, 8, 4);
          x.fillStyle = '#8fd46a'; x.fillRect(15, 17, 2, 4);
        } else if (s === 1) {
          x.fillStyle = '#4f9b3a'; x.fillRect(15, 12, 2, 12);
          x.fillStyle = '#63bd4a'; x.fillRect(10, 15, 5, 2); x.fillRect(17, 18, 5, 2);
        } else {
          x.fillStyle = '#4f9b3a'; x.fillRect(15, 8, 2, 16);
          x.fillStyle = '#63bd4a';
          x.fillRect(8, 12, 7, 2); x.fillRect(17, 15, 7, 2); x.fillRect(9, 19, 6, 2);
          if (s === 3) {
            x.fillStyle = '#e8503a';
            x.beginPath(); x.arc(11, 12, 4, 0, 7); x.fill();
            x.beginPath(); x.arc(21, 16, 4, 0, 7); x.fill();
            x.fillStyle = '#ff8f7a'; x.fillRect(9, 10, 2, 2); x.fillRect(19, 14, 2, 2);
          }
        }
      });
    }
  }

  /* ============================================================
     BÂTIMENTS
     ============================================================ */
  function building(scene, key, w, h, wallCol, roofCol, opts) {
    opts = opts || {};
    make(scene, key, w, h, function (x) {
      const roofH = Math.floor(h * 0.42);
      /* murs */
      x.fillStyle = wallCol[0]; x.fillRect(4, roofH, w - 8, h - roofH - 2);
      x.fillStyle = wallCol[1];
      for (let y = roofH; y < h - 2; y += 6) x.fillRect(4, y, w - 8, 1);
      x.fillStyle = wallCol[2]; x.fillRect(4, h - 6, w - 8, 4);
      /* toit */
      x.fillStyle = roofCol[1];
      x.beginPath(); x.moveTo(0, roofH + 4); x.lineTo(w / 2, 2); x.lineTo(w, roofH + 4); x.closePath(); x.fill();
      x.fillStyle = roofCol[0];
      x.beginPath(); x.moveTo(2, roofH + 2); x.lineTo(w / 2, 4); x.lineTo(w - 2, roofH + 2); x.closePath(); x.fill();
      x.fillStyle = roofCol[2];
      for (let i = 6; i < w - 6; i += 8) {
        const t = Math.abs(i - w / 2) / (w / 2);
        x.fillRect(i, 6 + t * (roofH - 8), 4, 2);
      }
      /* porte */
      const dw = Math.max(16, Math.floor(w * 0.16)), dh = Math.floor((h - roofH) * 0.62);
      x.fillStyle = '#7a4f2a'; x.fillRect(w / 2 - dw / 2, h - dh - 2, dw, dh);
      x.fillStyle = '#8d5f34'; x.fillRect(w / 2 - dw / 2 + 2, h - dh, dw - 4, dh - 2);
      x.fillStyle = '#f5c542'; x.fillRect(w / 2 + dw / 2 - 6, h - dh / 2, 2, 2);
      /* fenêtres */
      const wy = roofH + 8;
      [w * 0.22, w * 0.78].forEach(function (wx) {
        x.fillStyle = '#7a4f2a'; x.fillRect(wx - 9, wy - 1, 18, 16);
        x.fillStyle = P.glass[1]; x.fillRect(wx - 7, wy + 1, 14, 12);
        x.fillStyle = P.glass[0]; x.fillRect(wx - 7, wy + 1, 7, 6);
        x.fillStyle = '#7a4f2a'; x.fillRect(wx - 1, wy + 1, 2, 12); x.fillRect(wx - 7, wy + 6, 14, 2);
      });
      /* enseigne */
      if (opts.sign) {
        x.fillStyle = '#6b4526'; x.fillRect(w / 2 - 22, roofH - 2, 44, 16);
        x.fillStyle = '#8d5f34'; x.fillRect(w / 2 - 20, roofH, 40, 12);
        x.font = '12px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(opts.sign, w / 2, roofH + 7);
      }
      if (opts.chimney) {
        x.fillStyle = '#a8564a'; x.fillRect(w - 26, 6, 12, roofH - 2);
        x.fillStyle = '#c46a5c'; x.fillRect(w - 26, 6, 12, 4);
      }
    });
  }

  function buildings(scene) {
    building(scene, 'b_bank', 148, 132, P.wall, P.roofB, { sign: '🏦', chimney: true });
    building(scene, 'b_shop', 132, 120, ['#f7e2c0', '#e8cfa8', '#cfb68e'], P.roofR, { sign: '🛍️' });
    building(scene, 'b_farm', 140, 124, ['#f2d9b0', '#e2c69a', '#c9ab7c'], P.roofG, { sign: '🌾', chimney: true });
    building(scene, 'b_museum', 150, 130, P.stone, ['#8a6fc9', '#6f57a6', '#a68fe0'], { sign: '🏛️' });
    building(scene, 'b_observatory', 120, 130, P.wall, ['#3f5f8f', '#2f4a75', '#5f83b8'], { sign: '🔭' });
    building(scene, 'b_station', 156, 118, ['#e0d6c4', '#cfc4b0', '#b8ac96'], ['#c98f3f', '#a8742f', '#e0aa5f'], { sign: '🚂' });
    building(scene, 'b_home', 124, 116, ['#f7ece0', '#e8dccb', '#cfc2ae'], P.roofR, { sign: '🏠', chimney: true });
    building(scene, 'b_hut', 108, 100, P.plank, ['#7a9bb8', '#5f7d99', '#9ab8d0'], { sign: '⚓' });

    /* dôme de l'observatoire, posé par-dessus */
    make(scene, 'dome', 70, 44, function (x) {
      x.fillStyle = '#8fa8c4';
      x.beginPath(); x.arc(35, 40, 32, Math.PI, 0); x.fill();
      x.fillStyle = '#a8c0d8';
      x.beginPath(); x.arc(30, 40, 26, Math.PI, 0); x.fill();
      x.fillStyle = '#2f3a4a'; x.fillRect(32, 8, 8, 32);
      x.fillStyle = '#5f6f85'; x.fillRect(0, 38, 70, 6);
    });
  }

  /* ============================================================
     PERSONNAGES — planche d'animation 4 directions x 4 images
     ============================================================ */
  const SKINS = ['#ffddb8', '#f3c396', '#e8ad7c', '#d2925f', '#b87445', '#945a33', '#6f4326', '#4d2e1a'];
  const HAIRS = ['#241812', '#4a2f1c', '#7a4f2a', '#a9762f', '#d8a94a', '#efe0b6',
                 '#c0392b', '#9a9a9a', '#6f43c9', '#2f9fd8', '#ef6fb0', '#3fb85f'];
  const CLOTH = ['#d23f30', '#e8842f', '#f5c542', '#5fbf46', '#2fa88f', '#3d7fd8',
                 '#6b5bd6', '#a54fc0', '#ef6fb0', '#efece4', '#40434f', '#8a5a3c'];
  const HAIRSTYLES = ['court', 'carre', 'milong', 'long', 'couettes', 'queue',
                      'boucle', 'afro', 'crete', 'chignon', 'tresses', 'chauve'];
  const OUTFITS = ['tshirt', 'pull', 'raye', 'capuche', 'gilet', 'tunique',
                   'robe', 'salopette', 'marin'];
  const HATS = ['aucun', 'casquette', 'paille', 'bandeau', 'bonnet',
                'chapeau', 'couronne', 'casque'];
  const GLASSES = ['aucune', 'rondes', 'carrees', 'soleil'];

  const CW = 16, CH = 24;   /* taille d'une case (à l'échelle des tuiles Kenney) */

  function lighter(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + amt);
    const g = Math.min(255, ((n >> 8) & 255) + amt);
    const b = Math.min(255, (n & 255) + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function darker(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, r - amt); g = Math.max(0, g - amt); b = Math.max(0, b - amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* Ajoute un contour foncé autour de la silhouette, comme les tuiles
     Kenney : on repère les pixels vides collés à un pixel plein. */
  function contour(ctx, w, h, couleur) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const plein = (px, py) => {
      if (px < 0 || py < 0 || px >= w || py >= h) return false;
      return d[(py * w + px) * 4 + 3] > 40;
    };
    const cible = [];
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (plein(px, py)) continue;
        if (plein(px - 1, py) || plein(px + 1, py) || plein(px, py - 1) || plein(px, py + 1)) {
          cible.push([px, py]);
        }
      }
    }
    ctx.fillStyle = couleur;
    cible.forEach(p => ctx.fillRect(p[0], p[1], 1, 1));
  }

  function drawChar(x, ox, oy, dir, frame, look) {
    const skin = SKINS[look.skin % SKINS.length];
    const hair = HAIRS[look.hairColor % HAIRS.length];
    const cloth = CLOTH[(look.cloth === undefined ? 5 : look.cloth) % CLOTH.length];
    const pants = CLOTH[(look.pants === undefined ? 10 : look.pants) % CLOTH.length];
    const shoes = darker(CLOTH[(look.shoes === undefined ? 11 : look.shoes) % CLOTH.length], 45);
    const style = HAIRSTYLES[(look.hair || 0) % HAIRSTYLES.length];
    const outfit = OUTFITS[(look.outfit || 0) % OUTFITS.length];
    const hat = look.hat || 'aucun';

    const ENCRE = '#3b2b33';
    const OMBRE = 'rgba(0,0,0,0.22)';

    /* ombre au sol, dessinée directement (elle ne doit pas être contournée) */
    x.fillStyle = OMBRE;
    x.beginPath(); x.ellipse(ox + 8, oy + 22, 4.5, 1.5, 0, 0, 7); x.fill();

    /* on dessine le personnage à part pour pouvoir l'entourer */
    const buf = document.createElement('canvas');
    buf.width = CW; buf.height = CH;
    const c = buf.getContext('2d');
    c.imageSmoothingEnabled = false;
    const px = (a2, b, w, h, col) => { c.fillStyle = col; c.fillRect(a2, b, w, h); };

    const sw = [0, 1, 0, -1][frame];
    const dSkin = darker(skin, 30), dCloth = darker(cloth, 34), dPants = darker(pants, 30);

    /* jambes */
    px(5, 17 + Math.max(0, sw), 3, 4, pants);
    px(8, 17 + Math.max(0, -sw), 3, 4, pants);
    px(5, 17 + Math.max(0, sw), 1, 4, dPants);
    px(8, 17 + Math.max(0, -sw), 1, 4, dPants);
    px(5, 20 + Math.max(0, sw), 3, 2, shoes);
    px(8, 20 + Math.max(0, -sw), 3, 2, shoes);

    /* buste */
    if (outfit === 'robe') {
      px(5, 11, 6, 4, cloth); px(4, 15, 8, 3, cloth);
      px(4, 17, 8, 1, dCloth);
    } else {
      px(5, 11, 6, 6, cloth);
      px(5, 16, 6, 1, dCloth);                 /* ourlet */
      if (outfit === 'pull') px(5, 11, 6, 1, dCloth);
      if (outfit === 'marin') { px(5, 13, 6, 1, '#f2ece0'); px(5, 15, 6, 1, '#f2ece0'); }
      if (outfit === 'raye') { px(5, 12, 6, 1, dCloth); px(5, 14, 6, 1, dCloth); px(5, 16, 6, 1, dCloth); }
      if (outfit === 'salopette') { px(6, 12, 4, 5, pants); px(5, 11, 1, 3, pants); px(10, 11, 1, 3, pants); }
      if (outfit === 'capuche') {
        px(5, 11, 6, 1, dCloth);
        px(4, 8, 8, 3, cloth);                 /* capuche rabattue derrière la tête */
        px(4, 8, 8, 1, lighter(cloth, 18));
      }
      if (outfit === 'gilet') {
        px(5, 11, 6, 6, '#f2ece0');
        px(5, 11, 2, 6, cloth); px(9, 11, 2, 6, cloth);
        px(5, 16, 6, 1, dCloth);
        px(7, 12, 1, 1, '#f5c542');
      }
      if (outfit === 'tunique') {
        px(4, 15, 8, 3, cloth);
        px(4, 17, 8, 1, dCloth);
        px(7, 11, 2, 4, lighter(cloth, 16));   /* col en V */
      }
    }

    /* bras, séparés du buste par une ligne plus foncée */
    const brasG = 12 - Math.max(0, -sw), brasD = 12 - Math.max(0, sw);
    px(3, brasG, 2, 4, dir === 'up' ? cloth : skin);
    px(11, brasD, 2, 4, dir === 'up' ? cloth : skin);
    if (outfit === 'pull') { px(3, brasG, 2, 3, cloth); px(11, brasD, 2, 3, cloth); }
    else if (outfit !== 'robe') { px(3, brasG, 2, 1, cloth); px(11, brasD, 2, 1, cloth); }
    px(4, brasG, 1, 4, 'rgba(0,0,0,0.18)');
    px(11, brasD, 1, 4, 'rgba(0,0,0,0.18)');

    /* tête, avec un peu de relief */
    px(3, 3, 10, 8, skin);
    px(3, 10, 10, 1, dSkin);                   /* menton dans l'ombre */
    px(3, 3, 1, 8, darker(skin, 14));          /* côté gauche */
    px(12, 3, 1, 8, darker(skin, 8));
    px(2, 6, 1, 2, dSkin); px(13, 6, 1, 2, dSkin);   /* oreilles */

    /* visage */
    if (dir === 'down') {
      px(5, 6, 2, 2, ENCRE); px(9, 6, 2, 2, ENCRE);
      px(5, 6, 1, 1, '#ffffff'); px(9, 6, 1, 1, '#ffffff');
      px(7, 9, 2, 1, '#a5544a');
      px(4, 8, 1, 1, 'rgba(226,116,116,0.5)'); px(11, 8, 1, 1, 'rgba(226,116,116,0.5)');
    } else if (dir === 'left') {
      px(4, 6, 2, 2, ENCRE); px(4, 9, 2, 1, '#a5544a');
    } else if (dir === 'right') {
      px(10, 6, 2, 2, ENCRE); px(10, 9, 2, 1, '#a5544a');
    }

    /* cheveux, avec une mèche plus claire sur le dessus */
    const clair = lighter(hair, 26);
    const H = (a2, b, w, h) => px(a2, b, w, h, hair);
    H(3, 2, 10, 3);
    px(4, 2, 6, 1, clair);
    if (dir === 'down') { H(3, 5, 1, 3); H(12, 5, 1, 3); }
    if (dir === 'up') { H(3, 2, 10, 8); px(4, 3, 7, 1, clair); }
    if (dir === 'left') { H(3, 2, 10, 4); H(10, 5, 3, 4); }
    if (dir === 'right') { H(3, 2, 10, 4); H(3, 5, 3, 4); }

    if (style === 'carre') { H(2, 5, 1, 4); H(13, 5, 1, 4); H(3, 8, 10, 1); }
    if (style === 'queue') { H(2, 4, 1, 3); H(13, 4, 1, 3);
      if (dir !== 'down') px(dir === 'left' ? 13 : 2, 5, 2, 6, hair); }
    if (style === 'boucle') { H(2, 1, 12, 4); H(1, 3, 14, 3);
      px(3, 1, 3, 1, clair); px(9, 2, 3, 1, clair); }
    if (style === 'chauve') { px(3, 2, 10, 3, skin); px(4, 2, 7, 1, lighter(skin, 12)); }
    if (style === 'milong') { H(2, 5, 1, 5); H(13, 5, 1, 5); }
    if (style === 'long') { H(2, 5, 1, 9); H(13, 5, 1, 9); H(4, 11, 8, 2); px(4, 11, 8, 1, darker(hair, 18)); }
    if (style === 'couettes') { H(1, 5, 2, 3); H(13, 5, 2, 3); H(1, 8, 1, 2); H(14, 8, 1, 2); }
    if (style === 'afro') { H(2, 0, 12, 5); H(1, 2, 14, 3); px(3, 0, 5, 1, clair); }
    if (style === 'crete') { px(3, 2, 10, 3, skin); H(7, 0, 2, 5); px(7, 0, 1, 2, clair); }
    if (style === 'chignon') { H(6, 0, 4, 3); px(7, 0, 2, 1, clair); }
    if (style === 'tresses') { H(2, 5, 1, 8); H(13, 5, 1, 8); px(2, 12, 1, 1, '#f5c542'); px(13, 12, 1, 1, '#f5c542'); }

    /* chapeaux */
    if (hat === 'casquette') {
      px(3, 1, 10, 3, cloth); px(3, 1, 10, 1, lighter(cloth, 22));
      px(2, 4, 12, 1, darker(cloth, 40));
      if (dir === 'down') px(4, 5, 8, 1, darker(cloth, 50));
    } else if (hat === 'paille') {
      px(1, 3, 14, 2, '#d8a94a'); px(1, 3, 14, 1, '#e8bd63');
      px(4, 0, 8, 3, '#e0b45a'); px(4, 2, 8, 1, '#c0392b');
    } else if (hat === 'couronne') {
      px(4, 1, 8, 2, '#f5c542'); px(4, 1, 8, 1, '#ffe08a');
      px(4, 0, 1, 1, '#f5c542'); px(7, 0, 2, 1, '#f5c542'); px(11, 0, 1, 1, '#f5c542');
    } else if (hat === 'bandeau') {
      px(2, 4, 12, 2, cloth);
      px(2, 4, 12, 1, lighter(cloth, 25));
      px(12, 4, 2, 4, cloth);
    } else if (hat === 'chapeau') {
      px(1, 4, 14, 1, darker(cloth, 25));
      px(2, 3, 12, 2, cloth);
      px(4, 0, 8, 4, cloth);
      px(4, 0, 8, 1, lighter(cloth, 20));
      px(4, 2, 8, 1, darker(cloth, 35));
    } else if (hat === 'casque') {
      px(3, 1, 10, 4, '#b9bcc4');
      px(3, 1, 10, 1, '#d7dae0');
      px(2, 5, 12, 1, '#9aa0ab');
      if (dir === 'down') px(6, 5, 4, 1, '#9aa0ab');
      px(7, 0, 2, 2, '#d23f30');
    } else if (hat === 'bonnet') {
      px(3, 0, 10, 4, cloth); px(3, 0, 10, 1, lighter(cloth, 22));
      px(2, 4, 12, 1, '#efece4'); px(7, 0, 2, 1, '#efece4');
    }

    /* lunettes */
    if (look.glasses && look.glasses !== 'aucune' && dir === 'down') {
      const g = look.glasses;
      if (g === 'soleil') {
        px(4, 6, 3, 2, '#1f2430'); px(9, 6, 3, 2, '#1f2430'); px(7, 6, 2, 1, '#1f2430');
        px(4, 6, 1, 1, '#5f6b7a'); px(9, 6, 1, 1, '#5f6b7a');
      } else if (g === 'carrees') {
        px(3, 5, 4, 3, ENCRE); px(9, 5, 4, 3, ENCRE);
        px(4, 6, 2, 1, '#bfe3f5'); px(10, 6, 2, 1, '#bfe3f5');
        px(7, 6, 2, 1, ENCRE);
      } else {
        px(4, 6, 3, 2, ENCRE); px(9, 6, 3, 2, ENCRE);
        px(5, 6, 1, 1, '#bfe3f5'); px(10, 6, 1, 1, '#bfe3f5');
        px(7, 6, 2, 1, ENCRE);
      }
    }

    contour(c, CW, CH, ENCRE);
    x.drawImage(buf, ox, oy);
  }

  /* Crée la planche d'animation d'un personnage */
  const charSig = {};
  function character(scene, key, look) {
    /* on ne redessine la planche que si l'apparence a vraiment changé :
       le village recrée 9 personnages à chaque retour de mission */
    const sig = JSON.stringify(look);
    if (scene.textures.exists(key)) {
      if (charSig[key] === sig) return key;
      scene.textures.remove(key);
    }
    charSig[key] = sig;
    const dirs = ['down', 'left', 'right', 'up'];
    const c = document.createElement('canvas');
    c.width = CW * 4; c.height = CH * 4;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    dirs.forEach(function (d, row) {
      for (let f = 0; f < 4; f++) drawChar(x, f * CW, row * CH, d, f, look);
    });
    scene.textures.addCanvas(key, c);
    /* découpe en images */
    const tex = scene.textures.get(key);
    if (tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    let i = 0;
    for (let row = 0; row < 4; row++) {
      for (let f = 0; f < 4; f++) {
        tex.add(i++, 0, f * CW, row * CH, CW, CH);
      }
    }
    return key;
  }

  /* portrait carré pour les dialogues (rendu en base64 pour le HTML) */
  const portraitCache = {};
  function portrait(look, bg) {
    const ck = JSON.stringify(look) + '|' + (bg || '');
    if (portraitCache[ck]) return portraitCache[ck];
    const S = 96, k = 5;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = bg || '#8fd0f0'; x.fillRect(0, 0, S, S);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 66, S, S - 66);
    x.save();
    x.scale(k, k);
    /* on centre et on cadre sur la tête et le buste */
    x.translate((S / k - CW) / 2, 0);
    drawChar(x, 0, 0, 'down', 0, look);
    x.restore();
    portraitCache[ck] = c.toDataURL();
    return portraitCache[ck];
  }

  /* aperçu en grand du personnage (pour l'écran de création) */
  function preview(look, scale, dir) {
    scale = scale || 5;
    const c = document.createElement('canvas');
    c.width = CW * scale; c.height = CH * scale;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.save();
    x.scale(scale, scale);
    drawChar(x, 0, 0, dir || 'down', 0, look);
    x.restore();
    return c.toDataURL();
  }

  /* icônes de l'encyclopédie et de l'interface */
  function icons(scene) {
    const draw = {
      vague: function (x) { x.fillStyle = '#3fa4d6'; x.fillRect(2, 14, 28, 14); x.fillStyle = '#6cc6ea'; x.fillRect(2, 12, 10, 3); x.fillRect(16, 15, 12, 3); },
      poisson: function (x) { x.fillStyle = '#e8842f'; x.beginPath(); x.ellipse(16, 16, 11, 7, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(26, 16); x.lineTo(31, 10); x.lineTo(31, 22); x.fill(); x.fillStyle = '#2f2838'; x.fillRect(9, 13, 2, 2); },
      dechet: function (x) { x.fillStyle = '#9aa6b5'; x.fillRect(9, 10, 14, 18); x.fillStyle = '#b3bec9'; x.fillRect(7, 6, 18, 4); },
      fruit: function (x) { x.fillStyle = '#d23f30'; x.beginPath(); x.arc(16, 19, 10, 0, 7); x.fill(); x.fillStyle = '#4f9b3a'; x.fillRect(15, 6, 2, 6); x.fillRect(17, 7, 6, 3); },
      legume: function (x) { x.fillStyle = '#e8842f'; x.beginPath(); x.moveTo(16, 30); x.lineTo(11, 12); x.lineTo(21, 12); x.fill(); x.fillStyle = '#4f9b3a'; x.fillRect(13, 4, 3, 8); x.fillRect(17, 5, 3, 7); },
      abeille: function (x) { x.fillStyle = '#f5c542'; x.beginPath(); x.ellipse(16, 18, 9, 7, 0, 0, 7); x.fill(); x.fillStyle = '#2f2838'; x.fillRect(12, 12, 2, 12); x.fillRect(18, 12, 2, 12); x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.ellipse(11, 10, 5, 3, 0, 0, 7); x.fill(); },
      graine: function (x) { x.fillStyle = '#8a5f38'; x.beginPath(); x.ellipse(16, 20, 6, 8, 0, 0, 7); x.fill(); x.fillStyle = '#4f9b3a'; x.fillRect(15, 6, 2, 8); },
      soleil: function (x) { x.fillStyle = '#f5c542'; x.beginPath(); x.arc(16, 16, 8, 0, 7); x.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; x.fillRect(16 + Math.cos(a) * 12 - 1, 16 + Math.sin(a) * 12 - 1, 3, 3); } },
      etoile: function (x) { x.fillStyle = '#f5c542'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -1.57 + i * 0.628, r = i % 2 ? 5 : 12; x.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } x.fill(); },
      livre: function (x) { x.fillStyle = '#c0392b'; x.fillRect(5, 7, 22, 19); x.fillStyle = '#f2ece0'; x.fillRect(8, 9, 16, 15); x.fillStyle = '#c9c0ae'; x.fillRect(15, 9, 2, 15); },
      monde: function (x) { x.fillStyle = '#3d7fd8'; x.beginPath(); x.arc(16, 16, 11, 0, 7); x.fill(); x.fillStyle = '#5fbf46'; x.fillRect(8, 12, 7, 5); x.fillRect(17, 17, 6, 4); x.fillRect(15, 8, 4, 3); },
      coeur: function (x) { x.fillStyle = '#e8503a'; x.beginPath(); x.arc(11, 13, 6, 0, 7); x.arc(21, 13, 6, 0, 7); x.moveTo(4, 15); x.lineTo(16, 29); x.lineTo(28, 15); x.fill(); }
    };
    Object.keys(draw).forEach(function (k) { make(scene, 'ico_' + k, 32, 32, draw[k]); });
  }

  function particles(scene) {
    make(scene, 'spark', 8, 8, function (x) {
      x.fillStyle = '#fff3c4'; x.fillRect(3, 0, 2, 8); x.fillRect(0, 3, 8, 2);
      x.fillStyle = '#ffffff'; x.fillRect(3, 3, 2, 2);
    });
    make(scene, 'drop', 8, 10, function (x) {
      x.fillStyle = '#6cc6ea'; x.fillRect(2, 2, 4, 7); x.fillRect(3, 0, 2, 3);
      x.fillStyle = '#bfe3f5'; x.fillRect(2, 3, 2, 3);
    });
    make(scene, 'leafp', 10, 8, function (x) {
      x.fillStyle = '#5fbf46'; x.beginPath(); x.ellipse(5, 4, 5, 3, 0.4, 0, 7); x.fill();
    });
  }

  function init(scene) {
    tiles(scene);
    transitions(scene);
    nature(scene);
    buildings(scene);
    icons(scene);
    particles(scene);
  }

  return {
    TILE: TILE, CW: CW, CH: CH, init: init, make: make,
    character: character, portrait: portrait, preview: preview, drawChar: drawChar,
    TERRAIN_RANK: TERRAIN_RANK,
    SKINS: SKINS, HAIRS: HAIRS, CLOTH: CLOTH,
    HAIRSTYLES: HAIRSTYLES, OUTFITS: OUTFITS, HATS: HATS, GLASSES: GLASSES, P: P
  };
})();
