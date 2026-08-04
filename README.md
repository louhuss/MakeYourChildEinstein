# Make Your Child Einstein

![Le Village des Explorateurs](capture.png)

Jeu d'aventure éducatif en 2D pour les enfants de 6 à 12 ans.
On y crée son héros, on explore un village, on part en mission, on gagne des
piécettes — et on apprend à gérer son argent de poche dans une vraie petite
banque paramétrée par les parents.

**[▶ Jouer](https://louhuss.github.io/MakeYourChildEinstein/)** *(une fois GitHub Pages activé)*

## Jouer en local

Ouvre `index.html` dans un navigateur. Si les images ne se chargent pas
(certains navigateurs bloquent les fichiers locaux), double-clique plutôt sur
**`demarrer-serveur.bat`** : il lance un petit serveur et ouvre le jeu.

- **Se déplacer** : maintiens le clic, ton héros suit le curseur
- **Agir** : clique sur un personnage, une porte ou un panneau
- **Espace parents** : bouton ⚙️ en haut à droite, code **1234**

## Les missions

Cinq activités sont entièrement jouables. Chacune suit la même règle : l'enfant
**agit** avant d'apprendre, on ne lui fait jamais réciter une leçon, et une
erreur n'enlève jamais de points.

### ⚓ La pêche responsable — avec le Capitaine Marin

> *« Ahoy, moussaillon ! La mer est calme, on lève l'ancre ? »*

Le Capitaine t'emmène au large sur son bateau. Quatre prises t'attendent, et
chacune se joue en quatre temps : tu **choisis ta zone** — surface, entre deux
eaux ou près du fond — puis tu **déclenches ton lancer** au bon moment avec une
jauge. Ça mord : tu **maintiens la tension** de la ligne sans la casser. Le
poisson sort de l'eau… mais lequel ? Tu **l'identifies** parmi trois noms, en
observant sa forme et ses couleurs. Enfin tu le **mesures avec une règle** et tu
décides : le relâcher, le garder, ou demander conseil au Capitaine.

Une des prises n'est pas un poisson mais un **déchet remonté du fond** : il faut
le trier dans la bonne poubelle.

**Ce qu'on y apprend** : reconnaître dix espèces, comprendre pourquoi on relâche
les poissons trop petits pour qu'ils puissent grandir et se reproduire, repérer
les espèces protégées, mesurer une prise, et découvrir ce que deviennent nos
déchets en mer.
**Récompense** : 45 piécettes, le badge *Protecteur de l'océan*, trois fiches
d'encyclopédie et un objet pour ton terrain.

### 🌾 Une journée au potager — avec Maya

> *« Mes plantes ont des secrets à te raconter. »*

Maya a besoin d'un coup de main, et la saison est affichée en haut de l'écran —
tout en dépend. Tu commences par **préparer la terre** : douze parcelles à
débarrasser des cailloux et des mauvaises herbes. Puis tu **choisis quoi semer**
parmi des cultures proposées : certaines sont de saison, d'autres non, et Maya
t'explique pourquoi. Tu **plantes et tu arroses**, en dosant : trop peu la plante
a soif, trop c'est du gaspillage. Tu **plantes des fleurs près du potager** pour
attirer les abeilles, sans lesquelles beaucoup de fruits ne se formeraient pas.
Tu **récoltes** en reconnaissant ce qui est mûr. Et tu **composes un panier** en
tenant compte de la saison et de la provenance des aliments.

**Ce qu'on y apprend** : les fruits et légumes de saison, la différence entre un
produit local et un produit exotique et les distances qu'il parcourt, les besoins
d'une plante, le rôle des pollinisateurs, et pourquoi varier son alimentation.
**Récompense** : 45 piécettes, le badge *Ami du potager*, trois fiches et un
carré de potager pour ton terrain.

### 🏦 La Banque des Curieux — avec Awa

> *« Plus un coffre monte vite, plus il peut aussi descendre. »*

Ce n'est pas une mission avec un début et une fin, mais une activité qui dure
toute la partie. L'enfant y voit son **argent de poche**, versé par ses parents,
et peut en placer une partie sur des **coffres aux noms rigolos** — La Tirelire
Tranquille, Le Yoyo Malin, Le Grand Huit des Étoiles. Chaque coffre suit l'un des
trois algorithmes : prudent, équilibré ou risqué. Leur valeur évolue toute seule,
avec une courbe visible, et l'enfant décide quand retirer.

**Ce qu'on y apprend** : la patience, le rapport entre risque et gain, et surtout
que tant qu'on n'a pas retiré, rien n'est joué — une baisse n'est pas une perte.
Le détail des rendements est plus bas.

### 🛍️ La boutique — avec Théo

Deux rayons. D'un côté les **récompenses préparées par les parents** dans leur
espace : une soirée cinéma, un tour au parc, un privilège — l'enfant les échange
contre son argent de poche ou ses piécettes, et vient les réclamer dans la vraie
vie. De l'autre, **22 objets de décoration** achetés avec les piécettes gagnées
en mission.

### 🏠 Ton terrain

Derrière ta maison, une grille de 18 × 12 cases entièrement libre. Tu y poses ce
que tu as acheté — arbres, fleurs, tonneaux, table, ruche, poules, mouton, vache
— tu déplaces, tu reprends, et tout se sauvegarde tout seul. C'est l'espace où
l'enfant fait ce qu'il veut, sans objectif ni bonne réponse.

### 📖 Le carnet de découvertes

Il se remplit sans qu'on y pense : chaque information croisée en mission y
laisse une fiche, avec une illustration, une phrase courte, une info étonnante
et l'endroit où on l'a apprise. Un bouton permet de se la faire **lire à voix
haute** — utile pour les plus jeunes. Dix-huit fiches, réparties en huit thèmes.

### 🔜 Bientôt

Le **musée** de Grand-Père Élio, l'**observatoire** de Noor et la **gare** de
Sacha sont visibles dans le village et annoncent leur ouverture. L'architecture
est prête à les accueillir : une mission est une scène autonome qui reçoit les
données et rend des récompenses.

## Le reste du prototype

| Bloc | Contenu |
|---|---|
| Création du héros | Peau, visage, coiffure, haut, bas, chaussures, chapeau — chacun avec sa palette. Un personnage n'est jamais sans vêtement. |
| Village | 66 × 46 cases, 8 bâtiments, chemins qui se raccordent à l'herbe, mer animée |
| 8 habitants | Ils se promènent, discutent entre eux, changent de phrases après une mission, et gardent leur apparence partout |
| Espace parents | Argent de poche, récompenses, création de coffres, journal d'activité |
| Progression | Piécettes, niveau de curiosité en 5 paliers, 5 badges |
| Sauvegarde | Automatique, dans le navigateur |

## La banque, en deux mots

Deux monnaies séparées : les **piécettes** 🪙 gagnées en mission servent à la
décoration, l'**argent de poche** 💶 piloté par le parent sert aux récompenses.
L'enfant ne peut pas transformer du jeu en argent réel.

Trois algorithmes de placement — prudent, équilibré, risqué. Mesuré sur
3 000 simulations, après 20 journées de jeu :

| Algorithme | Risque de perte | Médiane | 5 % des cas | 95 % des cas |
|---|---|---|---|---|
| Prudent | 1 % | × 1,04 | × 1,01 | × 1,06 |
| Équilibré | 16 % | × 1,06 | × 0,96 | × 1,17 |
| Risqué | **27 %** | × 1,11 | × 0,82 | × 1,48 |

Tant que l'enfant ne retire pas, rien n'est joué : la valeur peut redescendre
puis remonter. C'est au retrait que le résultat devient réel.

## Organisation des fichiers

```
index.html            La page du jeu et toute la feuille de style
demarrer-serveur.bat  Lance un serveur local et ouvre le jeu
lib/phaser.min.js     Phaser 3.70, en local (fonctionne hors ligne)
js/
  data.js             TOUT le contenu : poissons, cultures, fiches,
                      coffres, récompenses, objets, badges, PNJ
  tileset.js          Catalogue des tuiles Kenney
  art.js              Décors et personnages dessinés en code (secours)
  lpc.js              Personnages LPC : empilement de calques, colorisation
  state.js            Sauvegarde, progression, logique de banque
  ui.js               Interface HTML : dialogues, banque, boutiques, parents
  scene-menu.js       Démarrage, écran titre, création du héros
  scene-village.js    Le village, les habitants, les bâtiments
  scene-fishing.js    Mission pêche
  scene-farm.js       Mission ferme
  scene-plot.js       Terrain personnel
  main.js             Configuration de Phaser
assets/
  kenney_tiny-town/   Tuiles du village (CC0)
  kenney_tiny-farm/   Tuiles de la ferme (CC0)
  lpc-slim/           Calques de personnages retenus + manifeste
scan-lpc.py           Reconstruit le catalogue des calques déposés
```

### Où modifier quoi

| Je veux… | Fichier |
|---|---|
| changer un dialogue, un poisson, une fiche | `js/data.js` |
| régler la difficulté des placements | `js/state.js`, constantes `PULL`, `SHAKE`, `DRIFT` |
| déplacer un bâtiment | `js/scene-village.js`, `buildBuildings()` |
| changer le zoom de la caméra | `js/scene-village.js`, `this.ZOOM` |
| ajouter un vêtement | déposer l'export LPC puis relancer le script de génération |

## Ce qui est simulé

- Le **code parent (1234)** n'est pas un dispositif de sécurité : tout est
  enregistré en clair dans le navigateur de l'ordinateur.
- L'**argent de poche est virtuel**. Aucun lien bancaire, aucun paiement.
- Le **temps** est accéléré : une « journée » passe toutes les 45 secondes.
- **Musée, observatoire et gare** sont visibles mais annoncent « bientôt ».
- Les **contenus scientifiques** portent tous `verified: false` : ils sont
  écrits prudemment mais doivent être relus par un pédagogue.

## Protection des enfants

Le jeu ne demande qu'un prénom ou un surnom. Pas de nom de famille, pas
d'adresse, pas d'école, pas de photo, pas de géolocalisation. Aucune donnée ne
quitte l'ordinateur. Pas de publicité, pas d'achat réel, pas de coffre-surprise.

## Licences

Voir **[CREDITS.md](CREDITS.md)**. En résumé : décors Kenney en CC0, personnages
LPC sous OGA-BY / CC-BY-SA / GPL — **l'attribution des auteurs LPC est
obligatoire**, ne retirez pas le fichier de crédits.
