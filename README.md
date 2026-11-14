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
| Escape 🚪 | Jouable (seul, en 3D) |

**WordSwap Calc** : une séquence de chiffres (1 à n) où certains chiffres sont remplacés par des émojis. Chaque émoji vaut sa position. Après la phase de mémorisation, les tuiles se retournent et il faut résoudre « émoji ± chiffre » pour retrouver l’élément à la position obtenue. Trois manches par partie ; le score perd 5 points par essai raté et 2 points par seconde de réflexion au-delà de 5 s (le temps de mémorisation ne compte pas).

**Battle 🥊** : le duel de WordSwap Calc, à deux sur le même clavier ou seul contre l’ordinateur (trois niveaux : il répond plus ou moins vite et se trompe plus ou moins souvent ; réglages dans `CPU_LEVELS`, en haut de `src/hooks/useBattle.js`). À deux (joueur de gauche : touches Q W E R T ; joueur de droite : touches 1 2 3 4 5, ou clic/toucher). Les deux joueurs mémorisent la même séquence, puis les calculs s’enchaînent : le premier qui trouve frappe l’autre (3 coups = K.O.). Sur une mauvaise réponse, le joueur frappe dans le vide : l’adversaire esquive, contre-attaque, et le fautif perd de la vie (un demi-coup). Le match se joue en 3 manches (2 manches gagnantes). Le combat se déroule sur un ring de boxe (cordes, poteaux, public). Chaque joueur choisit un avatar (console, tour, télé, radio) et le personnalise : couleur, accessoire, couleur des gants de boxe et danse de victoire. Le gagnant d’une manche fait sa danse sous les confettis, et le match se termine sur un podium en 3D. Chaque avatar a sa propre animation de repos et sa façon de fêter une victoire, et son visage change selon sa vie (sûr de lui, inquiet, puis en difficulté). Un annonceur dit « Round 1 », « Final round », « Fight! » et « K.O.! » (synthèse vocale du navigateur). Le combat suit le tempo de la musique : chaque calcul arrive sur un temps et les coups touchent sur la croche suivante (le premier joueur qui appuie est retenu aussitôt). Le combat est en **3D** (vraie 3D avec Three.js, `src/three/Battle3D.jsx` : ring sous les projecteurs avec public et flashs, avatars articulés qui boxent, esquivent, contre-attaquent, tombent K.O. et dansent ; coup final tiré au hasard parmi cinq clins d'œil aux animes (rayon d'énergie « Kaméha… MÉMO ! », bras élastique « Gum-Gum… PISTOL ! », rafale de poings « ORA ORA ORA », sphère tourbillonnante « Rasen… MEMORIZZ ! » et bombe d'énergie géante « Prêtez-moi votre énergie ! »), avec cri de l'annonceur et bruitages ; code dans `src/three/finishers.js`, et `?finisher=kame` (ou gum, rafale, rasen, genki) dans l'adresse impose un coup pour tester ; si le navigateur ne gère pas WebGL, la version en CSS 3D prend le relais). Les réglages du combat (dégâts, durée d’un calcul, nombre de manches) sont en haut de `src/hooks/useBattle.js`.

**Le coup final** : dans la dernière manche, le K.O. est précédé d’une transformation. Le gagnant se charge d’une aura dorée, donne un coup de poing géant, et l’adversaire s’envole hors du ring.

**Le duel au Far West** : pendant un combat, une boule de cactus tombe parfois sur le ring (un peu plus d’une manche sur deux) et y reste jusqu’à la fin de la manche. Si un joueur clique dessus (ou appuie sur Espace), le combat part dans le désert : cinématique, avatars en cowboys, et un calcul avec un seul essai chacun. Bonne réponse : on tire et on gagne la manche. Mauvaise réponse : la balle rate sa cible et l’autre peut tirer quand il veut. Le duel est en 3D (désert au coucher du soleil, mesas, cactus, virevoltant, cowboys avec chapeau et revolver, éclair, fumée et trajectoire de la balle) et peut être désactivé dans les réglages du combat (« Épreuve du cowboy »). La musique du duel est le fichier `public/duel.mp3` (remplaçable par n’importe quel autre morceau du même nom). Pour tester, ajouter `?cactus` à l’adresse de la page fait tomber la boule à chaque manche. Les réglages (fréquence, durée) sont en haut de `src/hooks/useBattle.js`.

**Escape 🚪** : inspiré d'une vidéo où l'on guide quelqu'un dans une maison hantée, sauf qu'ici c'est le calcul rapide qui guide. La maison est en 3D ; aucune porte n'est verrouillée. Au début de chaque maison, la séquence à mémoriser (comme dans WordSwap Calc, chiffres et émojis) s'affiche en très grand par-dessus la maison. Ensuite le jeu présente la maison (« Toi », « Sortie », « Monstre », le monstre rugit), puis un compte à rebours « 3, 2, 1… Fuis ! » lance la poursuite : les cartes se retournent et le monstre poursuit le joueur en temps réel, par le plus court chemin. Depuis sa pièce, le joueur se voit proposer 2 portes (dans un coin) ou 3 portes (ailleurs, sans compter celle d'où il vient) : chacune affiche un calcul « émoji ± chiffre » dans la pièce voisine, et les réponses proposées sous la maison sont exactement les réponses de ces calculs. Cliquer une réponse (ou taper 1, 2 ou 3) emmène derrière la porte correspondante, et la carte de la réponse se retourne un instant pour vérifier. Un calcul raté envoie donc derrière une autre porte, parfois vers le monstre. Quand il est à deux portes ou moins, le cœur s'emballe et l'écran pulse en rouge ; s'il attrape le joueur, il bondit plein écran. Chaque manche, la maison grandit. Réglages : ceux de WordSwap Calc (temps de mémorisation, longueur de la séquence, nombre d'émojis, thème), puis taille de la maison, vitesse du monstre, et nombre de manches. Le code est dans `src/utils/escape.js` (maison, portes, calculs, poursuite) et `src/hooks/useEscape.js`. Escape est rendu en vraie 3D avec Three.js (`src/three/Escape3D.jsx`, modèles construits en code dans `src/three/models.js`) : toute la maison est vue de haut et de biais, caméra fixe comme dans la vidéo (elle tourne autour de la maison pendant la présentation, puis se pose). Le personnage marche vraiment : il se tourne dans la direction où il va, pousse la porte (chaque porte pivote sur ses gonds puis se referme) et la traverse. Le monstre est une créature décharnée (crâne aux orbites rouges, mâchoire qui s'ouvre, cornes, côtes, cape en lambeaux, bras à griffes, brume rouge) qui avance par saccades et défonce les portes. Les portes proposées luisent, en rouge si le monstre est derrière. S'il t'attrape, la capture est jouée en 3D : il se retourne, bondit mâchoire ouverte et bras écartés, et la caméra fonce sur son visage. Les animations sont dans `src/three/rig.js` (poses amorties : marche, garde, célébrations) et le socle 3D commun dans `src/three/engine.js`. Ce code est téléchargé à part (au lancement de la partie), et si le navigateur ne gère pas la 3D, l'ancienne vue en perspective CSS prend le relais. La musique d'Escape est le fichier `public/escape.mp3`, joué en boucle pendant toute la partie (coupé sur des mesures entières pour que la boucle ne s'entende pas). L'aventurier reprend l'avatar du joueur 1 de Battle. Score : 100 % par maison réussie, moins 6 % par pièce de détour.

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
                          Battle : BattleBoard, Stage3D (vraie 3D, Three.js) et Arena3D (CSS 3D, en secours),
                          Avatar (dessin des personnages), PlayerEditor, Confetti, BattleOver (podium),
                                                    DuelCinematic et DesertBackdrop (duel au Far West)
  three/                  vraie 3D (Three.js, téléchargée à part au lancement d'une partie) : engine (rendu, bloom,
                          boucle), models (avatars articulés, monstre), rig (animations),
                          Escape3D (maison hantée), Battle3D (ring, duel, podium)
