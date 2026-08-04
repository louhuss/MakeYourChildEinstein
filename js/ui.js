/* ============================================================
   UI.JS — toute l'interface en HTML par-dessus le jeu.
   Barre d'état, dialogues, banque, boutiques, encyclopédie,
   inventaire, espace parent et réglages.
   ============================================================ */

const UI = (function () {

  let root, hud, dialogue, toastBox, modal;
  let dialogueQueue = null, dialogueIndex = 0, dialogueDone = null, typing = null;
  let onCloseModal = null;
  const speak = { voices: null };

  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function euro(n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }

  /* ---------- lecture audio des textes (optionnelle) ---------- */
  function readAloud(text) {
    const s = State.get().settings;
    if (!s.voice || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR'; u.rate = 0.95; u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (e) { }
  }
  function stopReading() { try { window.speechSynthesis.cancel(); } catch (e) { } }

  /* ============================================================
     MISE EN PLACE
     ============================================================ */
  function init() {
    root = document.getElementById('ui');

    /* --- barre d'état --- */
    hud = h('div', 'hud hidden');
    hud.innerHTML =
      '<div class="hud-left">' +
        '<img id="hud-portrait" class="portrait" alt="">' +
        '<div class="hud-info">' +
          '<div id="hud-name">…</div>' +
          '<div class="xpbar"><i id="hud-xp"></i></div>' +
          '<div id="hud-level" class="tiny">Petit Curieux</div>' +
        '</div>' +
      '</div>' +
      '<div class="hud-right">' +
        '<div class="chip" title="Piécettes gagnées dans les missions">🪙 <b id="hud-points">0</b></div>' +
        '<div class="chip" title="Argent de poche">💶 <b id="hud-money">0</b></div>' +
        '<button class="icobtn" id="hud-inv" title="Inventaire">🎒</button>' +
        '<button class="icobtn" id="hud-ency" title="Encyclopédie">📖</button>' +
        '<button class="icobtn" id="hud-map" title="Carte">🗺️</button>' +
        '<button class="icobtn" id="hud-set" title="Réglages">⚙️</button>' +
      '</div>' +
      '<div id="hud-quest" class="quest"></div>';
    root.appendChild(hud);

    /* --- dialogue --- */
    dialogue = h('div', 'dialogue hidden');
    dialogue.innerHTML =
      '<img id="dlg-portrait" class="portrait big" alt="">' +
      '<div class="dlg-body">' +
        '<div class="dlg-name"><span id="dlg-name">…</span>' +
          '<button class="icobtn small" id="dlg-listen" title="Écouter">🔊</button>' +
          '<button class="icobtn small" id="dlg-again" title="Répéter">🔁</button>' +
        '</div>' +
        '<p id="dlg-text"></p>' +
        '<div id="dlg-choices" class="choices"></div>' +
        '<div class="dlg-next">Clique pour continuer ▸</div>' +
      '</div>';
    root.appendChild(dialogue);

    toastBox = h('div', 'toasts');
    root.appendChild(toastBox);

    modal = h('div', 'modal hidden');
    modal.innerHTML = '<div class="sheet"><header><h2 id="modal-title"></h2>' +
      '<button class="closebtn" id="modal-close">✕</button></header>' +
      '<div class="sheet-body" id="modal-body"></div></div>';
    root.appendChild(modal);

    document.getElementById('modal-close').onclick = closeModal;
    /* Échap ferme la fenêtre ouverte, ou passe le dialogue */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!modal.classList.contains('hidden')) closeModal();
      else if (!dialogue.classList.contains('hidden')) endSay();
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    dialogue.addEventListener('click', function (e) {
      if (e.target.closest('#dlg-listen') || e.target.closest('#dlg-again') ||
          e.target.closest('.choices')) return;
      nextLine();
    });
    document.getElementById('dlg-listen').onclick = function () {
      readAloud(document.getElementById('dlg-text').textContent);
    };
    document.getElementById('dlg-again').onclick = function () {
      if (dialogueQueue) { dialogueIndex = Math.max(0, dialogueIndex - 1); showLine(); }
    };

    document.getElementById('hud-inv').onclick = openInventory;
    document.getElementById('hud-ency').onclick = openEncyclopedia;
    document.getElementById('hud-map').onclick = openMap;
    document.getElementById('hud-set').onclick = openSettings;

    State.onChange(refreshHud);
  }

  /* ============================================================
     BARRE D'ÉTAT
     ============================================================ */
  function showHud(on) { hud.classList.toggle('hidden', !on); if (on) refreshHud(); }
  function refreshHud() {
    const d = State.get();
    if (!d) return;
    const lv = State.level();
    const p = document.getElementById('hud-portrait');
    p.src = Art.portrait(d.child.look);
    document.getElementById('hud-name').textContent = d.child.name || 'Explorateur';
    document.getElementById('hud-level').textContent = lv.name;
    document.getElementById('hud-xp').style.width = Math.round(lv.progress * 100) + '%';
    document.getElementById('hud-points').textContent = d.points;
    document.getElementById('hud-money').textContent = euro(d.money);
  }
  function setQuest(text) {
    const q = document.getElementById('hud-quest');
    q.innerHTML = text ? '<b>Mission :</b> ' + text : '';
    q.classList.toggle('on', !!text);
  }

  /* ============================================================
     DIALOGUES
     ============================================================ */
  function say(name, portrait, lines, done, choices) {
    dialogueQueue = lines.slice();
    dialogueIndex = 0;
    dialogueDone = done || null;
    dialogue.classList.remove('hidden');
    document.getElementById('dlg-name').textContent = name || '';
    const img = document.getElementById('dlg-portrait');
    if (portrait) { img.src = portrait; img.style.display = ''; } else { img.style.display = 'none'; }
    dialogue._choices = choices || null;
    showLine();
  }
  function showLine() {
    const txt = dialogueQueue[dialogueIndex] || '';
    const box = document.getElementById('dlg-text');
    document.getElementById('dlg-choices').innerHTML = '';
    clearInterval(typing);
    box.textContent = '';
    let i = 0;
    typing = setInterval(function () {
      box.textContent = txt.slice(0, ++i);
      if (i >= txt.length) clearInterval(typing);
    }, 18);
    if (State.get().settings.voice) readAloud(txt);
  }
  function nextLine() {
    const box = document.getElementById('dlg-text');
    if (!dialogueQueue) return;
    if (box.textContent.length < (dialogueQueue[dialogueIndex] || '').length) {
      clearInterval(typing);
      box.textContent = dialogueQueue[dialogueIndex];
      return;
    }
    dialogueIndex++;
    if (dialogueIndex >= dialogueQueue.length) {
      if (dialogue._choices) { showChoices(); return; }
      endSay();
    } else showLine();
  }
  function showChoices() {
    const box = document.getElementById('dlg-choices');
    box.innerHTML = '';
    document.querySelector('.dlg-next').style.display = 'none';
    dialogue._choices.forEach(function (c) {
      const b = h('button', 'btn small', c.label);
      b.onclick = function (e) {
        e.stopPropagation();
        const fn = c.action; endSay(); if (fn) fn();
      };
      box.appendChild(b);
    });
  }
  function endSay() {
    clearInterval(typing);
    stopReading();
    dialogue.classList.add('hidden');
    document.querySelector('.dlg-next').style.display = '';
    dialogueQueue = null;
    dialogue._choices = null;
    const fn = dialogueDone; dialogueDone = null;
    if (fn) fn();
  }

  /* ============================================================
     MESSAGES ET RÉCOMPENSES
     ============================================================ */
  function toast(text, kind) {
    const t = h('div', 'toast ' + (kind || ''), text);
    toastBox.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2400);
    setTimeout(function () { t.remove(); }, 3000);
  }

  /* Affiche l'écran de récompenses. N'attribue rien : c'est la scène
     qui a déjà crédité les points, badges et objets. */
  function rewardPanel(r, onClose) {
    let html = '<div class="rewards">';
    if (r.points) html += '<div class="rw"><span class="rw-ico">🪙</span><b>+' + r.points + '</b><small>piécettes</small></div>';
    if (r.badge) {
      const b = State.badgeById(r.badge);
      if (b) html += '<div class="rw"><span class="rw-ico">' + b.emoji + '</span><b>' + b.name + '</b><small>nouveau badge</small></div>';
    }
    if (r.item) {
      const it = GameData.decorItems.filter(function (d) { return d.id === r.item; })[0];
      if (it) html += '<div class="rw"><span class="rw-ico">' + it.emoji + '</span><b>' + it.name + '</b><small>pour ton terrain</small></div>';
    }
    html += '</div>';
    if (r.ency && r.ency.length) {
      html += '<h3 class="sub">📖 Nouvelles fiches dans ton carnet</h3><div class="cards">';
      r.ency.forEach(function (id) {
        const e = GameData.encyclopedia.filter(function (x) { return x.id === id; })[0];
        if (!e) return;
        html += '<div class="card"><b>' + e.title + '</b><p>' + e.text + '</p>' +
                '<p class="wow">' + e.wow + '</p></div>';
      });
      html += '</div>';
    }
    html += '<div class="sticky"><button class="btn big" id="rw-ok">Super !</button></div>';
    openModal(r.title || 'Bravo !', html, onClose);
    document.getElementById('rw-ok').onclick = closeModal;
    burst();
  }

  function burst() {
    for (let i = 0; i < 26; i++) {
      const s = h('i', 'confetti');
      s.style.left = (40 + Math.random() * 20) + '%';
      s.style.background = ['#f5c542', '#5fbf46', '#3d7fd8', '#ef6fb0', '#e8842f'][i % 5];
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      root.appendChild(s);
      setTimeout(function () { s.remove(); }, 2200);
    }
  }

  /* ============================================================
     FENÊTRES
     ============================================================ */
  function openModal(title, html, onClose) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = html;
    modal.classList.remove('hidden');
    onCloseModal = onClose || null;
  }
  function closeModal() {
    modal.classList.add('hidden');
    stopReading();
    const fn = onCloseModal; onCloseModal = null;
    if (fn) fn();
  }
  function isOpen() { return !modal.classList.contains('hidden') || !dialogue.classList.contains('hidden'); }
  function hideAll() {
    modal.classList.add('hidden');
    dialogue.classList.add('hidden');
    dialogueQueue = null;
    stopReading();
  }

  /* ---------- courbe d'un fonds ---------- */
  function sparkline(history, color) {
    const w = 96, hgt = 34;
    const c = document.createElement('canvas');
    c.width = w; c.height = hgt;
    const x = c.getContext('2d');
    const vals = history.slice(-24);
    if (vals.length < 2) vals.unshift(vals[0]);
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const span = (max - min) || 0.0001;
    x.strokeStyle = '#' + color.toString(16).padStart(6, '0');
    x.lineWidth = 2; x.lineJoin = 'round';
    x.beginPath();
    vals.forEach(function (v, i) {
      const px = (i / (vals.length - 1)) * (w - 4) + 2;
      const py = hgt - 4 - ((v - min) / span) * (hgt - 8);
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    });
    x.stroke();
    x.globalAlpha = 0.18;
    x.lineTo(w - 2, hgt); x.lineTo(2, hgt); x.closePath();
    x.fillStyle = x.strokeStyle; x.fill();
    return c.toDataURL();
  }

  /* ============================================================
     LA BANQUE (côté enfant)
     ============================================================ */
  function openBank() {
    render();
    function render() {
      const d = State.get();
      const invested = State.investedTotal();
      let html = '';

      html += '<div class="bank-top">' +
        '<div class="money-card"><small>Mon argent de poche</small><b>' + euro(d.money) + '</b></div>' +
        '<div class="money-card alt"><small>Mes placements</small><b>' + euro(invested) + '</b></div>' +
        '<div class="money-card total"><small>Tout mon trésor</small><b>' + euro(d.money + invested) + '</b></div>' +
        '</div>';

      html += '<p class="hint">💡 Ton argent placé bouge tout seul, un peu chaque jour. ' +
              'Tant que tu ne le retires pas, rien n\'est perdu : ça peut redescendre… et remonter !</p>';

      /* mes placements */
      html += '<h3 class="sub">💼 Mes placements</h3>';
      if (!d.holdings.length) {
        html += '<p class="empty">Tu n\'as encore rien placé. Choisis un coffre plus bas !</p>';
      } else {
        html += '<div class="holdings">';
        d.holdings.forEach(function (hd) {
          const f = State.fundById(hd.fundId) || { name: '?', emoji: '❓', color: 0x888888, algo: 'prudent' };
          const val = State.holdingValue(hd);
          const diff = val - hd.invested;
          const pct = (diff / hd.invested) * 100;
          html += '<div class="holding">' +
            '<span class="hemo">' + (f.emoji || '💰') + '</span>' +
            '<div class="hinfo"><b>' + f.name + '</b>' +
              '<small>placé : ' + euro(hd.invested) + '</small></div>' +
            '<div class="hval ' + (diff >= 0 ? 'up' : 'down') + '">' + euro(val) +
              '<small>' + (diff >= 0 ? '▲ +' : '▼ ') + pct.toFixed(1) + ' %</small></div>' +
            '<button class="btn tiny" data-wd="' + hd.id + '">Retirer</button>' +
            '</div>';
        });
        html += '</div>';
      }

      /* fonds disponibles */
      html += '<h3 class="sub">🏦 Les coffres où placer ton argent</h3>';
      html += '<div class="funds">';
      State.availableFunds().forEach(function (f) {
        const st = d.funds[f.id];
        const a = State.algoById(f.algo) || GameData.algos[0];
        html += '<div class="fund algo-' + f.algo + '">' +
          '<div class="fhead"><span class="femo">' + (f.emoji || '💰') + '</span>' +
            '<b>' + f.name + '</b>' +
            '<span class="tag">' + a.emoji + ' ' + a.label + '</span></div>' +
          '<img class="spark" src="' + sparkline(st.history, f.color || a.color) + '" alt="">' +
          '<p class="fdesc">' + (f.desc || a.kidText) + '</p>' +
          '<div class="frow">' +
            '<button class="btn tiny" data-inv="' + f.id + '" data-amt="1">1 €</button>' +
            '<button class="btn tiny" data-inv="' + f.id + '" data-amt="2">2 €</button>' +
            '<button class="btn tiny" data-inv="' + f.id + '" data-amt="5">5 €</button>' +
            '<button class="btn tiny alt" data-inv="' + f.id + '" data-amt="half">Moitié</button>' +
          '</div>' +
          '</div>';
      });
      html += '</div>';

      openModal('🏦 Ma banque', html);

      modal.querySelectorAll('[data-wd]').forEach(function (b) {
        b.onclick = function () {
          const res = State.withdraw(b.getAttribute('data-wd'));
          if (res.ok) {
            toast(res.diff >= 0
              ? 'Tu récupères ' + euro(res.value) + ' — tu as gagné ' + euro(res.diff) + ' ! 🎉'
              : 'Tu récupères ' + euro(res.value) + '. Cette fois, ça a baissé de ' + euro(-res.diff) + '.',
              res.diff >= 0 ? 'good' : 'warn');
            render();
          }
        };
      });
      modal.querySelectorAll('[data-inv]').forEach(function (b) {
        b.onclick = function () {
          const id = b.getAttribute('data-inv');
          let amt = b.getAttribute('data-amt');
          amt = amt === 'half' ? Math.floor(State.get().money / 2 * 100) / 100 : +amt;
          const res = State.invest(id, amt);
          if (!res.ok) { toast(res.why, 'warn'); return; }
          toast('Tu as placé ' + euro(amt) + ' ! Reviens voir demain 👀', 'good');
          render();
        };
      });
    }
  }

  /* ============================================================
     BOUTIQUE DES RÉCOMPENSES (définies par le parent)
     ============================================================ */
  function openRewardShop() {
    render();
    function render() {
      const d = State.get();
      let html = '<p class="hint">🎁 Ces récompenses ont été préparées par tes parents. ' +
                 'Tu les échanges avec ton argent de poche ou tes piécettes.</p>';
      html += '<div class="rewards-grid">';
      d.shop.forEach(function (r) {
        const c = State.rewardCost(r);
        const can = State.canBuyReward(r);
        html += '<div class="reward' + (can ? '' : ' off') + '">' +
          '<span class="remo">' + r.emoji + '</span>' +
          '<b>' + r.name + '</b>' +
          '<p>' + (r.desc || '') + '</p>' +
          '<div class="price">' + (c.kind === 'money' ? '💶 ' : '🪙 ') +
            (c.kind === 'money' ? euro(c.amount) : c.amount + ' piécettes') +
            (c.note ? '<small>' + c.note + '</small>' : '') + '</div>' +
          '<div class="stock">Reste : ' + r.stock + '</div>' +
          '<button class="btn tiny" data-buy="' + r.id + '"' + (can ? '' : ' disabled') + '>Échanger</button>' +
          '</div>';
      });
      html += '</div>';
      if (d.purchases.length) {
        html += '<h3 class="sub">🎟️ Mes récompenses obtenues</h3><div class="tickets">';
        d.purchases.slice().reverse().forEach(function (p) {
          html += '<div class="ticket' + (p.done ? ' done' : '') + '">' + p.emoji + ' ' + p.name +
                  '<small>' + (p.done ? 'déjà utilisée' : 'à réclamer à tes parents') + '</small></div>';
        });
        html += '</div>';
      }
      openModal('🎁 Les récompenses', html);
      modal.querySelectorAll('[data-buy]').forEach(function (b) {
        b.onclick = function () {
          const res = State.buyReward(b.getAttribute('data-buy'));
          if (res.ok) { toast('Récompense obtenue ! Montre-la à tes parents 🎉', 'good'); burst(); render(); }
        };
      });
    }
  }

  /* ============================================================
     BOUTIQUE DE DÉCORATION (piécettes)
     ============================================================ */
  function openDecorShop() {
    render();
    function render() {
      const d = State.get();
      let html = '<p class="hint">🪙 Tu as <b>' + d.points + ' piécettes</b>. ' +
                 'Achète des objets, puis pose-les sur ton terrain.</p><div class="rewards-grid">';
      GameData.decorItems.forEach(function (it) {
        const can = d.points >= it.price;
        html += '<div class="reward' + (can ? '' : ' off') + '">' +
          '<span class="remo">' + it.emoji + '</span><b>' + it.name + '</b>' +
          '<div class="price">🪙 ' + it.price + '</div>' +
          '<div class="stock">' + (d.inventory[it.id] ? 'Tu en as ' + d.inventory[it.id] : '&nbsp;') + '</div>' +
          '<button class="btn tiny" data-dec="' + it.id + '"' + (can ? '' : ' disabled') + '>Acheter</button>' +
          '</div>';
      });
      html += '</div>';
      openModal('🛍️ Boutique du village', html);
      modal.querySelectorAll('[data-dec]').forEach(function (b) {
        b.onclick = function () {
          if (State.buyDecor(b.getAttribute('data-dec'))) { toast('Ajouté à ton sac ! 🎒', 'good'); render(); }
        };
      });
    }
  }

  /* ============================================================
     INVENTAIRE / ENCYCLOPÉDIE / CARTE / RÉGLAGES
     ============================================================ */
  function openInventory() {
    const d = State.get();
    let html = '<h3 class="sub">🎒 Mes objets</h3>';
    const keys = Object.keys(d.inventory);
    if (!keys.length) html += '<p class="empty">Ton sac est vide. Gagne des piécettes et va à la boutique !</p>';
    else {
      html += '<div class="grid-items">';
      keys.forEach(function (k) {
        const it = GameData.decorItems.filter(function (x) { return x.id === k; })[0];
        if (it) html += '<div class="item"><span>' + it.emoji + '</span><b>' + it.name + '</b><small>× ' + d.inventory[k] + '</small></div>';
      });
      html += '</div>';
    }
    html += '<h3 class="sub">🏅 Mes badges</h3><div class="grid-items">';
    GameData.badges.forEach(function (b) {
      const has = d.badges.indexOf(b.id) >= 0;
      html += '<div class="item' + (has ? '' : ' locked') + '"><span>' + (has ? b.emoji : '🔒') + '</span>' +
              '<b>' + b.name + '</b><small>' + (has ? b.desc : 'à débloquer') + '</small></div>';
    });
    html += '</div>';
    openModal('🎒 Mon sac', html);
  }

  function openEncyclopedia() {
    const d = State.get();
    const cats = {};
    GameData.encyclopedia.forEach(function (e) { (cats[e.category] = cats[e.category] || []).push(e); });
    const labels = { oceans: '🌊 Océans', animaux: '🐾 Animaux', fruits: '🍎 Fruits et légumes',
      plantes: '🌱 Plantes', environnement: '♻️ Environnement', espace: '🚀 Espace',
      histoire: '🏛️ Histoire', geographie: '🌍 Géographie' };
    let html = '<p class="hint">📖 Tu as découvert <b>' + d.encyclopedia.length + ' fiches sur ' +
               GameData.encyclopedia.length + '</b>. Les autres t\'attendent dans les aventures !</p>';
    Object.keys(cats).forEach(function (c) {
      html += '<h3 class="sub">' + (labels[c] || c) + '</h3><div class="cards">';
      cats[c].forEach(function (e) {
        const found = d.encyclopedia.indexOf(e.id) >= 0;
        if (!found) { html += '<div class="card locked"><b>? ? ?</b><p>Pas encore découverte.</p></div>'; return; }
        html += '<div class="card"><b>' + e.title + '</b><p>' + e.text + '</p>' +
          '<p class="wow">' + e.wow + '</p><small>Découvert : ' + e.foundAt + '</small>' +
          '<button class="icobtn small" data-read="' + e.id + '">🔊</button></div>';
      });
      html += '</div>';
    });
    openModal('📖 Mon carnet de découvertes', html);
    modal.querySelectorAll('[data-read]').forEach(function (b) {
      b.onclick = function () {
        const e = GameData.encyclopedia.filter(function (x) { return x.id === b.getAttribute('data-read'); })[0];
        readAloud(e.title + '. ' + e.text + ' ' + e.wow);
      };
    });
  }

  function openMap() {
    const html = '<div class="map">' +
      '<div class="mapgrid">' +
      '<div class="mp">🏠<b>Ta maison</b></div>' +
      '<div class="mp">⚓<b>Le port</b></div>' +
      '<div class="mp">🌾<b>La ferme</b></div>' +
      '<div class="mp">🏦<b>La banque</b></div>' +
      '<div class="mp">🛍️<b>La boutique</b></div>' +
      '<div class="mp soon">🏛️<b>Le musée</b><small>bientôt</small></div>' +
      '<div class="mp soon">🔭<b>L\'observatoire</b><small>bientôt</small></div>' +
      '<div class="mp soon">🚂<b>La gare</b><small>bientôt</small></div>' +
      '</div>' +
      '<p class="hint">Promène-toi dans le village : chaque bâtiment s\'ouvre quand tu t\'en approches.</p></div>';
    openModal('🗺️ La carte du village', html);
  }

  function openSettings() {
    const s = State.get().settings;
    const html =
      '<div class="settings">' +
      '<label>🔊 Voix des dialogues <input type="checkbox" id="set-voice"' + (s.voice ? ' checked' : '') + '></label>' +
      '<label>🎵 Musique <input type="range" id="set-music" min="0" max="1" step="0.05" value="' + s.music + '"></label>' +
      '<label>🔔 Bruitages <input type="range" id="set-sfx" min="0" max="1" step="0.05" value="' + s.sfx + '"></label>' +
      '<label>🅰️ Police adaptée à la dyslexie <input type="checkbox" id="set-dys"' + (s.dyslexia ? ' checked' : '') + '></label>' +
      '<label>🔡 Texte plus grand <input type="checkbox" id="set-big"' + (s.bigText ? ' checked' : '') + '></label>' +
      '</div>' +
      '<div class="center" style="margin-top:18px">' +
      '<button class="btn" id="set-parent">👪 Espace parents</button> ' +
      '<button class="btn danger" id="set-reset">🗑️ Tout recommencer</button></div>';
    openModal('⚙️ Réglages', html);
    document.getElementById('set-voice').onchange = function (e) { s.voice = e.target.checked; State.save(); };
    document.getElementById('set-music').oninput = function (e) { s.music = +e.target.value; State.save(); applyAudio(); };
    document.getElementById('set-sfx').oninput = function (e) { s.sfx = +e.target.value; State.save(); };
    document.getElementById('set-dys').onchange = function (e) {
      s.dyslexia = e.target.checked; State.save(); applyAccess();
    };
    document.getElementById('set-big').onchange = function (e) {
      s.bigText = e.target.checked; State.save(); applyAccess();
    };
    document.getElementById('set-parent').onclick = openParentGate;
    document.getElementById('set-reset').onclick = function () {
      if (confirm('Effacer toute la partie et recommencer ?')) { State.reset(); location.reload(); }
    };
  }

  function applyAccess() {
    const s = State.get().settings;
    document.body.classList.toggle('dys', s.dyslexia);
    document.body.classList.toggle('bigtext', s.bigText);
  }
  let audioHook = null;
  function onAudioChange(fn) { audioHook = fn; }
  function applyAudio() { if (audioHook) audioHook(State.get().settings); }

  /* ============================================================
     ESPACE PARENTS
     ============================================================ */
  function openParentGate() {
    const html = '<p class="hint">👪 Cet espace est réservé aux parents. ' +
      'Entre le code à 4 chiffres (par défaut : 1234).</p>' +
      '<div class="center"><input id="pin" class="pin" inputmode="numeric" maxlength="4" placeholder="••••">' +
      '<br><br><button class="btn" id="pin-ok">Entrer</button></div>';
    openModal('👪 Espace parents', html);
    document.getElementById('pin-ok').onclick = function () {
      if (document.getElementById('pin').value === State.get().parentPin) openParent();
      else toast('Code incorrect.', 'warn');
    };
  }

  function openParent() {
    let tab = 'argent';
    render();

    function render() {
      const d = State.get();
      const P = State.parent();
      let html = '<div class="tabs">' +
        ['argent', 'récompenses', 'placements', 'activité', 'réglages'].map(function (t) {
          return '<button class="tabbtn' + (tab === t ? ' on' : '') + '" data-tab="' + t + '">' + t + '</button>';
        }).join('') + '</div><div class="tabbody">';

      if (tab === 'argent') {
        html += '<h3 class="sub">Argent de poche</h3>' +
          '<div class="formrow"><label>Montant versé</label>' +
          '<input type="number" id="pa-amount" step="0.5" min="0" value="' + d.allowance.amount + '"> €</div>' +
          '<div class="formrow"><label>Tous les</label>' +
          '<input type="number" id="pa-days" min="1" value="' + d.allowance.everyDays + '"> jours de jeu</div>' +
          '<div class="formrow"><label>Prochain versement dans</label><b>' + Math.max(0, d.allowance.daysLeft) + ' jour(s)</b></div>' +
          '<div class="center"><button class="btn" id="pa-save">Enregistrer</button> ' +
          '<button class="btn alt" id="pa-now">Verser maintenant</button></div>' +
          '<h3 class="sub">Ajouter un bonus ponctuel</h3>' +
          '<div class="formrow"><input type="number" id="pa-bonus" step="0.5" value="1"> €' +
          ' <button class="btn tiny" id="pa-addb">Ajouter</button></div>' +
          '<p class="hint">Solde actuel de l\'enfant : <b>' + euro(d.money) + '</b> disponible, ' +
          '<b>' + euro(State.investedTotal()) + '</b> placé.</p>' +
          '<div class="center"><button class="btn alt" id="pa-day">⏭️ Passer un jour (démonstration)</button></div>';
      }

      if (tab === 'récompenses') {
        html += '<p class="hint">Définissez les récompenses visibles par l\'enfant. Le coût peut être ' +
          'une <b>valeur</b> en euros, un <b>volume</b> de piécettes gagnées en jouant, ou un ' +
          '<b>pourcentage</b> de son argent de poche disponible.</p>';
        html += '<table class="ptable"><tr><th>Récompense</th><th>Type de coût</th><th>Coût</th><th>Stock</th><th></th></tr>';
        d.shop.forEach(function (r, i) {
          html += '<tr>' +
            '<td><input data-f="name" data-i="' + i + '" value="' + r.name.replace(/"/g, '&quot;') + '"></td>' +
            '<td><select data-f="costType" data-i="' + i + '">' +
              ['valeur', 'volume', 'pourcentage'].map(function (t) {
                return '<option' + (r.costType === t ? ' selected' : '') + '>' + t + '</option>';
              }).join('') + '</select></td>' +
            '<td><input type="number" data-f="cost" data-i="' + i + '" value="' + r.cost + '" style="width:70px"></td>' +
            '<td><input type="number" data-f="stock" data-i="' + i + '" value="' + r.stock + '" style="width:60px"></td>' +
            '<td><button class="btn tiny danger" data-del="' + r.id + '">✕</button></td></tr>';
        });
        html += '</table><div class="center"><button class="btn" id="pr-add">+ Nouvelle récompense</button></div>';
        if (d.purchases.length) {
          html += '<h3 class="sub">Demandes de l\'enfant</h3><ul class="plist">';
          d.purchases.forEach(function (p, i) {
            html += '<li>' + p.emoji + ' <b>' + p.name + '</b> — ' + p.paid + ' ' + p.unit +
              ' (jour ' + p.day + ') ' + (p.done ? '<i>✔ honorée</i>' :
              '<button class="btn tiny" data-done="' + i + '">Marquer comme honorée</button>') + '</li>';
          });
          html += '</ul>';
        }
      }

      if (tab === 'placements') {
        html += '<p class="hint">Trois algorithmes sont disponibles. Chaque coffre créé suit ' +
          'l\'un d\'eux : il évolue tout seul à chaque journée de jeu.</p><div class="algos">';
        GameData.algos.forEach(function (a) {
          html += '<div class="algo"><b>' + a.emoji + ' ' + a.label + '</b><p>' + a.kidText + '</p></div>';
        });
        html += '</div><h3 class="sub">Créer un coffre</h3>' +
          '<div class="formrow"><input id="nf-name" placeholder="Nom rigolo du coffre" style="width:200px">' +
          '<input id="nf-emoji" placeholder="🐷" style="width:60px" maxlength="2">' +
          '<select id="nf-algo">' + GameData.algos.map(function (a) {
            return '<option value="' + a.id + '">' + a.label + '</option>';
          }).join('') + '</select>' +
          '<button class="btn tiny" id="nf-add">Créer</button></div>';
        html += '<table class="ptable"><tr><th>Coffre</th><th>Algorithme</th><th>Valeur</th><th>Visible</th><th></th></tr>';
        State.allFunds().forEach(function (f) {
          const st = d.funds[f.id];
          html += '<tr><td>' + (f.emoji || '') + ' ' + f.name + '</td><td>' + f.algo + '</td>' +
            '<td>' + st.value.toFixed(3) + '</td>' +
            '<td><input type="checkbox" data-en="' + f.id + '"' + (st.enabled !== false ? ' checked' : '') + '></td>' +
            '<td>' + (f.custom ? '<button class="btn tiny danger" data-delf="' + f.id + '">✕</button>' : '') + '</td></tr>';
        });
        html += '</table>';
      }

      if (tab === 'activité') {
        html += '<h3 class="sub">Journal</h3><ul class="plist">';
        if (!d.log.length) html += '<li>Rien pour l\'instant.</li>';
        d.log.forEach(function (l) {
          html += '<li><span class="day">jour ' + l.day + '</span> ' + l.text + '</li>';
        });
        html += '</ul>';
      }

      if (tab === 'réglages') {
        html += '<div class="formrow"><label>Code parent</label>' +
          '<input id="pp-pin" maxlength="4" value="' + d.parentPin + '" style="width:80px">' +
          '<button class="btn tiny" id="pp-save">Enregistrer</button></div>' +
          '<p class="hint">Ce code protège l\'accès à l\'espace parents. Ce n\'est pas un dispositif ' +
          'de sécurité : tout est enregistré en clair dans le navigateur de cet ordinateur.</p>' +
          '<p class="hint">Aucune donnée n\'est envoyée sur Internet. Le jeu ne demande jamais ' +
          'le nom de famille, l\'adresse, l\'école ou une photo de l\'enfant.</p>';
      }

      html += '</div>';
      openModal('👪 Espace parents', html);

      modal.querySelectorAll('[data-tab]').forEach(function (b) {
        b.onclick = function () { tab = b.getAttribute('data-tab'); render(); };
      });

      const P2 = State.parent();
      const byId = function (id) { return document.getElementById(id); };
      if (byId('pa-save')) byId('pa-save').onclick = function () {
        P2.setAllowance(byId('pa-amount').value, byId('pa-days').value);
        toast('Argent de poche enregistré.', 'good'); render();
      };
      if (byId('pa-now')) byId('pa-now').onclick = function () { P2.payNow(); toast('Versé !', 'good'); render(); };
      if (byId('pa-addb')) byId('pa-addb').onclick = function () { P2.addMoney(byId('pa-bonus').value); render(); };
      if (byId('pa-day')) byId('pa-day').onclick = function () { P2.nextDay(); toast('Un jour passe : les coffres bougent.', 'good'); render(); };

      modal.querySelectorAll('.ptable input, .ptable select').forEach(function (inp) {
        inp.onchange = function () {
          const i = +inp.getAttribute('data-i'), f = inp.getAttribute('data-f');
          if (i === null || !f) return;
          const r = State.get().shop[i];
          r[f] = (f === 'cost' || f === 'stock') ? +inp.value : inp.value;
          P2.saveReward(r);
        };
      });
      modal.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () { P2.deleteReward(b.getAttribute('data-del')); render(); };
      });
      if (byId('pr-add')) byId('pr-add').onclick = function () {
        P2.saveReward({ id: 'r' + Date.now(), name: 'Nouvelle récompense', emoji: '🎁',
                        costType: 'valeur', cost: 5, stock: 1, desc: '' });
        render();
      };
      modal.querySelectorAll('[data-done]').forEach(function (b) {
        b.onclick = function () { P2.markPurchaseDone(+b.getAttribute('data-done')); render(); };
      });
      if (byId('nf-add')) byId('nf-add').onclick = function () {
        const n = byId('nf-name').value.trim();
        if (!n) { toast('Donne un nom au coffre.', 'warn'); return; }
        P2.addFund(n, byId('nf-emoji').value || '💰', byId('nf-algo').value);
        toast('Coffre créé !', 'good'); render();
      };
      modal.querySelectorAll('[data-en]').forEach(function (c) {
        c.onchange = function () { P2.toggleFund(c.getAttribute('data-en'), c.checked); };
      });
      modal.querySelectorAll('[data-delf]').forEach(function (b) {
        b.onclick = function () { P2.deleteFund(b.getAttribute('data-delf')); render(); };
      });
      if (byId('pp-save')) byId('pp-save').onclick = function () {
        P2.setPin(byId('pp-pin').value); toast('Code enregistré.', 'good');
      };
    }
  }

  return {
    init: init, showHud: showHud, refreshHud: refreshHud, setQuest: setQuest,
    say: say, toast: toast, rewardPanel: rewardPanel, burst: burst,
    openModal: openModal, closeModal: closeModal, hideAll: hideAll, isOpen: isOpen,
    openBank: openBank, openRewardShop: openRewardShop, openDecorShop: openDecorShop,
    openInventory: openInventory, openEncyclopedia: openEncyclopedia, openMap: openMap,
    openSettings: openSettings, openParentGate: openParentGate,
    applyAccess: applyAccess, onAudioChange: onAudioChange, euro: euro, readAloud: readAloud
  };
})();
