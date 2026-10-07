// Logique pure de WordSwap Calc (aucune dépendance à React) : facile à tester.

export const LEVELS = {
    easy: { seconds: 20 },
    medium: { seconds: 10 },
    hard: { seconds: 5 },
};

export const TOTAL_ROUNDS = 3;
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

/**
 * Crée une séquence 1..n où quelques chiffres sont remplacés par des émojis.
 * Un émoji vaut sa position (1 = premier élément).
 */
export function createSequence(themeItems, length) {
    const emojiCount = length >= 8 ? 3 : 2;
    // Toutes les positions sont possibles, y compris la première.
    const emojiPositions = shuffle([...Array(length).keys()]).slice(0, emojiCount);
    const emojis = shuffle(themeItems).slice(0, emojiCount);

    return [...Array(length).keys()].map((i) => {
        const slot = emojiPositions.indexOf(i);
        return slot === -1 ? String(i + 1) : emojis[slot];
    });
}

const isEmoji = (item) => Number.isNaN(Number(item));

/**
 * Tire une équation « émoji ± chiffre » valide pour la séquence, avec ses
 * réponses possibles. "avoidKey" évite de reposer deux fois de suite la même.
 */
export function createEquation(sequence, optionCount = 4, avoidKey = null) {
    const length = sequence.length;
    // On liste toutes les équations valides puis on en tire une au hasard.
    const candidates = [];
    sequence.forEach((item) => {
        if (isEmoji(item)) return;
        const value = Number(item);
        sequence.forEach((other, emoIdx) => {
            if (!isEmoji(other)) return;
            const emojiValue = emoIdx + 1;
            if (emojiValue + value <= length) {
                candidates.push({ op: '+', value, emoIdx, target: emojiValue + value - 1 });
            }
            if (emojiValue - value >= 1) {
                candidates.push({ op: '-', value, emoIdx, target: emojiValue - value - 1 });
            }
        });
    });
    const keyOf = (c) => `${c.emoIdx}${c.op}${c.value}`;
    const fresh = candidates.filter((c) => keyOf(c) !== avoidKey);
    // Il existe toujours au moins une équation valide pour 5 ≤ n ≤ 9.
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
export function createRound(themeItems, length) {
    const sequence = createSequence(themeItems, length);
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
