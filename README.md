# Make Your Child Einstein

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

## Ce que contient le prototype

| Bloc | Contenu |
|---|---|
| Création du héros | Peau, visage, coiffure, haut, bas, chaussures, chapeau — chacun avec sa palette de couleurs. Un personnage n'est jamais sans vêtement. |
| Village | 66 × 46 cases, 8 bâtiments, chemins qui se raccordent à l'herbe, mer animée |
| 8 habitants | Ils se promènent, discutent entre eux, changent de phrases après une mission, et gardent leur apparence partout dans le jeu |
| Mission pêche | Lancer, remonter, identifier, mesurer et décider, trier un déchet — 4 prises |
| Mission ferme | Nettoyer, semer selon la saison, arroser, attirer les pollinisateurs, récolter, composer un panier |
| Banque | Argent de poche, 9 coffres de placement, courbes d'évolution, placer et retirer |
| Espace parents | Argent de poche, récompenses, création de coffres, journal d'activité |
| Terrain personnel | Grille de 18 × 12, 22 objets à poser, sauvegarde automatique |
| Encyclopédie | 18 fiches qui se remplissent au fil des aventures, avec lecture audio |
| Progression | Piécettes, niveau de curiosité, 5 badges |

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
