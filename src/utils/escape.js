// Escape : une maison vue du dessus, découpée en pièces reliées par des portes.
// Fonctions pures (génération de la maison, chemins, déplacements du monstre),
// utilisées par hooks/useEscape.js.

// Taille de départ de la maison (colonnes × rangées). Elle grandit à chaque manche.
export const SIZES = { small: [4, 3], medium: [4, 4], large: [5, 5], huge: [6, 6] };
export const MAX_SIDE = 7;
// Le monstre te poursuit en temps réel : il passe une porte toutes les N
// millisecondes, toujours par le plus court chemin vers toi.
export const MONSTER_MS = { slow: 3200, normal: 2400, fast: 1700 };
// Répit au début de chaque maison, avant qu'il se lance à ta poursuite.
export const MONSTER_GRACE = 2000;
// Temps qu'on met pour résoudre un calcul et changer de pièce (pour vérifier qu'une maison est jouable).
const FAIR_PLAYER_MS = 1300;

export const DIRS = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
export const cellOf = (house, c, r) => r * house.cols + c;
export const coordsOf = (house, cell) => [cell % house.cols, Math.floor(cell / house.cols)];

/** Pièce voisine dans une direction, ou null si on sort de la maison. */
export function neighborIn(house, cell, dir) {
    const [c, r] = coordsOf(house, cell);
    const [dc, dr] = DIRS[dir];
    const nc = c + dc;
    const nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= house.cols || nr >= house.rows) return null;
    return cellOf(house, nc, nr);
}

export const hasDoor = (house, a, b) => house.doors.includes(edgeKey(a, b));
export const wallKey = edgeKey;

/** Pièces accessibles depuis "cell" (par une porte). */
export function exits(house, cell) {
    return Object.keys(DIRS)
        .map((dir) => neighborIn(house, cell, dir))
        .filter((n) => n !== null && hasDoor(house, cell, n));
}

/** Distances (en nombre de portes) depuis une pièce, et la pièce précédente sur le plus court chemin. */
export function bfs(house, from) {
    const size = house.cols * house.rows;
    const dist = Array(size).fill(Infinity);
    const prev = Array(size).fill(-1);
    dist[from] = 0;
    const queue = [from];
    while (queue.length) {
        const cell = queue.shift();
        exits(house, cell).forEach((n) => {
            if (dist[n] === Infinity) {
                dist[n] = dist[cell] + 1;
                prev[n] = cell;
                queue.push(n);
            }
        });
    }
    return { dist, prev };
}

/** Prochaine pièce sur le plus court chemin de "from" vers "to". */
export function stepToward(house, from, to) {
    if (from === to) return from;
    const { prev } = bfs(house, to);
    return prev[from] === -1 ? from : prev[from];
}

const pick = (list, rand) => list[Math.min(list.length - 1, Math.floor(rand * list.length))];

/**
 * Crée une maison : un labyrinthe parfait (toutes les pièces reliées), plus quelques
 * portes en trop pour qu'il existe plusieurs chemins. Le joueur part d'un coin,
 * la sortie est la pièce la plus éloignée, le monstre est placé loin du joueur.
 */
function buildHouse(cols, rows, random) {
    const house = { cols, rows, doors: [] };
    const size = cols * rows;
    // Comme dans la vidéo : toutes les portes sont ouvertes, on peut aller dans
    // n'importe quelle pièce voisine.
    for (let cell = 0; cell < size; cell++) {
        if ((cell + 1) % cols !== 0) house.doors.push(edgeKey(cell, cell + 1));
        if (cell + cols < size) house.doors.push(edgeKey(cell, cell + cols));
    }
    const corners = [0, cols - 1, size - cols, size - 1];
    house.start = pick(corners, random());
    const { dist } = bfs(house, house.start);
    const far = Math.max(...dist);
    house.exit = pick(dist.map((d, i) => (d >= far - 1 ? i : -1)).filter((i) => i >= 0 && i !== house.start), random());
    // Le monstre démarre loin de toi, et à l'écart du chemin le plus court vers la sortie :
    // il te barre rarement la route dès le départ, mais il te poursuit dès que tu hésites.
    const path = [];
    for (let cell = house.exit, prevMap = bfs(house, house.start).prev; cell !== -1; cell = prevMap[cell]) path.push(cell);
    const fromPath = Array(size).fill(Infinity);
    path.forEach((cell) => {
        const d = bfs(house, cell).dist;
        d.forEach((v, i) => { fromPath[i] = Math.min(fromPath[i], v); });
    });
    const minGap = Math.max(3, Math.round(far * 0.5));
    const candidates = dist.map((d, i) => i).filter((i) => i !== house.exit && dist[i] >= minGap);
    const pool = candidates.length ? candidates : dist.map((d, i) => i).filter((i) => i !== house.exit && i !== house.start);
    const bestGap = Math.max(...pool.map((i) => fromPath[i]));
    house.monster = pick(pool.filter((i) => fromPath[i] >= Math.min(2, bestGap)), random());
    house.shortest = dist[house.exit];
    return house;
}

