/* ------------------------------------------------------------------
   MYCE - Village
   Fichier de données du jeu. JavaScript classique, aucune dépendance.
   Tous les contenus marqués "verified: false" doivent être relus
   par un adulte / un expert avant publication.
   Les tailles de poissons et les règles de remise à l'eau sont des
   RÈGLES DE JEU, pas des réglementations officielles.
------------------------------------------------------------------- */

const GameData = {

  /* =====================  POISSONS  ===================== */
  fish: [
    {
      id: 'sardine',
      name: 'Sardine',
      habitat: 'surface',
      minSize: 11,
      sizeRange: [8, 20],
      protected: false,
      seasons: ['printemps', 'ete', 'automne'],
      points: 12,
      colors: { body: 0x9fc4d8, belly: 0xf2f2ea, fin: 0x6f95ab, spot: 0x5a7f95 },
      shape: 'fusiforme',
      fact: "Les sardines nagent en bancs de milliers de poissons qui tournent ensemble comme un seul animal.",
      why: "Dans notre jeu, les plus petites sardines retournent à l'eau pour grandir et faire des petits.",
      verified: false
    },
    {
      id: 'maquereau',
      name: 'Maquereau',
      habitat: 'surface',
      minSize: 20,
      sizeRange: [14, 42],
      protected: false,
      seasons: ['printemps', 'ete', 'automne'],
      points: 14,
      colors: { body: 0x4f7f8c, belly: 0xf4f1e6, fin: 0x35606d, spot: 0x1f3f4a },
      shape: 'fusiforme',
      fact: "Son dos porte des rayures ondulées, souvent un peu différentes d'un maquereau à l'autre.",
      why: "Dans notre jeu, on garde les grands et on relâche les petits pour laisser le banc se renouveler.",
      verified: false
    },
    {
      id: 'bar',
      name: 'Bar (ou loup)',
      habitat: 'milieu',
      minSize: 42,
      sizeRange: [22, 75],
      protected: false,
      seasons: ['printemps', 'ete', 'automne', 'hiver'],
      points: 22,
      colors: { body: 0xb9c6cf, belly: 0xf7f7f2, fin: 0x7d8f9c, spot: 0x5b6a76 },
      shape: 'fusiforme',
      fact: "Le bar peut vivre plus de vingt ans et il remonte parfois dans les estuaires, là où l'eau est un peu douce.",
      why: "Il grandit lentement : dans notre jeu, un petit bar est toujours remis à l'eau.",
      verified: false
    },
    {
      id: 'dorade',
      name: 'Dorade royale',
      habitat: 'milieu',
      minSize: 23,
      sizeRange: [14, 48],
      protected: false,
      seasons: ['ete', 'automne'],
      points: 20,
      colors: { body: 0xc9cfd6, belly: 0xf6f4ea, fin: 0x8e99a4, spot: 0xe0c05a },
      shape: 'rond',
      fact: "Elle porte une petite barre dorée entre les yeux, comme une couronne : c'est de là que vient son nom.",
      why: "Dans notre jeu, les jeunes dorades repartent nager : elles n'ont pas encore eu de petits.",
      verified: false
    },
    {
      id: 'sole',
      name: 'Sole',
      habitat: 'fond',
      minSize: 24,
      sizeRange: [15, 45],
      protected: false,
      seasons: ['printemps', 'automne', 'hiver'],
      points: 18,
      colors: { body: 0xb2986c, belly: 0xf1ead6, fin: 0x8f7950, spot: 0x6b5738 },
      shape: 'plat',
      fact: "Bébé, la sole a un œil de chaque côté. En grandissant, un œil se déplace : les deux finissent du même côté !",
      why: "Dans notre jeu, les petites soles retournent dans le sable pour grandir tranquillement.",
      verified: false
    },
    {
      id: 'rouget',
      name: 'Rouget barbet',
      habitat: 'fond',
      minSize: 15,
      sizeRange: [10, 30],
      protected: false,
      seasons: ['ete', 'automne'],
      points: 16,
      colors: { body: 0xd8635a, belly: 0xf6e8de, fin: 0xb44a44, spot: 0xe8b06a },
      shape: 'fusiforme',
      fact: "Sous son menton, deux petits filaments lui servent à fouiller le sable pour trouver à manger.",
      why: "Dans notre jeu, on relâche les plus petits rougets : ils doivent encore grandir.",
      verified: false
    },
    {
      id: 'lieu',
      name: 'Lieu jaune',
      habitat: 'milieu',
      minSize: 30,
      sizeRange: [20, 85],
      protected: false,
      seasons: ['printemps', 'automne', 'hiver'],
      points: 19,
      colors: { body: 0xa8894e, belly: 0xf3efe0, fin: 0x7d6538, spot: 0xd8c07a },
      shape: 'fusiforme',
      fact: "Comme presque tous les poissons, il sent les vibrations de l'eau grâce à une ligne le long de son corps.",
      why: "Dans notre jeu, un petit lieu repart à l'eau : il peut devenir très grand si on lui laisse le temps.",
      verified: false
    },
    {
      id: 'congre',
      name: 'Congre',
      habitat: 'fond',
      minSize: 58,
      sizeRange: [40, 160],
      protected: false,
      seasons: ['ete', 'automne', 'hiver'],
      points: 24,
      colors: { body: 0x6f7a6a, belly: 0xe8e6d8, fin: 0x4f5a4c, spot: 0x3a423a },
      shape: 'long',
      fact: "Le congre ressemble à une très grosse anguille et se cache le jour dans les trous des rochers.",
      why: "Dans notre jeu, les jeunes congres retournent dans leur rocher : ils grandissent très longtemps.",
      verified: false
    },
    {
      id: 'hippocampe',
      name: 'Hippocampe',
      habitat: 'milieu',
      minSize: 5,
      sizeRange: [5, 15],
      protected: true,
      seasons: ['printemps', 'ete', 'automne', 'hiver'],
      points: 30,
      colors: { body: 0xe0a94f, belly: 0xf6e3b8, fin: 0xc98a34, spot: 0x8c5f22 },
      shape: 'long',
      fact: "Chez l'hippocampe, c'est le papa qui garde les bébés dans une poche sur son ventre !",
      why: "Fragile et rare : dans notre jeu, on le remet toujours à l'eau, tout doucement.",
      verified: false
    },
    {
      id: 'etoile_mer',
      name: 'Étoile de mer',
      habitat: 'fond',
      minSize: 5,
      sizeRange: [5, 25],
      protected: true,
      seasons: ['printemps', 'ete', 'automne', 'hiver'],
      points: 26,
      colors: { body: 0xe27a5a, belly: 0xf6d3bd, fin: 0xc25c40, spot: 0x8f3f2b },
      shape: 'etoile',
      fact: "Une étoile de mer peut souvent faire repousser un bras qu'elle a perdu.",
      why: "Ce n'est pas un poisson : dans notre jeu, on la repose gentiment dans l'eau.",
      verified: false
    }
  ],

  /* =====================  DÉCHETS  ===================== */
  trash: [
    {
      id: 'bouteille',
      name: 'Bouteille en plastique',
      bin: 'plastique',
      fact: "Bien recyclée, une bouteille en plastique peut servir à fabriquer un pull polaire.",
      verified: false
    },
    {
      id: 'sac_plastique',
      name: 'Sac en plastique',
      bin: 'plastique',
      fact: "Dans l'eau, un sac qui flotte ressemble à une méduse : des tortues se trompent et l'avalent.",
      verified: false
    },
    {
      id: 'canette',
      name: 'Canette en métal',
      bin: 'metal',
      fact: "L'aluminium se recycle très bien : on peut le refondre encore et encore.",
      verified: false
    },
    {
      id: 'journal',
      name: 'Vieux journal',
      bin: 'papier',
      fact: "Le papier se recycle plusieurs fois, mais ses fibres raccourcissent à chaque tour.",
      verified: false
    },
    {
      id: 'bocal',
      name: 'Bocal en verre',
      bin: 'verre',
      fact: "Le verre se refond sans s'user : un bocal peut redevenir un bocal, encore et encore.",
      verified: false
    },
    {
      id: 'basket',
      name: 'Vieille basket',
      bin: 'dechet',
      fact: "Une chaussure mélange tissu, mousse et colle : c'est très difficile à séparer pour recycler.",
      verified: false
    }
  ],

  /* =====================  POUBELLES  ===================== */
  bins: [
    { id: 'plastique', label: 'Plastique', color: 0xf2b333 },
    { id: 'metal', label: 'Métal', color: 0x9aa6b5 },
    { id: 'papier', label: 'Papier', color: 0x4c9be8 },
    { id: 'verre', label: 'Verre', color: 0x5fbf7a },
    { id: 'dechet', label: 'Ordures', color: 0x8a8a8a }
  ],

  /* =====================  CULTURES  ===================== */
  crops: [
    {
      id: 'fraise', name: 'Fraise', type: 'fruit',
      seasons: ['printemps', 'ete'],
      origin: 'local', from: 'Europe', km: 120,
      growTime: 3, needsPollinator: true, points: 10,
      colors: { fruit: 0xd9403a, leaf: 0x4f9b3a, flower: 0xfdfdfd },
      fact: "Les vrais petits fruits de la fraise, ce sont les grains jaunes posés sur sa peau.",
      verified: false
    },
    {
      id: 'pomme', name: 'Pomme', type: 'fruit',
      seasons: ['automne'],
      origin: 'local', from: 'France', km: 80,
      growTime: 4, needsPollinator: true, points: 12,
      colors: { fruit: 0xd94f3d, leaf: 0x3f8a34, flower: 0xf7dfe6 },
      fact: "Il existe des milliers de variétés de pommes dans le monde, avec des goûts très différents.",
      verified: false
    },
    {
      id: 'raisin', name: 'Raisin', type: 'fruit',
      seasons: ['ete', 'automne'],
      origin: 'local', from: 'Europe', km: 300,
      growTime: 4, needsPollinator: false, points: 12,
      colors: { fruit: 0x7b4f9e, leaf: 0x4f9b3a, flower: 0xdfe6c9 },
      fact: "Un pied de vigne bien soigné peut vivre plus de cent ans et donner du raisin chaque année.",
      verified: false
    },
    {
      id: 'banane', name: 'Banane', type: 'fruit',
      seasons: ['printemps', 'ete', 'automne', 'hiver'],
      origin: 'exotique', from: 'Antilles', km: 6800,
      growTime: 4, needsPollinator: false, points: 14,
      colors: { fruit: 0xf2cc4a, leaf: 0x3f8f4a, flower: 0xc98a34 },
      fact: "Le bananier n'est pas un arbre : c'est une herbe géante, sans tronc de bois.",
      verified: false
    },
    {
      id: 'ananas', name: 'Ananas', type: 'fruit',
      seasons: ['printemps', 'ete', 'automne', 'hiver'],
      origin: 'exotique', from: 'Costa Rica', km: 9000,
      growTime: 5, needsPollinator: false, points: 15,
      colors: { fruit: 0xe0a63c, leaf: 0x4f9b3a, flower: 0xb7d0e8 },
      fact: "L'ananas ne pousse pas sur un arbre : il grandit au sol, au milieu d'une touffe de feuilles piquantes.",
      verified: false
    },
    {
      id: 'mangue', name: 'Mangue', type: 'fruit',
      seasons: ['printemps', 'ete'],
      origin: 'exotique', from: 'Pérou', km: 10000,
      growTime: 5, needsPollinator: true, points: 15,
      colors: { fruit: 0xe8863d, leaf: 0x3f8a34, flower: 0xf3e0a8 },
      fact: "Le manguier fait partie de la même famille de plantes que la pistache et la noix de cajou.",
      verified: false
    },
    {
      id: 'carotte', name: 'Carotte', type: 'legume',
      seasons: ['printemps', 'ete', 'automne'],
      origin: 'local', from: 'France', km: 60,
      growTime: 3, needsPollinator: false, points: 9,
      colors: { fruit: 0xe8843c, leaf: 0x4f9b3a, flower: 0xf7f7ef },
      fact: "Autrefois, beaucoup de carottes étaient violettes ou jaunes : l'orange s'est répandue plus tard.",
      verified: false
    },
    {
      id: 'tomate', name: 'Tomate', type: 'legume',
      seasons: ['ete'],
      origin: 'local', from: 'France', km: 150,
      growTime: 4, needsPollinator: false, points: 11,
      colors: { fruit: 0xd93b33, leaf: 0x4f9b3a, flower: 0xf2d94a },
      fact: "On la cuisine comme un légume, mais pour les botanistes la tomate est un fruit, venu d'Amérique.",
      verified: false
    },
    {
      id: 'courgette', name: 'Courgette', type: 'legume',
      seasons: ['ete'],
      origin: 'local', from: 'France', km: 100,
      growTime: 3, needsPollinator: true, points: 10,
      colors: { fruit: 0x4c8f3a, leaf: 0x3f7a30, flower: 0xf2c94a },
      fact: "La fleur de courgette se mange : on la cuisine souvent farcie ou en beignet.",
      verified: false
    },
    {
      id: 'potiron', name: 'Potiron', type: 'legume',
      seasons: ['automne'],
      origin: 'local', from: 'France', km: 70,
      growTime: 5, needsPollinator: true, points: 13,
      colors: { fruit: 0xe0762f, leaf: 0x4f8f34, flower: 0xf2c94a },
      fact: "Les courges géantes des concours peuvent dépasser 500 kilos : plus lourdes que six enfants réunis !",
      verified: false
    },
    {
      id: 'poireau', name: 'Poireau', type: 'legume',
      seasons: ['automne', 'hiver'],
      origin: 'local', from: 'France', km: 60,
      growTime: 4, needsPollinator: false, points: 9,
      colors: { fruit: 0xdfe8c9, leaf: 0x3f8a4a, flower: 0xd8d3ea },
      fact: "Le blanc du poireau, ce sont des feuilles serrées les unes dans les autres, comme un rouleau.",
      verified: false
    },
    {
      id: 'salade', name: 'Salade', type: 'legume',
      seasons: ['printemps', 'automne'],
      origin: 'local', from: 'France', km: 40,
      growTime: 2, needsPollinator: false, points: 8,
      colors: { fruit: 0x7cc44a, leaf: 0x5aa83a, flower: 0xf2ea9a },
      fact: "Une salade est faite surtout d'eau : plus de neuf dixièmes de son poids !",
      verified: false
    }
  ],

  /* =====================  SAISONS  ===================== */
  seasons: [
    { id: 'printemps', label: 'Printemps', color: 0x8fd46a },
    { id: 'ete', label: 'Été', color: 0xf5c542 },
    { id: 'automne', label: 'Automne', color: 0xd98341 },
    { id: 'hiver', label: 'Hiver', color: 0x9fd0e8 }
  ],

  /* =====================  MATÉRIAUX DU FEU  ===================== */
  /* Chaque matériau a deux propriétés visibles et indépendantes :
     l'humidité (sec / humide) et l'épaisseur (fin / épais).
     C'est cette double condition que le joueur doit apprendre à lire. */
  fireMaterials: [
    {
      id: 'amadou', name: 'Amadou', kind: 'amadou', humidity: 'sec', epaisseur: 'fin',
      emoji: '🌾',
      fact: "L'amadou est une matière très fine qui prend feu au moindre contact avec une étincelle ou une braise.",
      verified: false
    },
    {
      id: 'petit_bois_sec', name: 'Petit bois sec', kind: 'petit_bois', humidity: 'sec', epaisseur: 'fin',
      emoji: '🌿',
      fact: "Fin et sec, le petit bois s'enflamme vite : c'est lui qui fait grandir la toute première flamme.",
      verified: false
    },
    {
      id: 'petit_bois_humide', name: 'Petit bois humide', kind: 'petit_bois', humidity: 'humide', epaisseur: 'fin',
      emoji: '🍃',
      fact: "Un bois humide fume avant de brûler : l'eau qu'il contient doit d'abord s'évaporer.",
      verified: false
    },
    {
      id: 'buche_seche', name: 'Bûche sèche', kind: 'buche', humidity: 'sec', epaisseur: 'epais',
      emoji: '🪵',
      fact: "Une bûche est épaisse : elle met du temps à s'enflammer, mais elle brûle longtemps une fois allumée.",
      verified: false
    },
    {
      id: 'buche_humide', name: 'Bûche humide', kind: 'buche', humidity: 'humide', epaisseur: 'epais',
      emoji: '🪵',
      fact: "Trop humide, une bûche refuse de prendre : mieux vaut la laisser sécher un peu près du feu.",
      verified: false
    },
    {
      id: 'pierre', name: 'Pierre', kind: 'pierre', humidity: 'sec', epaisseur: 'epais',
      emoji: '🪨',
      fact: "Des pierres posées autour du foyer coupent le vent et protègent une flamme encore fragile.",
      verified: false
    }
  ],

  /* =====================  ENCYCLOPÉDIE  ===================== */
  encyclopedia: [
    {
      id: 'ency_ocean_1', category: 'oceans', title: 'La mer, un immense jardin',
      text: "Les océans recouvrent environ les sept dixièmes de la Terre. Vue de l'espace, notre planète est surtout bleue.",
      wow: "Le sais-tu ? Une grande partie de l'oxygène que nous respirons vient de minuscules algues de la mer.",
      foundAt: 'En mer avec Capitaine Marin', icon: 'vague', verified: false
    },
    {
      id: 'ency_ocean_2', category: 'oceans', title: 'La danse des marées',
      text: "La mer monte et descend chaque jour. C'est surtout la Lune qui tire sur l'eau des océans.",
      wow: "Le sais-tu ? Sur la plupart des côtes, il y a deux marées hautes par jour.",
      foundAt: 'En mer avec Capitaine Marin', icon: 'vague', verified: false
    },
    {
      id: 'ency_ocean_3', category: 'oceans', title: 'Tout au fond de la mer',
      text: "Plus on descend, plus il fait sombre et froid. Tout au fond, il fait nuit noire en permanence.",
      wow: "Le sais-tu ? Certains animaux des profondeurs fabriquent eux-mêmes leur lumière.",
      foundAt: 'En mer avec Capitaine Marin', icon: 'poisson', verified: false
    },
    {
      id: 'ency_animaux_1', category: 'animaux', title: 'Le papa hippocampe',
      text: "L'hippocampe nage debout, tout doucement. La maman dépose ses œufs dans la poche du papa.",
      wow: "Le sais-tu ? C'est le papa hippocampe qui met les bébés au monde.",
      foundAt: 'En mer avec Capitaine Marin', icon: 'poisson', verified: false
    },
    {
      id: 'ency_animaux_2', category: 'animaux', title: 'Les abeilles se parlent',
      text: "Quand une abeille trouve de bonnes fleurs, elle rentre à la ruche et se met à danser.",
      wow: "Le sais-tu ? Sa danse indique aux autres abeilles la direction des fleurs.",
      foundAt: 'À la ferme avec Maya', icon: 'abeille', verified: false
    },
    {
      id: 'ency_animaux_3', category: 'animaux', title: 'Les grands voyageurs',
      text: "Chaque année, des oiseaux traversent des pays entiers pour retrouver la bonne saison.",
      wow: "Le sais-tu ? La sterne arctique fait l'un des plus longs voyages du monde animal.",
      foundAt: 'À la gare', icon: 'monde', verified: false
    },
    {
      id: 'ency_fruits_1', category: 'fruits', title: 'Fruit ou légume ?',
      text: "Pour les cuisiniers, la tomate est un légume. Pour les botanistes, c'est un fruit.",
      wow: "Le sais-tu ? Le concombre et le poivron sont aussi des fruits, côté botanique.",
      foundAt: 'À la ferme avec Maya', icon: 'fruit', verified: false
    },
    {
      id: 'ency_fruits_2', category: 'fruits', title: 'Les fruits de saison',
      text: "Chaque fruit a son moment préféré dans l'année : la fraise au printemps, la pomme en automne.",
      wow: "Le sais-tu ? Un fruit de saison a souvent voyagé moins loin pour arriver dans ton assiette.",
      foundAt: 'Dans la boutique du village', icon: 'fruit', verified: false
    },
    {
      id: 'ency_plantes_1', category: 'plantes', title: 'La graine, une petite valise',
      text: "Dans une graine, il y a une mini-plante endormie et un petit stock de nourriture.",
      wow: "Le sais-tu ? Il suffit souvent d'eau, de chaleur et d'air pour la réveiller.",
      foundAt: 'À la ferme avec Maya', icon: 'graine', verified: false
    },
    {
      id: 'ency_plantes_2', category: 'plantes', title: 'Les plantes mangent la lumière',
      text: "Avec la lumière du Soleil, l'eau et l'air, les feuilles fabriquent la nourriture de la plante.",
      wow: "Le sais-tu ? En faisant cela, les plantes rejettent de l'oxygène, celui que nous respirons.",
      foundAt: 'À la ferme avec Maya', icon: 'soleil', verified: false
    },
    {
      id: 'ency_env_1', category: 'environnement', title: "Trier, c'est facile",
      text: "Chaque déchet a sa poubelle : plastique, métal, papier, verre. Le reste part avec les ordures.",
      wow: "Le sais-tu ? Un déchet bien trié peut redevenir un objet tout neuf.",
      foundAt: 'En mer avec Capitaine Marin', icon: 'dechet', verified: false
    },
    {
      id: 'ency_env_2', category: 'environnement', title: "L'eau qui voyage",
      text: "L'eau s'évapore, forme des nuages, retombe en pluie, puis repart vers la mer. Et ça recommence.",
      wow: "Le sais-tu ? L'eau de ton verre a peut-être déjà été un nuage il y a très longtemps.",
      foundAt: 'À la ferme avec Maya', icon: 'monde', verified: false
    },
    {
      id: 'ency_env_3', category: 'environnement', title: 'Manger près de chez soi',
      text: "Un aliment cultivé tout près voyage moins. Moins de camions, moins de bateaux, moins de pollution.",
      wow: "Le sais-tu ? Une banane peut parcourir plusieurs milliers de kilomètres avant ton petit-déjeuner.",
      foundAt: 'Dans la boutique du village', icon: 'coeur', verified: false
    },
    {
      id: 'ency_espace_1', category: 'espace', title: 'Le Soleil est une étoile',
      text: "Notre Soleil est une étoile, comme celles de la nuit. Il paraît énorme parce qu'il est le plus proche.",
      wow: "Le sais-tu ? Sa lumière met environ huit minutes pour arriver jusqu'à nous.",
      foundAt: "À l'observatoire", icon: 'soleil', verified: false
    },
    {
      id: 'ency_espace_2', category: 'espace', title: 'La Lune nous regarde',
      text: "La Lune tourne autour de la Terre et nous montre toujours à peu près le même côté.",
      wow: "Le sais-tu ? Sa face cachée n'a été vue qu'avec des sondes envoyées dans l'espace.",
      foundAt: "À l'observatoire", icon: 'etoile', verified: false
    },
    {
      id: 'ency_histoire_1', category: 'histoire', title: 'Avant la monnaie : le troc',
      text: "Pendant très longtemps, on échangeait des objets : du sel contre du blé, un outil contre un panier.",
      wow: "Le sais-tu ? Les premières pièces de monnaie datent d'il y a plus de deux mille cinq cents ans.",
      foundAt: 'Au musée du village', icon: 'livre', verified: false
    },
    {
      id: 'ency_histoire_2', category: 'histoire', title: 'Les phares des marins',
      text: "Avant le GPS, les phares allumaient une grande lumière pour guider les bateaux dans la nuit.",
      wow: "Le sais-tu ? Chaque phare a son propre rythme de clignotement, comme une signature.",
      foundAt: 'Au musée du village', icon: 'livre', verified: false
    },
    {
      id: 'ency_geo_1', category: 'geographie', title: 'Continents et océans',
      text: "Sur la Terre, on compte cinq grands océans et de vastes terres appelées continents.",
      wow: "Le sais-tu ? Les continents bougent de quelques centimètres par an, comme des radeaux très lents.",
      foundAt: 'À la gare', icon: 'monde', verified: false
    },
    {
      id: 'ency_feu_1', category: 'histoire', title: "Un feu qui ne s'invente pas chaque soir",
      text: "Bien avant ce campement, des groupes humains savaient déjà entretenir un feu : le garder vivant, jour après jour, plutôt que le rallumer à chaque fois.",
      wow: "Le sais-tu ? L'entretien du feu est une pratique très ancienne, bien antérieure à cette histoire.",
      foundAt: 'Au campement avec Ayla', icon: 'feu', verified: false
    },
    {
      id: 'ency_feu_2', category: 'histoire', title: "Deux façons d'allumer sans allumette",
      text: "Sans briquet ni allumette, on peut allumer un feu en frottant deux morceaux de bois très vite, ou en frappant certaines pierres pour créer une étincelle.",
      wow: "Le sais-tu ? Ces deux techniques demandent beaucoup de patience et d'entraînement.",
      foundAt: 'Au campement avec Ayla', icon: 'feu', verified: false
    },
    {
      id: 'ency_feu_3', category: 'histoire', title: 'Des campements, pas un campement',
      text: "Il n'existe pas un unique mode de vie « préhistorique » : les groupes humains de cette époque étaient nombreux et différents les uns des autres.",
      wow: "Le sais-tu ? Beaucoup de ces groupes se déplaçaient souvent, en suivant le gibier et les saisons.",
      foundAt: 'Au campement avec Ayla', icon: 'monde', verified: false
    }
  ],

  /* =====================  FONDS  ===================== */
  funds: [
    {
      id: 'tirelire', name: 'La Tirelire Tranquille', algo: 'prudent',
      emoji: '🐷', color: 0x5fbf7a,
      baseReturn: 0.008, volatility: 0.006,
      desc: "Elle avance tout doucement, mais elle ne fait presque jamais peur."
    },
    {
      id: 'tortue', name: 'La Tortue Dorée', algo: 'prudent',
      emoji: '🐢', color: 0x6fc98a,
      baseReturn: 0.006, volatility: 0.005,
      desc: "Lente, très lente… mais elle arrive presque toujours au bout du chemin."
    },
    {
      id: 'coussin', name: 'Le Coussin Douillet', algo: 'prudent',
      emoji: '🧸', color: 0x8fd4a8,
      baseReturn: 0.005, volatility: 0.004,
      desc: "Doux comme un oreiller : on dort tranquille quand on met ses sous dedans."
    },
    {
      id: 'nuage', name: 'Le Nuage Zigzag', algo: 'equilibre',
      emoji: '☁️', color: 0x4c9be8,
      baseReturn: 0.014, volatility: 0.024,
      desc: "Il monte, il descend, il zigzague… et il finit souvent un peu plus haut."
    },
    {
      id: 'kangourou', name: 'Le Kangourou Sautillant', algo: 'equilibre',
      emoji: '🦘', color: 0x5aa8e8,
      baseReturn: 0.017, volatility: 0.030,
      desc: "Un petit saut par-ci, un petit saut par-là. Il adore rebondir."
    },
    {
      id: 'yoyo', name: 'Le Yoyo Malin', algo: 'equilibre',
      emoji: '🪀', color: 0x3f8fd4,
      baseReturn: 0.013, volatility: 0.022,
      desc: "Il descend, il remonte. L'important, c'est de ne pas lâcher la ficelle."
    },
    {
      id: 'fusee', name: 'La Fusée Pétillante', algo: 'risque',
      emoji: '🚀', color: 0xe8663d,
      baseReturn: 0.030, volatility: 0.075,
      desc: "Elle décolle très vite… et parfois elle retombe tout aussi vite."
    },
    {
      id: 'dragon', name: 'Le Trésor du Dragon', algo: 'risque',
      emoji: '🐉', color: 0xd9533a,
      baseReturn: 0.026, volatility: 0.065,
      desc: "Un trésor qui brille fort, mais le dragon est d'humeur changeante."
    },
    {
      id: 'granduit', name: 'Le Grand Huit des Étoiles', algo: 'risque',
      emoji: '🎢', color: 0xf2803d,
      baseReturn: 0.033, volatility: 0.088,
      desc: "Accroche-toi ! Ça grimpe très haut et ça plonge sans prévenir."
    }
  ],

  /* =====================  ALGOS  ===================== */
  algos: [
    {
      id: 'prudent', label: 'Prudent', color: 0x5fbf7a, emoji: '🛡️',
      kidText: "Ça monte tout doucement. On ne perd presque jamais."
    },
    {
      id: 'equilibre', label: 'Équilibré', color: 0x4c9be8, emoji: '⚖️',
      kidText: "Ça monte, ça descend un peu, et souvent ça remonte."
    },
    {
      id: 'risque', label: 'Risqué', color: 0xe8663d, emoji: '🎢',
      kidText: "Grand huit ! On peut gagner beaucoup… ou perdre beaucoup."
    }
  ],

  /* =====================  BOUTIQUE DES PARENTS  ===================== */
  shopDefaults: [
    {
      id: 'r1', name: 'Une soirée cinéma à la maison', emoji: '🍿',
      costType: 'valeur', cost: 8, stock: 2,
      desc: "Tu choisis le film et le popcorn."
    },
    {
      id: 'r2', name: 'Trente minutes de plus avant le dodo', emoji: '🌙',
      costType: 'volume', cost: 5, stock: 4,
      desc: "Un soir, tu te couches un petit peu plus tard."
    },
    {
      id: 'r3', name: 'Tu choisis le repas du dimanche', emoji: '🍽️',
      costType: 'valeur', cost: 6, stock: 2,
      desc: "Le menu, c'est toi qui décides. Même le dessert !"
    },
    {
      id: 'r4', name: 'Une sortie à vélo rien que nous deux', emoji: '🚲',
      costType: 'pourcentage', cost: 10, stock: 3,
      desc: "Une balade ensemble, avec une pause goûter."
    },
    {
      id: 'r5', name: 'Une partie de jeu de société', emoji: '🎲',
      costType: 'volume', cost: 3, stock: 5,
      desc: "Tu choisis le jeu, on joue jusqu'au bout."
    },
    {
      id: 'r6', name: 'Une nuit cabane dans le salon', emoji: '🛋️',
      costType: 'pourcentage', cost: 25, stock: 1,
      desc: "Coussins, couvertures et lampe de poche."
    },
    {
      id: 'r7', name: 'Un atelier gâteau avec un adulte', emoji: '🧁',
      costType: 'valeur', cost: 12, stock: 2,
      desc: "On mélange, on goûte la pâte, on partage."
    },
    {
      id: 'r8', name: 'Zapper une corvée', emoji: '🧹',
      costType: 'volume', cost: 8, stock: 3,
      desc: "Une fois, quelqu'un d'autre la fait à ta place."
    }
  ],

  /* =====================  DÉCORATION DU TERRAIN  ===================== */
  decorItems: [
    { id:'fleurs',        name:'Parterre de fleurs', emoji:'🌼', price:20,  w:1, h:1, kind:'plante' },
    { id:'buisson',       name:'Buisson',            emoji:'🌿', price:25,  w:1, h:1, kind:'plante' },
    { id:'cailloux',      name:'Tas de cailloux',    emoji:'🪨', price:25,  w:1, h:1, kind:'deco' },
    { id:'cloture',       name:'Barrière',           emoji:'🚧', price:30,  w:1, h:1, kind:'cloture' },
    { id:'tonneau',       name:'Tonneau',            emoji:'🛢️', price:35,  w:1, h:1, kind:'deco' },
    { id:'pot',           name:'Pot de fleurs',      emoji:'🪴', price:40,  w:1, h:1, kind:'plante' },
    { id:'panneau',       name:'Panneau',            emoji:'🪧', price:45,  w:1, h:1, kind:'deco' },
    { id:'boite_lettres', name:'Boîte aux lettres',  emoji:'📫', price:50,  w:1, h:1, kind:'deco' },
    { id:'foin',          name:'Botte de foin',      emoji:'🌾', price:55,  w:1, h:1, kind:'deco' },
    { id:'tournesol',     name:'Tournesol',          emoji:'🌻', price:60,  w:1, h:1, kind:'plante' },
    { id:'coffre',        name:'Coffre au trésor',   emoji:'🧰', price:70,  w:1, h:1, kind:'meuble' },
    { id:'table',         name:'Table de jardin',    emoji:'🪑', price:80,  w:1, h:1, kind:'meuble' },
    { id:'carre_potager', name:'Carré de potager',   emoji:'🥕', price:90,  w:1, h:1, kind:'potager' },
    { id:'ruche',         name:'Ruche',              emoji:'🐝', price:100, w:1, h:1, kind:'deco' },
    { id:'ancre',         name:'Tonneau du marin',   emoji:'⚓', price:100, w:1, h:1, kind:'deco' },
    { id:'lit',           name:'Lit de camp',        emoji:'🛏️', price:110, w:1, h:1, kind:'meuble' },
    { id:'buisson2',      name:'Grand buisson',      emoji:'🌳', price:120, w:1, h:1, kind:'plante' },
    { id:'poule',         name:'Poule',              emoji:'🐔', price:130, w:1, h:1, kind:'animal' },
    { id:'mouton',        name:'Mouton',             emoji:'🐑', price:160, w:1, h:1, kind:'animal' },
    { id:'sapin',         name:'Sapin',              emoji:'🌲', price:170, w:1, h:2, kind:'plante' },
    { id:'arbre',         name:'Arbre',              emoji:'🌳', price:180, w:1, h:2, kind:'plante' },
    { id:'vache',         name:'Vache',              emoji:'🐄', price:200, w:1, h:1, kind:'animal' },
    { id:'foyer_abrite',  name:'Foyer abrité',       emoji:'🔥', price:140, w:1, h:1, kind:'deco' }
  ],

  badges: [
    { id: 'ocean', name: 'Protecteur de l\'océan', emoji: '🌊', desc: "Tu as terminé la sortie en mer." },
    { id: 'potager', name: 'Ami du potager', emoji: '🌱', desc: "Tu as terminé la journée à la ferme." },
    { id: 'feu', name: 'Gardien du feu', emoji: '🔥', desc: "Tu as rallumé et entretenu le feu du campement." },
    { id: 'banquier', name: 'Petit épargnant', emoji: '🏦', desc: "Tu as placé ton argent pour la première fois." },
    { id: 'decorateur', name: 'Décorateur', emoji: '🎨', desc: "Tu as posé 5 objets sur ton terrain." },
    { id: 'curieux', name: 'Grand curieux', emoji: '📖', desc: "Tu as rempli 10 fiches d'encyclopédie." }
  ],

  /* =====================  NIVEAUX  ===================== */
  levels: [
    { level: 1, name: 'Petit Curieux', need: 0 },
    { level: 2, name: 'Explorateur', need: 120 },
    { level: 3, name: 'Aventurier du Savoir', need: 320 },
    { level: 4, name: 'Grand Découvreur', need: 650 },
    { level: 5, name: 'Gardien du Monde', need: 1100 }
  ],

  /* =====================  PERSONNAGES  ===================== */
  npcs: [
    {
      id: 'marin', name: 'Capitaine Marin', role: 'Pêcheur', emoji: '⚓',
      x: 0, z: 0,
      look: { skin: 2, hair: 5, hairColor: 7, outfit: 0, hat: 'casquette' },
      greetings: ["Salut moussaillon !", "La mer est calme aujourd'hui."],
      idle: ["Une bonne pêche demande de la patience.", "Tu as vu ces mouettes ?"],
      afterQuest: ["Merci pour l'océan, matelot !"]
    },
    {
      id: 'maya', name: 'Maya', role: 'Agricultrice', emoji: '🌻',
      x: 0, z: 0,
      look: { skin: 4, hair: 2, hairColor: 1, outfit: 3, hat: 'chapeau' },
      greetings: ["Bonjour ! Tu tombes bien, il y a du travail.", "Sens un peu cette bonne odeur de terre !"],
      idle: ["Chaque légume a sa saison.", "Mes abeilles travaillent plus que moi."],
      afterQuest: ["Grâce à toi, le potager est magnifique !"]
    },
    {
      id: 'awa', name: 'Awa', role: 'Banquière', emoji: '🏦',
      x: 0, z: 0,
      look: { skin: 6, hair: 3, hairColor: 0, outfit: 5, hat: 'aucun' },
      greetings: ["Bienvenue à la banque du village !", "Tu veux faire grandir tes piécettes ?"],
      idle: ["Épargner, c'est mettre de côté pour plus tard.", "On ne place jamais tout au même endroit."],
      afterQuest: ["Bravo, te voilà un vrai petit épargnant."]
    },
    {
      id: 'theo', name: 'Théo', role: 'Commerçant', emoji: '🛒',
      x: 0, z: 0,
      look: { skin: 1, hair: 4, hairColor: 3, outfit: 2, hat: 'bonnet' },
      greetings: ["Entre, entre ! Regarde mes nouveautés.", "Aujourd'hui, les fruits sont superbes."],
      idle: ["Je préfère vendre ce qui pousse près d'ici.", "Range bien ta monnaie, on ne sait jamais !"],
      afterQuest: ["Reviens quand tu veux, client préféré !"]
    },
    {
      id: 'lina', name: 'Lina', role: 'Enfant du village', emoji: '🪁',
      x: 0, z: 0,
      look: { skin: 3, hair: 1, hairColor: 2, outfit: 6, hat: 'aucun' },
      greetings: ["Tu joues avec moi ?", "J'ai trouvé un coquillage tout rose !"],
      idle: ["Un jour, j'irai voir la mer en bateau.", "Tu cours plus vite que moi ? On verra bien !"],
      afterQuest: ["Tu es le meilleur copain du village !"]
    },
    {
      id: 'elio', name: 'Grand-Père Élio', role: 'Gardien du musée', emoji: '📚',
      x: 0, z: 0,
      look: { skin: 0, hair: 6, hairColor: 6, outfit: 4, hat: 'beret' },
      greetings: ["Approche, jeune curieux.", "Chaque objet ici raconte une histoire."],
      idle: ["Avant la monnaie, on échangeait des objets.", "Mes lunettes… je les avais il y a une minute."],
      afterQuest: ["Tu as une belle mémoire, garde-la bien."]
    },
    {
      id: 'noor', name: 'Noor', role: 'Astronome', emoji: '🔭',
      x: 0, z: 0,
      look: { skin: 5, hair: 0, hairColor: 4, outfit: 7, hat: 'aucun' },
      greetings: ["Chut… je regarde le ciel.", "Ce soir, on verra peut-être Jupiter."],
      idle: ["Le Soleil est une étoile, tout près de nous.", "La nuit, on voit mieux après dix minutes dans le noir."],
      afterQuest: ["Tu as la tête dans les étoiles, c'est parfait."]
    },
    {
      id: 'sacha', name: 'Sacha', role: 'Chef de gare', emoji: '🚂',
      x: 0, z: 0,
      look: { skin: 2, hair: 7, hairColor: 5, outfit: 1, hat: 'casquette' },
      greetings: ["Le train de midi est à l'heure !", "Tu pars en voyage aujourd'hui ?"],
      idle: ["D'ici, on peut aller très loin.", "Un coup de sifflet, deux valises, et hop !"],
      afterQuest: ["Bon voyage, et reviens nous voir !"]
    },
    {
      id: 'ayla', name: 'Ayla', role: 'Gardienne du campement', emoji: '🔥',
      x: 0, z: 0,
      look: { skin: 3, hair: 2, hairColor: 6, outfit: 3, hat: 'aucun' },
      greetings: ["Le feu du campement s'est éteint cette nuit...", "Il va nous falloir un peu d'aide avant la nuit prochaine."],
      idle: ["Le bois mort suffit toujours, inutile de couper un arbre vivant.", "Un feu bien entretenu se transmet, il ne s'invente pas chaque soir."],
      afterQuest: ["Grâce à toi, le foyer tient bon toute la nuit."]
    }
  ],

  /* =====================  PETITES CONVERSATIONS  ===================== */
  npcChats: [
    { a: 'marin', b: 'maya', lines: ["Tu as vu la marée ce matin ?", "Parfaite pour mes semis !"] },
    { a: 'awa', b: 'theo', lines: ["Tes clients gardent-ils un peu de monnaie ?", "Les plus malins, oui !"] },
    { a: 'lina', b: 'elio', lines: ["C'est vrai qu'avant, il n'y avait pas de pièces ?", "On échangeait du sel contre du blé."] },
    { a: 'noor', b: 'sacha', lines: ["Cette nuit, le ciel sera très clair.", "Je regarderai depuis le quai !"] },
    { a: 'maya', b: 'theo', lines: ["Mes courgettes sont prêtes.", "Je les prends toutes : elles viennent d'à côté !"] },
    { a: 'ayla', b: 'marin', lines: ["Le vent tourne, ce soir.", "Alors protège bien ta flamme !"] }
  ],

  /* =====================  ASTUCES  ===================== */
  tips: [
    "Astuce : clique sur un personnage pour lui parler.",
    "Astuce : maintiens le clic de la souris pour marcher dans le village.",
    "Astuce : chaque fiche découverte se range toute seule dans ton encyclopédie.",
    "Astuce : dans notre jeu, on relâche les petits poissons pour qu'ils grandissent.",
    "Astuce : un fruit de saison a souvent voyagé moins loin pour arriver chez toi.",
    "Astuce : les piécettes gagnées dans les missions servent à décorer ton terrain.",
    "Astuce : quand on place son argent, ça monte et ça descend. Sois patient !",
    "Astuce : trie bien les déchets, chaque poubelle a sa couleur.",
    "Astuce : au campement, un bois humide fume au lieu de prendre feu.",
    "Astuce : n'oublie jamais d'éteindre complètement le feu avant de partir."
  ]
};
