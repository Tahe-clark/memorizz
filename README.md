# MEM’ORIZZ

Site de jeux de mémoire, en français et en anglais (bouton FR/EN en haut à droite).

## Lancer le projet

```bash
npm install
npm run dev      # serveur de développement
npm run build    # version de production dans dist/
npm run lint     # vérification du code (oxlint)
```

## Les jeux

| Jeu | État |
| --- | --- |
| WordSwap Calc | Jouable |
| Battle 🥊 | Jouable (contre un ami ou contre l’ordinateur) |
| Escape 🚪 | Jouable (seul, en 2D ou en 3D) |

**WordSwap Calc** : une séquence de chiffres (1 à n) où certains chiffres sont remplacés par des émojis. Chaque émoji vaut sa position. Après la phase de mémorisation, les tuiles se retournent et il faut résoudre « émoji ± chiffre » pour retrouver l’élément à la position obtenue. Trois manches par partie ; le score perd 5 points par essai raté et 2 points par seconde de réflexion au-delà de 5 s (le temps de mémorisation ne compte pas).

**Battle 🥊** : le duel de WordSwap Calc, à deux sur le même clavier ou seul contre l’ordinateur (trois niveaux : il répond plus ou moins vite et se trompe plus ou moins souvent ; réglages dans `CPU_LEVELS`, en haut de `src/hooks/useBattle.js`). À deux (joueur de gauche : touches Q W E R T ; joueur de droite : touches 1 2 3 4 5, ou clic/toucher). Les deux joueurs mémorisent la même séquence, puis les calculs s’enchaînent : le premier qui trouve frappe l’autre (3 coups = K.O.). Sur une mauvaise réponse, le joueur frappe dans le vide : l’adversaire esquive, contre-attaque, et le fautif perd de la vie (un demi-coup). Le match se joue en 3 manches (2 manches gagnantes). Le combat se déroule sur un ring de boxe (cordes, poteaux, public). Chaque joueur choisit un avatar (console, tour, télé, radio) et le personnalise : couleur, accessoire, couleur des gants de boxe et danse de victoire. Le gagnant d’une manche fait sa danse sous les confettis, et le match se termine sur un podium (en 2D ou en 3D selon l’affichage choisi). Chaque avatar a sa propre animation de repos et sa façon de fêter une victoire, et son visage change selon sa vie (sûr de lui, inquiet, puis en difficulté). Un annonceur dit « Round 1 », « Final round », « Fight! » et « K.O.! » (synthèse vocale du navigateur). Le combat suit le tempo de la musique : chaque calcul arrive sur un temps et les coups touchent sur la croche suivante (le premier joueur qui appuie est retenu aussitôt). Avant le combat, on choisit l’affichage : **2D** (vue de côté, à plat) ou **3D** (vraie 3D avec Three.js, `src/three/Battle3D.jsx` : ring sous les projecteurs avec public et flashs, avatars articulés qui boxent, esquivent, contre-attaquent, tombent K.O. et dansent ; coup final tiré au hasard parmi cinq clins d'œil aux animes (rayon d'énergie « Kaméha… MÉMO ! », bras élastique « Gum-Gum… PISTOL ! », rafale de poings « ORA ORA ORA », sphère tourbillonnante « Rasen… MEMORIZZ ! » et bombe d'énergie géante « Prêtez-moi votre énergie ! »), avec cri de l'annonceur et bruitages ; code dans `src/three/finishers.js`, et `?finisher=kame` (ou gum, rafale, rasen, genki) dans l'adresse impose un coup pour tester ; si le navigateur ne gère pas WebGL, la version en CSS 3D prend le relais). Les réglages du combat (dégâts, durée d’un calcul, nombre de manches) sont en haut de `src/hooks/useBattle.js`.

**Le coup final** : dans la dernière manche, le K.O. est précédé d’une transformation. Le gagnant se charge d’une aura dorée, donne un coup de poing géant, et l’adversaire s’envole hors du ring.

**Le duel au Far West** : pendant un combat, une boule de cactus tombe parfois sur le ring (un peu plus d’une manche sur deux) et y reste jusqu’à la fin de la manche. Si un joueur clique dessus (ou appuie sur Espace), le combat part dans le désert : cinématique, avatars en cowboys, et un calcul avec un seul essai chacun. Bonne réponse : on tire et on gagne la manche. Mauvaise réponse : la balle rate sa cible et l’autre peut tirer quand il veut. Le duel existe en 2D et en 3D (selon l’affichage choisi ; en 3D : désert au coucher du soleil, mesas, cactus, virevoltant, cowboys avec chapeau et revolver, éclair, fumée et trajectoire de la balle) et peut être désactivé dans les réglages du combat (« Épreuve du cowboy »). La musique du duel est le fichier `public/duel.mp3` (remplaçable par n’importe quel autre morceau du même nom). Pour tester, ajouter `?cactus` à l’adresse de la page fait tomber la boule à chaque manche. Les réglages (fréquence, durée) sont en haut de `src/hooks/useBattle.js`.

**Escape 🚪** : inspiré d'une vidéo où l'on guide quelqu'un dans une maison hantée, sauf qu'ici c'est le calcul rapide qui guide. La maison est vue du dessus (2D) ou en perspective (3D) ; aucune porte n'est verrouillée. Au début de chaque maison, la séquence à mémoriser (comme dans WordSwap Calc, chiffres et émojis) s'affiche en très grand par-dessus la maison. Ensuite le jeu présente la maison (« Toi », « Sortie », « Monstre », le monstre rugit), puis un compte à rebours « 3, 2, 1… Fuis ! » lance la poursuite : les cartes se retournent et le monstre poursuit le joueur en temps réel, par le plus court chemin. Depuis sa pièce, le joueur se voit proposer 2 portes (dans un coin) ou 3 portes (ailleurs, sans compter celle d'où il vient) : chacune affiche un calcul « émoji ± chiffre » dans la pièce voisine, et les réponses proposées sous la maison sont exactement les réponses de ces calculs. Cliquer une réponse (ou taper 1, 2 ou 3) emmène derrière la porte correspondante, et la carte de la réponse se retourne un instant pour vérifier. Un calcul raté envoie donc derrière une autre porte, parfois vers le monstre. Quand il est à deux portes ou moins, le cœur s'emballe et l'écran pulse en rouge ; s'il attrape le joueur, il bondit plein écran. Chaque manche, la maison grandit. Réglages : ceux de WordSwap Calc (temps de mémorisation, longueur de la séquence, nombre d'émojis, thème), puis taille de la maison, vitesse du monstre, nombre de manches et vue 2D ou 3D. Le code est dans `src/utils/escape.js` (maison, portes, calculs, poursuite) et `src/hooks/useEscape.js`. En vue 3D, Escape est rendu en vraie 3D avec Three.js (`src/three/Escape3D.jsx`, modèles construits en code dans `src/three/models.js`) : toute la maison est vue de haut et de biais, caméra fixe comme dans la vidéo (elle tourne autour de la maison pendant la présentation, puis se pose). Le personnage marche vraiment : il se tourne dans la direction où il va, pousse la porte (chaque porte pivote sur ses gonds puis se referme) et la traverse. Le monstre est une créature décharnée (crâne aux orbites rouges, mâchoire qui s'ouvre, cornes, côtes, cape en lambeaux, bras à griffes, brume rouge) qui avance par saccades et défonce les portes. Les portes proposées luisent, en rouge si le monstre est derrière. S'il t'attrape, la capture est jouée en 3D : il se retourne, bondit mâchoire ouverte et bras écartés, et la caméra fonce sur son visage. Les animations sont dans `src/three/rig.js` (poses amorties : marche, garde, célébrations) et le socle 3D commun dans `src/three/engine.js`. Ce code n'est téléchargé que si la vue 3D est choisie, et si le navigateur ne gère pas la 3D, l'ancienne vue en perspective CSS prend le relais. La musique d'Escape est le fichier `public/escape.mp3`, joué en boucle pendant toute la partie (coupé sur des mesures entières pour que la boucle ne s'entende pas). L'aventurier reprend l'avatar du joueur 1 de Battle. Score : 100 % par maison réussie, moins 6 % par pièce de détour.

## Organisation du code

```
src/
  App.jsx                 navigation entre les vues (accueil, réglages, jeu, bilan)
  i18n/                   traductions FR/EN (translations.js) et fournisseur de langue
  data/games.js           catalogue des jeux affichés sur l'accueil
  data/themes.js          thèmes d'émojis
  data/avatars.js         avatars, couleurs et accessoires du mode Battle
  utils/wordswap.js       logique pure de WordSwap (génération des manches, score)
  hooks/useGame.js        état d'une partie WordSwap (minuterie, réponses, manches)
  hooks/useBattle.js      état d'un combat Battle (vie, coups, manches, minuteries)
  utils/audio.js          bruitages synthétisés (Web Audio), avec bouton pour couper le son
  utils/music.js          musique de fond : public/music.mp3 (sinon un beat généré) et horloge du
                          tempo (BPM et premier temps du morceau) sur laquelle Battle se cale
  utils/announcer.js      voix de l'annonceur : fichiers public/voice/<id>.mp3, sinon synthèse vocale
  utils/theme.js          mode clair / sombre (suit le système tant qu'aucun choix n'est fait)
  utils/storage.js        lecture/écriture localStorage (langue, son, record, réglages)
  components/             Header, Footer, Home, GameConfig, GameBoard, GameOver, Tile, LoginModal
                          Battle : BattleBoard, Arena (2D, en SVG), Stage3D (vraie 3D, Three.js) et Arena3D (CSS 3D, en secours),
                          Avatar (dessin des personnages), PlayerEditor, Confetti, BattleOver (podium),
                          HomeParade (12 scènes animées de l'accueil ; ?scene=nom dans l'adresse en rejoue une),
                          DuelScene (duel au Far West)
  three/                  vraie 3D (Three.js, chargée seulement en vue 3D) : engine (rendu, bloom,
                          boucle), models (avatars articulés, monstre), rig (animations),
                          Escape3D (maison hantée), Battle3D (ring, duel, podium)
```

## Réglages

L'écran « Préparer la partie » est commun aux trois jeux (`src/components/ConfigParts.jsx`) : des sections titrées, une ligne par réglage (le nom à gauche, le contrôle à droite), des sélecteurs en pilule, des compteurs compacts et un interrupteur. Les réglages de la séquence (temps, longueur, émojis, thème) sont le même bloc partout (`SequenceSettings`).

Sur l'accueil, une carte « Prochain jeu » annonce un jeu en cours de développement (entrée `next` de `src/data/games.js`, avec `available: false`).

## Ajouter un jeu

1. Passer `available: true` pour le jeu dans `src/data/games.js`.
2. Ajouter sa description dans `src/i18n/translations.js` (`game.<id>.desc`, en FR et en EN).
3. Créer ses composants et brancher sa vue dans `App.jsx`.

Tous les textes visibles passent par `t('clé')` : ajoute chaque nouvelle clé dans les deux langues.

## Design

L’interface est volontairement douce : fond gris très clair, contours fins, ombres légères, une seule couleur d’accent. Les couleurs et arrondis sont des variables en haut de `src/index.css`. Un mode sombre est disponible (bouton lune/soleil dans l’en-tête) : il redéfinit les mêmes variables sous `:root[data-theme='dark']`. Seules les tuiles de jeu gardent leur style d’origine (contour noir épais, ombre franche) : leur section est marquée « ne pas modifier ».

## Musique

`public/music.mp3` est la musique du jeu (« Smooth Bass », 104 BPM). Les personnages dansent sur son tempo et le mode Battle cale ses calculs et ses coups dessus. Si tu changes de morceau, mets à jour `BPM` et `SONG_FIRST_BEAT` en haut de `src/utils/music.js`.