/** Chemin le plus court vers la sortie qui évite la pièce du monstre (prochaine pièce, ou null). */
function nextAvoiding(house, from, monster) {
    const size = house.cols * house.rows;
    const dist = Array(size).fill(Infinity);
    const prev = Array(size).fill(-1);
    dist[house.exit] = 0;
    const queue = [house.exit];
    while (queue.length) {
        const cell = queue.shift();
        exits(house, cell).forEach((n) => {
            if (n !== monster && dist[n] === Infinity) {
                dist[n] = dist[cell] + 1;
                prev[n] = cell;
                queue.push(n);
            }
        });
    }
    return prev[from] === -1 ? null : prev[from];
}

/**
 * Partie équitable ? On simule un joueur qui choisit toujours le bon chemin (une pièce
 * toutes les 1,1 s) contre le monstre le plus rapide : il doit pouvoir s'échapper.
 */
function isFair(house) {
    let player = house.start;
    let monster = house.monster;
    let nextPlayer = FAIR_PLAYER_MS;
    let nextMonster = MONSTER_GRACE;
    for (let t = 0; t < 60000; t += 10) {
        if (t >= nextPlayer) {
            nextPlayer += FAIR_PLAYER_MS;
            const n = nextAvoiding(house, player, monster);
            if (n !== null) player = n;
            if (player === house.exit) return true;
        }
        if (t >= nextMonster) {
            nextMonster += MONSTER_MS.fast;
            monster = stepToward(house, monster, player);
            if (monster === player) return false;
        }
    }
    return false;
}

/** Crée une maison jouable : on recommence tant que la poursuite est perdue d'avance. */
export function generateHouse(cols, rows, random = Math.random) {
    let house = buildHouse(cols, rows, random);
    for (let i = 0; i < 40 && !isFair(house); i++) house = buildHouse(cols, rows, random);
    return house;
}

/** Taille de la maison pour une manche donnée (elle grandit d'une rangée ou d'une colonne par manche). */
export function sizeForRound(size, round) {
    const [cols, rows] = SIZES[size] ?? SIZES.small;
    const k = round - 1;
    return [Math.min(MAX_SIDE, cols + Math.ceil(k / 2)), Math.min(MAX_SIDE, rows + Math.floor(k / 2))];
}

/** Petit générateur pseudo-aléatoire reproductible (pour garder le reducer pur). */
export function seeded(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Les portes proposées depuis une pièce : toutes les voisines sauf celle d'où l'on
 * vient (pas de demi-tour), au moins 2 (on autorise le demi-tour dans un coin) et
 * au plus 3.
 */
export function roomDoors(house, cell, cameFrom, rand) {
    const all = Object.keys(DIRS)
        .map((dir) => ({ dir, cell: neighborIn(house, cell, dir) }))
        .filter((d) => d.cell !== null && hasDoor(house, cell, d.cell));
    let doors = all.filter((d) => d.cell !== cameFrom);
    if (doors.length < 2) doors = all;
    while (doors.length > 3) doors.splice(Math.floor(rand() * doors.length), 1);
    return doors;
}

/** Nombre de réponses différentes possibles avec cette séquence (au moins 3 pour jouer). */
export const distinctTargets = (candidates) => new Set(candidates.map((c) => c.target)).size;

/**
 * Le calcul de chaque porte, à la façon de WordSwap Calc : « émoji ± chiffre »,
 * dont la réponse est l'élément de la séquence à la position obtenue. Les réponses
 * des portes sont toutes différentes, et ce sont exactement les solutions proposées.
 */
export function doorCalcs(sequence, candidates, doors, rand) {
    const pool = [...candidates];
    const usedTargets = new Set();
    const calcs = doors.map((door) => {
        const fresh = pool.filter((c) => !usedTargets.has(c.target));
        const chosen = pick(fresh.length ? fresh : pool, rand());
        usedTargets.add(chosen.target);
        return {
            ...door,
            item: sequence[chosen.emoIdx],
            op: chosen.op,
            value: chosen.value,
            answer: sequence[chosen.target],
            answerPosition: chosen.target + 1,
        };
    });
    const options = calcs.map((c) => c.answer);
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return { calcs, options };
}

/**
 * Le monstre avance d'une pièce : il traque le joueur s'il l'a entendu ou s'il est
 * tout près, sinon il erre au hasard (sans revenir sur ses pas si possible).
 */
export function monsterMove(house, monster, player, { hunting, previous, rand }) {
    const near = bfs(house, monster).dist[player] <= 2;
    if (hunting || near) return stepToward(house, monster, player);
    const options = exits(house, monster).filter((n) => n !== previous);
    const list = options.length ? options : exits(house, monster);
    return list.length ? pick(list, rand) : monster;
}

/** Score d'une manche, en % : 0 si attrapé, sinon 6 % de moins par pièce de détour (calcul raté). */
export function roundScore({ escaped, moves, shortest }) {
    if (!escaped) return 0;
    return Math.max(40, 100 - Math.max(0, moves - shortest) * 6);
}
