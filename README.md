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
| SequenceFocus | À venir |

**WordSwap Calc** : une séquence de chiffres (1 à n) où certains chiffres sont remplacés par des émojis. Chaque émoji vaut sa position. Après la phase de mémorisation, les tuiles se retournent et il faut résoudre « émoji ± chiffre » pour retrouver l’élément à la position obtenue. Trois manches par partie ; le score perd 5 points par essai raté et 2 points par seconde de réflexion au-delà de 5 s (le temps de mémorisation ne compte pas).

**Battle 🥊** : le duel de WordSwap Calc, à deux sur le même clavier ou seul contre l’ordinateur (trois niveaux : il répond plus ou moins vite et se trompe plus ou moins souvent ; réglages dans `CPU_LEVELS`, en haut de `src/hooks/useBattle.js`). À deux (joueur de gauche : touches Q W E R T ; joueur de droite : touches 1 2 3 4 5, ou clic/toucher). Les deux joueurs mémorisent la même séquence, puis les calculs s’enchaînent : le premier qui trouve frappe l’autre (3 coups = K.O.). Sur une mauvaise réponse, le joueur frappe dans le vide : l’adversaire esquive, contre-attaque, et le fautif perd de la vie (un demi-coup). Le match se joue en 3 manches (2 manches gagnantes). Le combat se déroule sur un ring de boxe (cordes, poteaux, public). Chaque joueur choisit un avatar (console, tour, télé, radio) et le personnalise : couleur, accessoire, couleur des gants de boxe et danse de victoire. Le gagnant d’une manche fait sa danse sous les confettis, et le match se termine sur un podium (en 2D ou en 3D selon l’affichage choisi). Chaque avatar a sa propre animation de repos et sa façon de fêter une victoire, et son visage change selon sa vie (sûr de lui, inquiet, puis en difficulté). Un annonceur dit « Round 1 », « Final round », « Fight! » et « K.O.! » (synthèse vocale du navigateur). Le combat suit le tempo de la musique : chaque calcul arrive sur un temps et les coups touchent sur la croche suivante (le premier joueur qui appuie est retenu aussitôt). Avant le combat, on choisit l’affichage : **2D** (vue de côté, à plat) ou **3D** (personnages en volume sur un ring en perspective, en CSS 3D, sans bibliothèque). Les réglages du combat (dégâts, durée d’un calcul, nombre de manches) sont en haut de `src/hooks/useBattle.js`.

**Le coup final** : dans la dernière manche, le K.O. est précédé d’une transformation. Le gagnant se charge d’une aura dorée, donne un coup de poing géant, et l’adversaire s’envole hors du ring.

**Le duel au Far West** : pendant un combat, une boule de cactus tombe parfois sur le ring (un peu plus d’une manche sur deux) et y reste jusqu’à la fin de la manche. Si un joueur clique dessus (ou appuie sur Espace), le combat part dans le désert : cinématique, avatars en cowboys, et un calcul avec un seul essai chacun. Bonne réponse : on tire et on gagne la manche. Mauvaise réponse : la balle rate sa cible et l’autre peut tirer quand il veut. Le duel existe en 2D et en 3D (selon l’affichage choisi) et peut être désactivé dans les réglages du combat (« Épreuve du cowboy »). La musique du duel est le fichier `public/duel.mp3` (remplaçable par n’importe quel autre morceau du même nom). Pour tester, ajouter `?cactus` à l’adresse de la page fait tomber la boule à chaque manche. Les réglages (fréquence, durée) sont en haut de `src/hooks/useBattle.js`.

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
                          Battle : BattleBoard, Arena (2D, en SVG), Arena3D (blocs en CSS 3D),
                          Avatar (dessin des personnages), PlayerEditor, Confetti, BattleOver (podium),
                          HomeParade (12 scènes animées de l'accueil ; ?scene=nom dans l'adresse en rejoue une),
                          DuelScene (duel au Far West)
```

## Ajouter un jeu

1. Passer `available: true` pour le jeu dans `src/data/games.js`.
2. Ajouter sa description dans `src/i18n/translations.js` (`game.<id>.desc`, en FR et en EN).
3. Créer ses composants et brancher sa vue dans `App.jsx`.

Tous les textes visibles passent par `t('clé')` : ajoute chaque nouvelle clé dans les deux langues.

## Design

L’interface est volontairement douce : fond gris très clair, contours fins, ombres légères, une seule couleur d’accent. Les couleurs et arrondis sont des variables en haut de `src/index.css`. Un mode sombre est disponible (bouton lune/soleil dans l’en-tête) : il redéfinit les mêmes variables sous `:root[data-theme='dark']`. Seules les tuiles de jeu gardent leur style d’origine (contour noir épais, ombre franche) : leur section est marquée « ne pas modifier ».

## Musique

`public/music.mp3` est la musique du jeu (« Smooth Bass », 104 BPM). Les personnages dansent sur son tempo et le mode Battle cale ses calculs et ses coups dessus. Si tu changes de morceau, mets à jour `BPM` et `SONG_FIRST_BEAT` en haut de `src/utils/music.js`.
