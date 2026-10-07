import { useEffect, useReducer, useRef, useState } from 'react';
import { THEMES } from '../data/themes';
import { announce, roundVoice } from '../utils/announcer';
import { playSound } from '../utils/audio';
import { BEAT_MS, msToGrid, playTrack, setMusicMood, stopTrack } from '../utils/music';
import { createEquation, createSequence, LEVELS } from '../utils/wordswap';

// Réglages du combat
export const MAX_HP = 100;
export const HIT_DAMAGE = 34;      // 3 bons coups = K.O.
export const COUNTER_DAMAGE = 17;  // mauvaise réponse : l'adversaire esquive et contre
export const ROUNDS_TO_WIN = 2;    // match en 3 manches
const FINAL_ROUND = 3;
export const OPTION_COUNT = 5;
// Le combat est calé sur le tempo de la musique : les calculs arrivent sur un
// temps et les coups touchent sur une croche (voir utils/music.js).
const EQUATION_BEATS = 16;         // sans réponse au bout de 4 mesures, calcul suivant
const RESOLVE_DELAY = 1100;
const KO_DELAY = 2400;
const COUNTER_EXTRA = 700;         // l'esquive + le contre durent un peu plus longtemps
// Duel au Far West : parfois, une boule de cactus tombe sur le ring.
const CACTUS_CHANCE = 0.6;         // probabilité qu'elle apparaisse pendant une manche
const DUEL_INTRO = 3600;           // durée de la cinématique (ms)
export const DUEL_PEEK = 5;        // secondes pour mémoriser les cartes du duel
const DUEL_TRACK = `${import.meta.env.BASE_URL}duel.mp3`;
// Coup final : dans la dernière manche, le K.O. est précédé d'une transformation.
const FINISHER_CHARGE = 1900;      // durée de la montée en puissance (ms)
const FINISHER_BLAST = 900;        // durée du coup géant (ms)
// Adversaire contrôlé par l'ordinateur : délai de réponse (ms) et taux de bonnes réponses.
export const CPU_LEVELS = {
    easy: { min: 5200, max: 8500, accuracy: 0.7 },
    medium: { min: 3200, max: 5600, accuracy: 0.82 },
    hard: { min: 1700, max: 3200, accuracy: 0.93 },
};
const PUNCH_AT = 160;              // moment où un coup touche (ms)
const COUNTER_PUNCH_AT = 620;      // moment où le contre touche (ms)

function newRoundState(sequence, question, seconds) {
    return {
        sequence,
        question,
        questionId: 0,
        // 'memorize' | 'fight' | 'resolve' | 'ko', et pour le duel : 'duelIntro' | 'duelPeek' | 'duel' | 'duelFree'
        phase: 'memorize',
        duel: null, // { missed: joueur qui a raté son tir, winner } pendant un duel
        countdown: seconds,
        hp: [MAX_HP, MAX_HP],
        roundWinner: null,
        finisher: false, // vrai quand le K.O. de la dernière manche déclenche le coup final
    };
}

