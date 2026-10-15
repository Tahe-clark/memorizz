// Logique pure de WordSwap Calc (aucune dépendance à React) : facile à tester.

export const LEVELS = {
    easy: { seconds: 20 },
    medium: { seconds: 10 },
    hard: { seconds: 5 },
};

export const TOTAL_ROUNDS = 3; // valeur par défaut, réglable
export const MAX_ROUNDS = 15;
// Nombre de chiffres remplacés par des émojis : de 1 à tous, ou 'random' (au hasard).
export const DEFAULT_EMOJIS = 2;
export const MIN_LENGTH = 5;
export const MAX_LENGTH = 9;

// Mélange de Fisher-Yates (le sort(() => Math.random() - 0.5) n'est pas uniforme).
export function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Nombre d'émojis réellement utilisés : de 1 jusqu'à toute la séquence. */
function emojiCountFor(length, emojis) {
    if (emojis === 'random') return 1 + Math.floor(Math.random() * length);
    const n = Number(emojis);
    return Math.max(1, Math.min(length, Number.isFinite(n) ? n : DEFAULT_EMOJIS));
}

/**
 * Crée une séquence 1..n où quelques chiffres sont remplacés par des émojis.
 * Un émoji vaut sa position (1 = premier élément). "emojis" : un nombre, ou 'random'.
 */
export function createSequence(themeItems, length, emojis = DEFAULT_EMOJIS) {
    const emojiCount = emojiCountFor(length, emojis);
    // On retire jusqu'à obtenir une séquence qui permet au moins un calcul.
    for (;;) {
        // Toutes les positions sont possibles, y compris la première.
        const emojiPositions = shuffle([...Array(length).keys()]).slice(0, emojiCount);
        const picked = shuffle(themeItems).slice(0, emojiCount);
        const sequence = [...Array(length).keys()].map((i) => {
            const slot = emojiPositions.indexOf(i);
            return slot === -1 ? String(i + 1) : picked[slot];
        });
        if (listCandidates(sequence).length > 0) return sequence;
    }
}

const isEmoji = (item) => Number.isNaN(Number(item));

/**
 * Tire une équation « émoji ± chiffre » valide pour la séquence, avec ses
 * réponses possibles. "avoidKey" évite de reposer deux fois de suite la même.
 */
function listCandidates(sequence) {
    const length = sequence.length;
    // Le chiffre du calcul est pris parmi les chiffres restés visibles ; si la
    // séquence n'en a plus (ou aucun ne convient), n'importe quel chiffre de 1 à n-1.
    const build = (values) => {
        const list = [];
        values.forEach((value) => {
            sequence.forEach((other, emoIdx) => {
                if (!isEmoji(other)) return;
                const emojiValue = emoIdx + 1;
                if (emojiValue + value <= length) list.push({ op: '+', value, emoIdx, target: emojiValue + value - 1 });
                if (emojiValue - value >= 1) list.push({ op: '-', value, emoIdx, target: emojiValue - value - 1 });
            });
        });
        return list;
    };
    const digits = sequence.filter((item) => !isEmoji(item)).map(Number);
    let candidates = build(digits);
    if (candidates.length === 0) candidates = build([...Array(length - 1).keys()].map((k) => k + 1));
    return candidates;
}

export function createEquation(sequence, optionCount = 4, avoidKey = null) {
    // On liste toutes les équations valides puis on en tire une au hasard.
    const candidates = listCandidates(sequence);
    const keyOf = (c) => `${c.emoIdx}${c.op}${c.value}`;
    const fresh = candidates.filter((c) => keyOf(c) !== avoidKey);
    // createSequence garantit au moins une équation valide.
    const chosen = pick(fresh.length > 0 ? fresh : candidates);
    const answer = sequence[chosen.target];

    // Distracteurs tirés au hasard dans la séquence (plausibles, mais pas toujours les mêmes).
    const distractors = shuffle(sequence.filter((item) => item !== answer)).slice(0, optionCount - 1);

    return {
        equation: {
            key: keyOf(chosen),
            op: chosen.op,
            value: chosen.value,
            item: sequence[chosen.emoIdx],
            itemPosition: chosen.emoIdx + 1,
            answer,
            answerPosition: chosen.target + 1,
        },
        options: shuffle([answer, ...distractors]),
    };
}

/** Une manche solo : une séquence et une équation à 4 réponses. */
export function createRound(themeItems, length, emojis) {
    const sequence = createSequence(themeItems, length, emojis);
    return { sequence, ...createEquation(sequence, 4) };
}

/**
 * Score sur 100 : -5 points par essai raté, -2 points par seconde de réflexion
 * moyenne au-delà de 5 s. Le temps de mémorisation n'est pas compté.
 */
export function computeScore(history) {
    if (history.length === 0) return 0;
    const wrongAttempts = history.reduce((sum, r) => sum + (r.attempts - 1), 0);
    const avgTime = history.reduce((sum, r) => sum + r.time, 0) / history.length;
    let penalty = wrongAttempts * 5;
    if (avgTime > 5) penalty += Math.round(avgTime - 5) * 2;
    return Math.max(10, 100 - penalty);
}