```

## Accueil

L'accueil (`src/components/Home.jsx`) est en style « ciné » et toujours sombre. Un jeu est mis à la une en plein écran : l'image change toute seule toutes les 7 secondes, ou au survol d'une carte. Les images sont dans `public/art/` et ont été rendues à partir des vraies scènes 3D du jeu.

À droite, le skin du joueur est affiché en 3D (`src/three/AvatarStage.jsx`) : il respire, suit la souris du regard et fait sa danse de temps en temps. « Personnaliser » ouvre le casier. Ce skin est le même que celui du joueur 1 de Battle et de l'aventurier d'Escape.

Le site est toujours en mode sombre (il n'y a plus de bouton pour changer). La couleur d'accent est un bourgogne (inspiré de l'iPhone 18 Pro) : boutons principaux, tuiles choisies, onglets, anneaux de temps et de score (variables `--bx`, `--bx-hi`, `--bx-text` en bas de `src/index.css`). Le logo est une carte jaune pâle à contour noir avec un cerveau (elle se retourne au survol, dos « ? »), suivie du nom « memorizz » (« zz » en rose bourgogne). La barre de navigation flotte en haut, en verre sombre : logo, onglets avec icônes (Accueil, Jeux, Casier ; Boutique et Amis verrouillés pour l'instant), langue, musique, bruitages et un bouton « Se connecter » bourgogne. Sur tablette, les onglets n'affichent que leurs icônes ; sur téléphone, ils sont masqués. `public/memorizz.svg` (icône d'onglet) est cette même carte. En fond, de petites cartes flottent derrière les jeux et les réglages.

## Casier

Le casier (`src/components/Locker.jsx`), façon Fortnite, est une page entière pour habiller son personnage : les catégories à gauche (Personnage, Couleur, Tête, Dos, Gants, Danse), le personnage en grand au centre, en 3D sur un socle lumineux (on le fait tourner en le glissant), et les objets à droite. Les vignettes des objets sont rendues en 3D à la volée avec le skin du joueur (`src/three/thumbs.js`). Il y a 24 couleurs de corps et 16 couleurs de gants, plus une couleur personnalisée au choix. Pour la tête : 14 choix (couronne, casquette, nœud, lunettes, chapeau de cowboy, casque audio, chapeau de sorcier, auréole, cornes, bandeau ninja, bonnet, chapeau de fête, haut-de-forme). Pour le dos : katana, cape, ailes, jetpack ou sac à dos. Il y a 8 danses. Les objets sont modélisés en code dans `src/three/models.js` et apparaissent aussi dans les jeux en 3D. Plus tard, la boutique ajoutera ici les objets achetés.

En dessous, une rangée présente tous les jeux, avec la carte « Prochain jeu ».  Les emojis ne servent que sur les cartes du jeu ; ailleurs, ce sont des icônes.

## Mémorisation (WordSwap Calc et Battle)

Au début de la mémorisation, les cartes sont distribuées une à une avec un petit bruit de carte (`src/hooks/useMemoShow.js`). Ensuite plus rien ne bouge, pour mémoriser tranquillement. Un anneau montre le temps restant (`src/components/MemoTimer.jsx`) et passe au rouge les 3 dernières secondes. À la fin, les cartes se retournent en cascade. La grande carte de jeu de WordSwap Calc a son propre style : une « table » sombre avec un léger halo bourgogne pour les cartes, les positions en pastilles et le conseil dans une bulle.

En Battle 3D, pendant la mémorisation, les boxeurs réfléchissent, une main sous le menton.

## Écrans de fin

Les trois jeux ont le même écran de fin (`src/components/ResultShell.jsx`) : un bandeau avec l'image du jeu, un anneau de score qui se remplit (le nombre défile), un badge « Nouveau record ! », le détail des manches, et les boutons Rejouer (ou Revanche), Changer les réglages et Accueil. Battle y montre le podium en 3D sous les confettis.

## Réglages

L'écran « Préparer la partie » est commun aux trois jeux (`src/components/ConfigParts.jsx`, mise en page `ConfigShell`). Les réglages sont à gauche, sous forme de tuiles à choisir avec une icône ou une petite illustration (mini-cartes du thème, plan de la maison), avec des compteurs et un aperçu en direct de la séquence. À droite, une fiche du jeu montre l'image du jeu, le résumé des choix et le bouton pour lancer la partie. Les réglages de la séquence (temps, longueur, émojis, thème) sont le même bloc partout (`SequenceSettings`).

Dans Battle, chaque joueur a sa carte avec son personnage en 3D (on peut le faire tourner et danser), son nom et ses touches ; « Personnaliser » ouvre le casier complet en plein écran pour ce joueur (`src/components/PlayerCard3D.jsx`).

Par défaut, tous les jeux sont réglés au plus facile : 20 secondes pour mémoriser, 5 cartes dont 1 émoji, petite maison et monstre lent pour Escape, ordinateur facile pour Battle. Quand ces valeurs par défaut changent, on augmente `CONFIG_VERSION` dans `src/App.jsx` : les anciens réglages enregistrés sont alors oubliés une fois (le personnage est gardé).

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