// Le reducer traite les réponses une par une : si les deux joueurs appuient
// presque en même temps, seul le premier marque le point.
function reducer(state, action) {
    switch (action.type) {
        case 'tick': {
            if (state.phase !== 'memorize') return state;
            const countdown = state.countdown - 1;
            return countdown <= 0 ? { ...state, countdown: 0, phase: 'fight' } : { ...state, countdown };
        }
        case 'ready':
            return state.phase === 'memorize' ? { ...state, phase: 'fight' } : state;

        case 'answer': {
            const { player, option } = action;
            if (state.phase !== 'fight') return state;
            const rival = 1 - player;
            const event = { id: state.event.id + 1, player };

            if (option === state.question.equation.answer) {
                const hp = [...state.hp];
                hp[rival] = Math.max(0, hp[rival] - HIT_DAMAGE);
                if (hp[rival] > 0) {
                    return { ...state, hp, phase: 'resolve', event: { ...event, type: 'hit' } };
                }
                const wins = [...state.wins];
                wins[player] += 1;
                return {
                    ...state,
                    hp,
                    wins,
                    phase: 'ko',
                    finisher: state.round >= FINAL_ROUND,
                    roundWinner: player,
                    roundResults: [...state.roundResults, player],
                    matchWinner: wins[player] >= ROUNDS_TO_WIN ? player : null,
                    event: { ...event, type: 'hit' },
                };
            }

            // Mauvaise réponse : le joueur frappe dans le vide, l'adversaire esquive
            // et contre-attaque. Le fautif perd de la vie (et peut finir K.O.).
            const hp = [...state.hp];
            hp[player] = Math.max(0, hp[player] - COUNTER_DAMAGE);
            if (hp[player] > 0) {
                return { ...state, hp, phase: 'resolve', event: { ...event, type: 'counter' } };
            }
            const wins = [...state.wins];
            wins[rival] += 1;
            return {
                ...state,
                hp,
                wins,
                phase: 'ko',
                finisher: state.round >= FINAL_ROUND,
                roundWinner: rival,
                roundResults: [...state.roundResults, rival],
                matchWinner: wins[rival] >= ROUNDS_TO_WIN ? rival : null,
                event: { ...event, type: 'counter' },
            };
        }
        // --- Duel au Far West ---
        case 'duelStart':
            if (state.phase !== 'fight') return state;
            return {
                ...state,
                phase: 'duelIntro',
                duel: { missed: null, winner: null },
                sequence: action.sequence, // de nouvelles cartes, montrées avant le calcul
                question: action.question,
                questionId: state.questionId + 1,
                event: { id: state.event.id + 1, type: 'duelStart', player: null },
            };
        case 'duelPeek':
            return state.phase === 'duelIntro' ? { ...state, phase: 'duelPeek' } : state;
        case 'duelDraw':
            return state.phase === 'duelPeek' ? { ...state, phase: 'duel' } : state;

        case 'duelAnswer': {
            const { player, option } = action;
            const rival = 1 - player;
            const event = { id: state.event.id + 1, player };
            const isFree = state.phase === 'duelFree';
            if (state.phase !== 'duel' && !isFree) return state;
            if (isFree && player === state.duel.missed) return state; // il a déjà utilisé son essai

            // Un seul essai : une mauvaise réponse et la balle rate sa cible,
            // l'autre peut alors tirer quand il veut.
            if (!isFree && option !== state.question.equation.answer) {
                return { ...state, phase: 'duelFree', duel: { ...state.duel, missed: player }, event: { ...event, type: 'duelMiss' } };
            }
            // Tir réussi : le tireur gagne la manche.
            const hp = [...state.hp];
            hp[rival] = 0;
            const wins = [...state.wins];
            wins[player] += 1;
            return {
                ...state,
                hp,
                wins,
                phase: 'ko',
                duel: { ...state.duel, winner: player },
                roundWinner: player,
                roundResults: [...state.roundResults, player],
                matchWinner: wins[player] >= ROUNDS_TO_WIN ? player : null,
                event: { ...event, type: 'duelShot' },
            };
        }
        case 'timeout':
            if (state.phase !== 'fight' || action.questionId !== state.questionId) return state;
            return { ...state, phase: 'resolve', event: { id: state.event.id + 1, type: 'timeout', player: null } };

        case 'nextQuestion':
            if (state.phase !== 'resolve') return state;
            return {
                ...state,
                question: action.question,
                questionId: state.questionId + 1,
                phase: 'fight',
            };
        case 'nextRound':
            if (state.phase !== 'ko') return state;
            return {
                ...state,
                ...newRoundState(action.sequence, action.question, action.seconds),
                round: state.round + 1,
            };
        default:
            return state;
    }
}

