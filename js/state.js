/* ============================================================
   STATE.JS — la mémoire du jeu.
   Contient tout ce que le joueur possède et a découvert, la
   logique de la banque (argent de poche, fonds, placements) et
   la sauvegarde automatique dans le navigateur.
   ============================================================ */

const State = (function () {

  const KEY = 'village-explorateurs-v1';
  let data = null;
  const listeners = [];

  /* ---------- valeurs de départ ---------- */
  function defaults() {
    const funds = {};
    GameData.funds.forEach(function (f) {
      funds[f.id] = { value: 1, history: [1], enabled: true };
    });
    return {
      version: 1,
      child: {
        name: '',
        look: { skin: 1, hair: 1, hairColor: 1, outfit: 0, cloth: 5, pants: 10, shoes: 11,
                hat: 'aucun', glasses: 'aucune' }
      },
      points: 0,                 /* Piécettes gagnées dans les missions */
      xp: 0,                     /* niveau de curiosité */
      money: 10,                 /* argent de poche disponible, en € */
      allowance: { amount: 3, everyDays: 7, daysLeft: 7 },
      funds: funds,
      holdings: [],              /* { id, fundId, units, invested, day } */
      customFunds: [],           /* fonds créés par le parent */
      shop: JSON.parse(JSON.stringify(GameData.shopDefaults)),
      purchases: [],
      inventory: {},             /* objets de décoration possédés */
      plot: [],                  /* { itemId, gx, gy } */
      badges: [],
      encyclopedia: [],
      quests: { peche: 'todo', ferme: 'todo', feu: 'todo' },
      log: [],                   /* journal visible par le parent */
      settings: { music: 0.4, sfx: 0.7, dyslexia: false, voice: true, bigText: false },
      parentPin: '1234',
      season: 'printemps',
      day: 1,
      tutorial: 0
    };
  }

  /* ---------- sauvegarde ---------- */
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { /* navigateur sans stockage : on continue en mémoire */ }
    listeners.forEach(function (fn) { fn(data); });
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        data = Object.assign(defaults(), parsed);
        /* on complète les nouveaux fonds ajoutés depuis la sauvegarde */
        allFunds().forEach(function (f) {
          if (!data.funds[f.id]) data.funds[f.id] = { value: 1, history: [1], enabled: true };
        });
        /* on complète les nouvelles quêtes ajoutées depuis la sauvegarde
           (Object.assign remplace tout l'objet "quests" d'un coup) */
        if (!data.quests) data.quests = {};
        if (!data.quests.feu) data.quests.feu = 'todo';
        return true;
      } catch (e) { }
    }
    data = defaults();
    return false;
  }
  function reset() { data = defaults(); save(); }
  function onChange(fn) { listeners.push(fn); }

  /* ---------- accès ---------- */
  function get() { return data; }
  function hasSave() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }

  function log(text, kind) {
    data.log.unshift({ day: data.day, text: text, kind: kind || 'info', at: Date.now() });
    if (data.log.length > 60) data.log.pop();
  }

  /* ---------- progression ---------- */
  function addPoints(n, reason) {
    data.points += n;
    data.xp += n;
    const before = level().level;
    save();
    const after = level().level;
    return after > before ? level() : null;
  }
  function level() {
    let cur = GameData.levels[0];
    GameData.levels.forEach(function (l) { if (data.xp >= l.need) cur = l; });
    const next = GameData.levels[GameData.levels.length - 1] === cur ? null :
      GameData.levels[GameData.levels.indexOf(cur) + 1];
    const span = next ? next.need - cur.need : 1;
    const done = next ? data.xp - cur.need : 1;
    return { level: cur.level, name: cur.name, next: next, progress: Math.min(1, done / span) };
  }
  function addBadge(id) {
    if (data.badges.indexOf(id) >= 0) return null;
    data.badges.push(id);
    log('Nouveau badge : ' + (badgeById(id) || {}).name, 'badge');
    save();
    return badgeById(id);
  }
  function badgeById(id) {
    return GameData.badges.filter(function (b) { return b.id === id; })[0];
  }
  function discover(id) {
    if (!id || data.encyclopedia.indexOf(id) >= 0) return null;
    data.encyclopedia.push(id);
    if (data.encyclopedia.length >= 10) addBadge('curieux');
    save();
    return GameData.encyclopedia.filter(function (e) { return e.id === id; })[0];
  }
  function completeQuest(id) {
    data.quests[id] = 'done';
    save();
  }

  /* ---------- inventaire et terrain ---------- */
  function buyDecor(itemId) {
    const item = GameData.decorItems.filter(function (d) { return d.id === itemId; })[0];
    if (!item || data.points < item.price) return false;
    data.points -= item.price;
    data.inventory[itemId] = (data.inventory[itemId] || 0) + 1;
    log('Achat dans la boutique : ' + item.name + ' (' + item.price + ' piécettes)', 'shop');
    save();
    return true;
  }
  function placeItem(itemId, gx, gy) {
    if (!data.inventory[itemId]) return false;
    data.inventory[itemId]--;
    if (!data.inventory[itemId]) delete data.inventory[itemId];
    data.plot.push({ itemId: itemId, gx: gx, gy: gy });
    if (data.plot.length >= 5) addBadge('decorateur');
    save();
    return true;
  }
  function removeItem(index) {
    const it = data.plot[index];
    if (!it) return false;
    data.inventory[it.itemId] = (data.inventory[it.itemId] || 0) + 1;
    data.plot.splice(index, 1);
    save();
    return true;
  }

  /* ============================================================
     LA BANQUE
     ============================================================ */

  /* tous les fonds : ceux du jeu + ceux créés par le parent */
  function allFunds() {
    return GameData.funds.concat(data ? data.customFunds : []);
  }
  function fundById(id) {
    return allFunds().filter(function (f) { return f.id === id; })[0];
  }
  function algoById(id) {
    return GameData.algos.filter(function (a) { return a.id === id; })[0];
  }
  function availableFunds() {
    return allFunds().filter(function (f) {
      const st = data.funds[f.id];
      return st && st.enabled !== false;
    });
  }

  /* variation aléatoire "en cloche" : les gros écarts sont plus rares */
  function bell() {
    return ((Math.random() + Math.random() + Math.random()) / 1.5) - 1;
  }

  /* Un « tour de marché » : chaque coffre bouge selon son algorithme.
     Trois forces se combinent :
       - une petite tendance de fond (le coffre monte doucement) ;
       - un rappel vers sa valeur d'équilibre, sinon un coffre partirait
         à l'infini et le jeu n'apprendrait plus rien ;
       - une secousse aléatoire, d'autant plus forte que l'algorithme
         est risqué. C'est elle qui permet de VRAIMENT perdre. */
  const PULL = 0.05;        /* force du rappel */
  const SHAKE = 2.5;        /* amplitude des secousses */
  const DRIFT = 0.35;       /* atténuation de la tendance de fond */

  function marketTick() {
    allFunds().forEach(function (f) {
      const st = data.funds[f.id];
      if (!st) return;
      const drift = f.baseReturn * DRIFT;
      const pull = (1 - st.value) * PULL;
      const change = drift + pull + bell() * f.volatility * SHAKE;
      st.value = Math.min(2.5, Math.max(0.4, st.value * (1 + change)));
      st.history.push(st.value);
      if (st.history.length > 40) st.history.shift();
    });
    save();
  }

  function investedTotal() {
    let t = 0;
    data.holdings.forEach(function (h) { t += holdingValue(h); });
    return t;
  }
  function holdingValue(h) {
    const st = data.funds[h.fundId];
    if (!st) return h.invested;
    return h.units * st.value;
  }
  function invest(fundId, amount) {
    amount = Math.round(amount * 100) / 100;
    if (amount <= 0 || amount > data.money) return { ok: false, why: 'Tu n\'as pas assez d\'argent de poche.' };
    const st = data.funds[fundId];
    const f = fundById(fundId);
    if (!st || !f) return { ok: false, why: 'Ce placement n\'existe plus.' };
    data.money = Math.round((data.money - amount) * 100) / 100;
    data.holdings.push({
      id: 'h' + Date.now() + Math.floor(Math.random() * 1000),
      fundId: fundId, units: amount / st.value, invested: amount, day: data.day
    });
    addBadge('banquier');
    log('Placement de ' + amount.toFixed(2) + ' € sur « ' + f.name + ' »', 'bank');
    save();
    return { ok: true };
  }
  function withdraw(holdingId) {
    const i = data.holdings.map(function (h) { return h.id; }).indexOf(holdingId);
    if (i < 0) return { ok: false };
    const h = data.holdings[i];
    const value = Math.round(holdingValue(h) * 100) / 100;
    const diff = Math.round((value - h.invested) * 100) / 100;
    data.money = Math.round((data.money + value) * 100) / 100;
    data.holdings.splice(i, 1);
    log('Retrait de « ' + (fundById(h.fundId) || {}).name + ' » : ' +
        value.toFixed(2) + ' € (' + (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' €)', 'bank');
    save();
    return { ok: true, value: value, diff: diff };
  }

  /* argent de poche */
  function payAllowance() {
    data.money = Math.round((data.money + data.allowance.amount) * 100) / 100;
    data.allowance.daysLeft = data.allowance.everyDays;
    log('Argent de poche versé : ' + data.allowance.amount.toFixed(2) + ' €', 'money');
    save();
  }
  function nextDay() {
    data.day++;
    data.allowance.daysLeft--;
    marketTick();
    if (data.allowance.daysLeft <= 0) payAllowance();
    save();
  }

  /* boutique des récompenses (définie par le parent) */
  function rewardCost(reward) {
    if (reward.costType === 'valeur') return { amount: reward.cost, unit: '€', kind: 'money' };
    if (reward.costType === 'volume') return { amount: reward.cost, unit: 'piécettes', kind: 'points' };
    /* pourcentage du solde disponible */
    const amount = Math.round(data.money * reward.cost) / 100;
    return { amount: Math.round(amount * 100) / 100, unit: '€', kind: 'money',
             note: reward.cost + ' % de ton argent de poche' };
  }
  function canBuyReward(reward) {
    if (reward.stock <= 0) return false;
    const c = rewardCost(reward);
    return c.kind === 'money' ? data.money >= c.amount && c.amount > 0 : data.points >= c.amount;
  }
  function buyReward(rewardId) {
    const r = data.shop.filter(function (s) { return s.id === rewardId; })[0];
    if (!r || !canBuyReward(r)) return { ok: false };
    const c = rewardCost(r);
    if (c.kind === 'money') data.money = Math.round((data.money - c.amount) * 100) / 100;
    else data.points -= c.amount;
    r.stock--;
    data.purchases.push({ id: r.id, name: r.name, emoji: r.emoji, day: data.day,
                          paid: c.amount, unit: c.unit, done: false });
    log('Récompense demandée : ' + r.name + ' (' + c.amount + ' ' + c.unit + ')', 'reward');
    save();
    return { ok: true, cost: c };
  }

  /* côté parent */
  function parent() {
    return {
      setAllowance: function (amount, everyDays) {
        data.allowance.amount = Math.max(0, +amount || 0);
        data.allowance.everyDays = Math.max(1, +everyDays || 7);
        save();
      },
      payNow: payAllowance,
      addMoney: function (amount) {
        data.money = Math.round((data.money + (+amount || 0)) * 100) / 100;
        log('Le parent a ajouté ' + (+amount).toFixed(2) + ' €', 'money');
        save();
      },
      saveReward: function (r) {
        const i = data.shop.map(function (s) { return s.id; }).indexOf(r.id);
        if (i >= 0) data.shop[i] = r; else data.shop.push(r);
        save();
      },
      deleteReward: function (id) {
        data.shop = data.shop.filter(function (s) { return s.id !== id; });
        save();
      },
      addFund: function (name, emoji, algoId) {
        const a = algoById(algoId) || GameData.algos[0];
        const base = { prudent: [0.007, 0.007], equilibre: [0.016, 0.028], risque: [0.028, 0.072] }[a.id];
        const f = {
          id: 'cf' + Date.now(),
          name: name, emoji: emoji || '💰', algo: a.id, color: a.color,
          baseReturn: base[0] * (0.85 + Math.random() * 0.3),
          volatility: base[1] * (0.85 + Math.random() * 0.3),
          desc: a.kidText, custom: true
        };
        data.customFunds.push(f);
        data.funds[f.id] = { value: 1, history: [1], enabled: true };
        save();
        return f;
      },
      deleteFund: function (id) {
        data.customFunds = data.customFunds.filter(function (f) { return f.id !== id; });
        data.holdings = data.holdings.filter(function (h) { return h.fundId !== id; });
        delete data.funds[id];
        save();
      },
      toggleFund: function (id, on) {
        if (data.funds[id]) data.funds[id].enabled = on;
        save();
      },
      markPurchaseDone: function (index) {
        if (data.purchases[index]) data.purchases[index].done = true;
        save();
      },
      nextDay: nextDay,
      setPin: function (pin) { data.parentPin = String(pin); save(); }
    };
  }

  return {
    load: load, save: save, reset: reset, get: get, hasSave: hasSave, onChange: onChange,
    addPoints: addPoints, level: level, addBadge: addBadge, badgeById: badgeById,
    discover: discover, completeQuest: completeQuest,
    buyDecor: buyDecor, placeItem: placeItem, removeItem: removeItem,
    allFunds: allFunds, availableFunds: availableFunds, fundById: fundById, algoById: algoById,
    marketTick: marketTick, invest: invest, withdraw: withdraw,
    investedTotal: investedTotal, holdingValue: holdingValue,
    payAllowance: payAllowance, nextDay: nextDay,
    rewardCost: rewardCost, canBuyReward: canBuyReward, buyReward: buyReward,
    parent: parent, log: log
  };
})();
