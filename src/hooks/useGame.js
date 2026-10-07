import { useCallback, useEffect, useRef, useState } from 'react';
import { THEMES } from '../data/themes';
import { playSound } from '../utils/audio';
import { createRound, LEVELS, TOTAL_ROUNDS } from '../utils/wordswap';

const NEXT_ROUND_DELAY = 1400;

export function useGame({ theme, level, sequenceLength, onGameFinished }) {
    const seconds = LEVELS[level].seconds;
    const makeRound = useCallback(
        () => createRound(THEMES[theme].items, sequenceLength),
        [theme, sequenceLength],
    );

    const [currentRound, setCurrentRound] = useState(1);
    const [history, setHistory] = useState([]);
    const [round, setRound] = useState(makeRound);
    const [phase, setPhase] = useState('memorize'); // 'memorize' | 'solve'
    const [countdown, setCountdown] = useState(seconds);
    const [feedback, setFeedback] = useState(null); // 'success' | 'fail' | null
    const [wrongPicks, setWrongPicks] = useState([]);

    const solveStartRef = useRef(0);
    const timeoutsRef = useRef([]);
    const finishedRef = useRef(onGameFinished);
    useEffect(() => {
        finishedRef.current = onGameFinished;
    }, [onGameFinished]);

    // Tous les délais sont annulés si on quitte la partie en cours de route.
    const later = useCallback((fn, ms) => {
        const id = setTimeout(fn, ms);
        timeoutsRef.current.push(id);
    }, []);
    useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

    const startSolving = useCallback(() => {
        solveStartRef.current = Date.now();
        setPhase('solve');
    }, []);

    // Compte à rebours de mémorisation
    useEffect(() => {
        if (phase !== 'memorize' || countdown === 0) return undefined;
        const id = setTimeout(() => {
            if (countdown <= 4 && countdown > 1) playSound('tick'); // seulement les dernières secondes
            setCountdown(countdown - 1);
            if (countdown === 1) startSolving();
        }, 1000);
        return () => clearTimeout(id);
    }, [countdown, phase, startSolving]);

    const skipMemorize = () => {
        if (phase === 'memorize') startSolving();
    };

    const handleAnswer = (selected) => {
        if (phase !== 'solve' || feedback === 'success' || wrongPicks.includes(selected)) return;

        if (selected !== round.equation.answer) {
            playSound('fail');
            setFeedback('fail');
            setWrongPicks((picks) => [...picks, selected]);
            return;
        }

        playSound('success');
        setFeedback('success');
        const entry = {
            round: currentRound,
            // Temps de réflexion uniquement (la mémorisation n'est pas pénalisée)
            time: Math.round((Date.now() - solveStartRef.current) / 1000),
            attempts: wrongPicks.length + 1,
        };
        const updated = [...history, entry];
        setHistory(updated);

        later(() => {
            if (currentRound >= TOTAL_ROUNDS) {
                finishedRef.current(updated);
                return;
            }
            setCurrentRound(currentRound + 1);
            setRound(makeRound());
            setWrongPicks([]);
            setFeedback(null);
            setCountdown(seconds);
            setPhase('memorize');
        }, NEXT_ROUND_DELAY);
    };

    return {
        currentRound,
        totalRounds: TOTAL_ROUNDS,
        seconds,
        sequence: round.sequence,
        equation: round.equation,
        options: round.options,
        phase,
        countdown,
        feedback,
        wrongPicks,
        attempts: wrongPicks.length + 1,
        skipMemorize,
        handleAnswer,
    };
}