export function useBattle({ theme, level, sequenceLength, duel: duelEnabled = true, cpu = null, onMatchFinished }) {
    const seconds = LEVELS[level].seconds;
    const items = THEMES[theme].items;

    const [state, dispatch] = useReducer(reducer, null, () => {
        const sequence = createSequence(items, sequenceLength);
        return {
            ...newRoundState(sequence, createEquation(sequence, OPTION_COUNT), seconds),
            round: 1,
            wins: [0, 0],
            roundResults: [],
            matchWinner: null,
            event: { id: 0, type: null, player: null },
        };
    });

    const finishedRef = useRef(onMatchFinished);
    useEffect(() => {
        finishedRef.current = onMatchFinished;
    }, [onMatchFinished]);

    // Un contre (esquive + riposte) dure un peu plus longtemps qu'un coup simple.
    const extra = state.event.type === 'counter' ? COUNTER_EXTRA : 0;

    // Musique : le beat généré pendant la mémorisation, le morceau de combat ensuite.
    const memorizing = state.phase === 'memorize';
    useEffect(() => {
        setMusicMood(memorizing ? 'battle' : 'fight');
    }, [memorizing]);

    // Sons : un par événement (coup, erreur) et un pour le K.O.
    const { id: eventId, type } = state.event;
    useEffect(() => {
        if (type === 'duelShot') playSound('gunshot');
        if (type === 'duelMiss') {
            playSound('gunshot');
            playSound('ricochet');
        }
        if (type === 'duelStart') announce('duel');
        if (state.finisher) return undefined; // le coup final a ses propres sons
        if (type !== 'hit' && type !== 'counter') return undefined;
        // Le bras part (souffle), puis le coup touche. Sur une mauvaise réponse,
        // le premier coup part dans le vide et c'est le contre qui touche.
        playSound('whoosh');
        const timers = [];
        if (type === 'hit') playSound('success'); // petit carillon de bonne réponse
        if (type === 'hit') timers.push(setTimeout(() => playSound('punch'), PUNCH_AT));
        if (type === 'counter') {
            timers.push(setTimeout(() => playSound('whoosh'), COUNTER_PUNCH_AT - PUNCH_AT));
            timers.push(setTimeout(() => playSound('punch'), COUNTER_PUNCH_AT));
        }
        return () => timers.forEach(clearTimeout);
    }, [eventId, type, state.finisher]);
    useEffect(() => {
        if (state.phase !== 'ko') return undefined;
        const id = setTimeout(() => {
            playSound('ko');
            announce('ko');
        }, state.finisher ? FINISHER_CHARGE + 200 : extra + PUNCH_AT);
        return () => clearTimeout(id);
    }, [state.phase, state.finisher, extra]);

    // Cloche de ring quand la mémorisation se termine et que le combat commence.
    const fightStarted = state.phase === 'fight' && state.questionId === 0;
    useEffect(() => {
        if (!fightStarted) return;
        playSound('bell');
        announce('fight');
    }, [fightStarted]);

    // L'annonceur appelle chaque manche (« Round 1 », « Final round »).
    useEffect(() => {
        announce(roundVoice(state.round));
    }, [state.round]);

    // Minuteries : une seule active à la fois, annulée si on quitte ou si la phase change.
    const { phase, countdown, questionId, sequence, question, matchWinner, wins } = state;
    useEffect(() => {
        let id;
        if (phase === 'memorize') {
            // La dernière seconde est ajustée pour que le combat démarre sur un temps.
            id = setTimeout(() => {
                if (countdown <= 4 && countdown > 1) playSound('tick');
                dispatch({ type: 'tick' });
            }, countdown === 1 ? msToGrid(700) : 1000);
        } else if (phase === 'fight') {
            id = setTimeout(() => dispatch({ type: 'timeout', questionId }), EQUATION_BEATS * BEAT_MS);
        } else if (phase === 'resolve') {
            id = setTimeout(() => {
                dispatch({ type: 'nextQuestion', question: createEquation(sequence, OPTION_COUNT, question.equation.key) });
            }, msToGrid(RESOLVE_DELAY + extra)); // le calcul suivant arrive sur un temps
        } else if (phase === 'duelIntro') {
            id = setTimeout(() => dispatch({ type: 'duelPeek' }), DUEL_INTRO);
        } else if (phase === 'duelPeek') {
            // Les cartes restent visibles quelques secondes, puis le calcul arrive.
            id = setTimeout(() => {
                dispatch({ type: 'duelDraw' });
                announce('draw');
            }, DUEL_PEEK * 1000);
        } else if (phase === 'ko') {
            id = setTimeout(() => {
                if (matchWinner !== null) {
                    finishedRef.current({ winner: matchWinner, wins });
                    return;
                }
                const next = createSequence(items, sequenceLength);
                dispatch({ type: 'nextRound', sequence: next, question: createEquation(next, OPTION_COUNT), seconds });
            }, msToGrid(KO_DELAY + extra + (state.finisher ? FINISHER_CHARGE + FINISHER_BLAST : 0)));
        }
        return () => clearTimeout(id);
    }, [phase, countdown, questionId, sequence, question, matchWinner, wins, items, sequenceLength, seconds, extra, state.finisher]);

    // --- Réponses calées sur le tempo ---
    // Le premier joueur qui appuie est retenu tout de suite (l'autre ne peut plus
    // répondre à ce calcul), mais le coup part un court instant plus tard pour
    // toucher exactement sur la prochaine croche.
    const [pending, setPending] = useState(null);
    const pendingRef = useRef({ questionKey: null, timer: null });
    useEffect(() => () => clearTimeout(pendingRef.current.timer), []);

    const questionKey = `${state.round}-${questionId}`;
    const activePending = pending?.questionKey === questionKey ? pending : null;

    const answer = (player, option) => {
        if (phase === 'duel' || phase === 'duelFree') {
            dispatch({ type: 'duelAnswer', player, option });
            return;
        }
        if (phase !== 'fight' || pendingRef.current.questionKey === questionKey) return;
        pendingRef.current.questionKey = questionKey;
        setPending({ questionKey, player, option });
        const wait = msToGrid(PUNCH_AT, 0.5) - PUNCH_AT;
        pendingRef.current.timer = setTimeout(() => dispatch({ type: 'answer', player, option }), wait);
    };

    const readyRef = useRef(null);
    useEffect(() => () => clearTimeout(readyRef.current), []);
    const ready = () => {
        clearTimeout(readyRef.current);
        readyRef.current = setTimeout(() => dispatch({ type: 'ready' }), msToGrid(0));
    };

    const { round } = state;

    // --- Coup final de la dernière manche ---
    // Trois temps : le gagnant se charge ('charge'), donne un coup géant ('blast'),
    // puis fête sa victoire ('done').
    const finisher = state.finisher && phase === 'ko';
    const [stage, setStage] = useState('charge');
    useEffect(() => {
        if (!finisher) return undefined;
        playSound('charge');
        announce('finisher');
        const timers = [
            setTimeout(() => {
                setStage('blast');
                playSound('megaPunch');
            }, FINISHER_CHARGE),
            setTimeout(() => setStage('done'), FINISHER_CHARGE + FINISHER_BLAST),
        ];
        return () => timers.forEach(clearTimeout);
    }, [finisher]);
    const finisherStage = finisher ? stage : null;

    // --- Adversaire contrôlé par l'ordinateur (joueur de droite) ---
    const answerRef = useRef(answer);
    useEffect(() => {
        answerRef.current = answer;
    });
    const duelMissed = state.duel?.missed ?? null;
    useEffect(() => {
        if (!cpu) return undefined;
        const { min, max, accuracy } = CPU_LEVELS[cpu];
        const right = question.equation.answer;
        // Il se trompe parfois, selon son niveau.
        const choose = () => (Math.random() < accuracy ? right : question.options.find((o) => o !== right));
        const think = () => min + Math.random() * (max - min);
        let id;
        if (phase === 'fight') id = setTimeout(() => answerRef.current(1, choose()), think());
        else if (phase === 'duel') id = setTimeout(() => answerRef.current(1, choose()), think() + 600);
        else if (phase === 'duelFree' && duelMissed === 0) id = setTimeout(() => answerRef.current(1, right), 1100 + Math.random() * 900);
        return () => clearTimeout(id);
    }, [cpu, phase, questionId, round, question, duelMissed]);

    // --- Boule de cactus et duel ---
    // Au début de chaque manche, on tire au sort si la boule tombera, et à quel calcul.
    // (Pour tester : ajouter ?cactus à l'adresse de la page la fait tomber à chaque manche.)
    const [cactus, setCactus] = useState(null);
    const cactusPlan = useRef({ at: null, done: true });
    useEffect(() => {
        const forced = new URLSearchParams(window.location.search).has('cactus');
        // L'épreuve du cowboy peut être désactivée dans les réglages du combat.
        const falls = duelEnabled && (forced || Math.random() < CACTUS_CHANCE);
        // Elle tombe au 1er ou au 2e calcul de la manche.
        cactusPlan.current = { at: falls ? (forced ? 0 : Math.floor(Math.random() * 2)) : null, done: false };
    }, [round, duelEnabled]);
    useEffect(() => {
        const plan = cactusPlan.current;
        if (phase !== 'fight' || plan.done || plan.at !== questionId) return undefined;
        const show = setTimeout(() => {
            plan.done = true;
            setCactus(round);
            playSound('boing');
        }, 900);
        return () => {
            clearTimeout(show);
            // Réponse trop rapide : la boule n'a pas eu le temps de tomber,
            // elle est reportée au calcul suivant.
            if (!plan.done) plan.at = questionId + 1;
        };
    }, [phase, questionId, round]);

    // Une fois tombée, la boule reste sur le ring jusqu'à la fin de la manche.
    const cactusVisible = (phase === 'fight' || phase === 'resolve') && cactus === round;
    const grabCactus = () => {
        if (!cactusVisible || phase !== 'fight') return; // on ne l'attrape pas pendant un coup
        clearTimeout(pendingRef.current.timer); // un coup en attente est annulé
        setCactus(null);
        const cards = createSequence(items, sequenceLength);
        dispatch({ type: 'duelStart', sequence: cards, question: createEquation(cards, OPTION_COUNT) });
    };

    // La musique du duel remplace la musique de combat jusqu'à la manche suivante.
    const inDuel = state.duel !== null;
    useEffect(() => {
        if (!inDuel) return undefined;
        playTrack(DUEL_TRACK);
        return stopTrack;
    }, [inDuel]);

    return {
        ...state,
        seconds,
        equationSeconds: (EQUATION_BEATS * BEAT_MS) / 1000,
        pending: activePending,
        finisherStage,
        cactusVisible,
        grabCactus,
        ready,
        answer,
    };
}
