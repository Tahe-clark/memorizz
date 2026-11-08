import { useEffect, useReducer, useRef } from 'react';
import { THEMES } from '../data/themes';
import { MONSTER_GRACE, MONSTER_MS, distinctTargets, doorCalcs, generateHouse, roomDoors, roundScore, seeded, sizeForRound, stepToward } from '../utils/escape';
import { LEVELS, createSequence, listCandidates } from '../utils/wordswap';

// Moteur d'Escape, comme dans la vidéo : une maison dont toutes les portes sont
// ouvertes, la sortie verte et un monstre. Au début de chaque maison, on mémorise
// une séquence façon WordSwap Calc (chiffres et émojis). Ensuite les cartes se
// retournent, le monstre se met en chasse, et chaque porte proposée affiche un
// calcul « émoji ± chiffre » : la réponse cliquée t'emmène derrière cette porte.
// Phases : 'memorize' (la séquence en grand) → 'reveal' (on te présente la maison :
// toi, la sortie, le monstre) → 'countdown' (3, 2, 1, fuis !) → 'play'
// → 'escaped' | 'caught' → manche suivante.

const END_PAUSE = 2600; // le temps de voir la fin d'une manche
export const REVEAL_MS = 2900; // présentation de la maison
export const COUNTDOWN_MS = 2800; // 3, 2, 1… fuis !

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Une séquence qui permet au moins trois réponses différentes (une par porte). */
function makeSequence(config) {
    const items = THEMES[config.theme]?.items ?? THEMES.animals.items;
    for (let i = 0; ; i++) {
        const sequence = createSequence(items, config.sequenceLength ?? 7, config.emojis ?? 2);
        const candidates = listCandidates(sequence);
        if (distinctTargets(candidates) >= 3 || i > 60) return { sequence, candidates };
    }
}

function enterRoom(state, cell, cameFrom, seed) {
    const rand = seeded(seed);
    const doors = roomDoors(state.house, cell, cameFrom, rand);
    return { ...state, player: cell, cameFrom, ...doorCalcs(state.sequence, state.candidates, doors, rand) };
}

function newRound(state, config, round, seed) {
    const [cols, rows] = sizeForRound(config.size, round);
    const house = generateHouse(cols, rows);
    const base = {
        ...state,
        ...makeSequence(config),
        round,
        house,
        phase: 'memorize',
        monster: house.monster,
        moves: 0,
        trail: [house.start],
        lastStep: null,
        event: { type: 'round', id: state.event.id + 1 },
    };
    return enterRoom(base, house.start, -1, seed);
}

function finishRound(state, escaped) {
    const result = { round: state.round, escaped, moves: state.moves, shortest: state.house.shortest };
    return {
        ...state,
        phase: escaped ? 'escaped' : 'caught',
        history: [...state.history, { ...result, score: roundScore(result) }],
        event: { type: escaped ? 'escaped' : 'caught', id: state.event.id + 1 },
    };
}

function reducer(state, action) {
    switch (action.type) {
        case 'next':
            return newRound(state, action.config, state.round + 1, action.seed);
        case 'advance': {
            // Chaque étape de la préparation passe à la suivante
            const order = { memorize: 'reveal', reveal: 'countdown', countdown: 'play' };
            if (action.from !== state.phase || !order[state.phase]) return state;
            const phase = order[state.phase];
            return { ...state, phase, event: { type: phase, id: state.event.id + 1 } };
        }
        case 'answer': {
            if (state.phase !== 'play') return state;
            const door = state.calcs.find((c) => c.answer === action.value);
            if (!door) return state;
            const next = {
                ...enterRoom(state, door.cell, state.player, action.seed),
                moves: state.moves + 1,
                trail: state.trail.includes(door.cell) ? state.trail : [...state.trail, door.cell],
                lastStep: { ...door, from: state.player },
                event: { type: 'step', id: state.event.id + 1 },
            };
            if (door.cell === state.monster) return finishRound(next, false);
            if (door.cell === state.house.exit) return finishRound(next, true);
            return next;
        }
        case 'hunt': {
            if (state.phase !== 'play') return state;
            const monster = stepToward(state.house, state.monster, state.player);
            const next = { ...state, monster, event: { type: 'hunt', id: state.event.id + 1 } };
            return monster === state.player ? finishRound(next, false) : next;
        }
        default:
            return state;
    }
}

const INITIAL = { round: 0, history: [], event: { type: 'init', id: 0 } };

export function useEscape(config, onFinished) {
    const rounds = config.rounds ?? 3;
    const seconds = LEVELS[config.level]?.seconds ?? LEVELS.easy.seconds;
    const [state, dispatch] = useReducer(reducer, null, () => newRound(INITIAL, config, 1, newSeed()));
    const finishedRef = useRef(onFinished);
    useEffect(() => {
        finishedRef.current = onFinished;
    });

    // Préparation : mémorisation (séquence en grand), présentation de la maison, compte à rebours.
    const { phase, round } = state;
    useEffect(() => {
        const durations = { memorize: seconds * 1000, reveal: REVEAL_MS, countdown: COUNTDOWN_MS };
        if (!durations[phase]) return undefined;
        const timer = setTimeout(() => dispatch({ type: 'advance', from: phase }), durations[phase]);
        return () => clearTimeout(timer);
    }, [phase, round, seconds]);

    // La traque : le monstre avance tout seul, sans attendre tes réponses.
    const speed = MONSTER_MS[config.monster] ?? MONSTER_MS.normal;
    useEffect(() => {
        if (phase !== 'play') return undefined;
        let interval;
        const start = setTimeout(() => {
            dispatch({ type: 'hunt' });
            interval = setInterval(() => dispatch({ type: 'hunt' }), speed);
        }, MONSTER_GRACE);
        return () => {
            clearTimeout(start);
            clearInterval(interval);
        };
    }, [phase, speed, round]);

    // Fin de manche : manche suivante, ou fin de partie.
    const history = state.history;
    useEffect(() => {
        if (phase !== 'escaped' && phase !== 'caught') return undefined;
        const timer = setTimeout(() => {
            if (round >= rounds) finishedRef.current(history);
            else dispatch({ type: 'next', config, seed: newSeed() });
        }, END_PAUSE);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand la manche se termine
    }, [phase]);

    return {
        ...state,
        rounds,
        seconds,
        ready: () => dispatch({ type: 'advance', from: 'memorize' }),
        answer: (value) => dispatch({ type: 'answer', value, seed: newSeed() }),
    };
}
