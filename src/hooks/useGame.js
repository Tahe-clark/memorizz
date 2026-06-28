import { useState, useEffect, useCallback } from 'react';
import { THEMES } from '../data/themes';
import { playSound } from '../utils/audio';

export function useGame({ theme, level, sequenceLength, totalRounds, onGameFinished }) {
    const [currentRound, setCurrentRound] = useState(1);
    const [roundHistory, setRoundHistory] = useState([]);
    const [sequence, setSequence] = useState([]);
    const [countdown, setCountdown] = useState(5);
    const [gameState, setGameState] = useState('memorize'); // 'memorize' | 'calculate'
    const [equation, setEquation] = useState({ operandValue: 0, operandIndex: 0, item: '', opType: '+', answerIndex: 0, answerValue: '' });
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null); // 'success' | 'fail' | null
    const [attempts, setAttempts] = useState(1);
    const [roundStartTime, setRoundStartTime] = useState(0);

    const setupNewRound = useCallback((roundNumber) => {
        const selectedThemeItems = [...THEMES[theme].items];
        const shuffledEmojis = selectedThemeItems.sort(() => Math.random() - 0.5);

        // Positionnement aléatoire des émojis (Loi de Région Commune)
        const numEmojis = sequenceLength >= 8 ? 3 : 2;
        const emojiPositions = new Set();
        while (emojiPositions.size < numEmojis) {
            const randPos = Math.floor(Math.random() * (sequenceLength - 1)) + 1;
            emojiPositions.add(randPos);
        }

        // Assemblage de la séquence mixte (chiffres et symboles)
        let seq = [];
        let emojiIdx = 0;
        for (let i = 1; i <= sequenceLength; i++) {
            if (emojiPositions.has(i - 1)) {
                seq.push(shuffledEmojis[emojiIdx]);
                emojiIdx++;
            } else {
                seq.push(i.toString());
            }
        }

        const numIndices = [];
        const emoIndices = [];
        seq.forEach((item, idx) => {
            if (isNaN(item)) {
                emoIndices.push(idx);
            } else {
                numIndices.push(idx);
            }
        });

        let operandIndex = 0;
        let emojiIndex = 0;
        let opType = '+';
        let targetIndex = 0;
        let foundValidEquation = false;

        const shuffledNums = numIndices.sort(() => Math.random() - 0.5);
        const shuffledEmos = emoIndices.sort(() => Math.random() - 0.5);

        for (let numIdx of shuffledNums) {
            const numValue = parseInt(seq[numIdx], 10);
            for (let emoIdx of shuffledEmos) {
                const emojiValue = emoIdx + 1;

                const additionTarget = numValue + emojiValue;
                if (additionTarget >= 1 && additionTarget <= sequenceLength) {
                    operandIndex = numIdx;
                    emojiIndex = emoIdx;
                    opType = '+';
                    targetIndex = additionTarget - 1;
                    foundValidEquation = true;
                    break;
                }

                const subtractionTarget = emojiValue - numValue;
                if (subtractionTarget >= 1 && subtractionTarget <= sequenceLength) {
                    operandIndex = numIdx;
                    emojiIndex = emoIdx;
                    opType = '-';
                    targetIndex = subtractionTarget - 1;
                    foundValidEquation = true;
                    break;
                }
            }
            if (foundValidEquation) break;
        }

        if (!foundValidEquation) {
            operandIndex = numIndices[0];
            emojiIndex = emoIndices[0];
            opType = '+';
            targetIndex = Math.min(sequenceLength - 1, (parseInt(seq[operandIndex], 10) + emojiIndex));
        }

        const answerValue = seq[targetIndex];

        // Création d'alternatives plausibles (Loi de Similarité)
        const optionSet = new Set([answerValue]);
        seq.forEach(el => {
            if (optionSet.size < 4) optionSet.add(el);
        });
        let fallbackIdx = 0;
        while (optionSet.size < 4 && fallbackIdx < selectedThemeItems.length) {
            optionSet.add(selectedThemeItems[fallbackIdx]);
            fallbackIdx++;
        }

        const finalOptions = Array.from(optionSet).sort(() => Math.random() - 0.5);

        setSequence(seq);
        setAttempts(1);
        setFeedback(null);
        setEquation({
            operandValue: parseInt(seq[operandIndex], 10),
            operandIndex: operandIndex + 1,
            item: seq[emojiIndex],
            opType: opType,
            answerIndex: targetIndex + 1,
            answerValue: answerValue
        });
        setOptions(finalOptions);

        const timeMap = { easy: 20, medium: 10, hard: 5 };
        setCountdown(timeMap[level]);
        setRoundStartTime(Date.now());
        setGameState('memorize');
    }, [theme, level, sequenceLength]);

    useEffect(() => {
        if (gameState !== 'memorize') return;
        if (countdown === 0) {
            setGameState('calculate');
            return;
        }
        const timer = setTimeout(() => {
            playSound('tick');
            setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, gameState]);

    useEffect(() => {
        setupNewRound(1);
    }, []);

    const handleAnswer = (selected) => {
        if (selected === equation.answerValue) {
            playSound('success');
            setFeedback('success');

            const roundTime = Math.round((Date.now() - roundStartTime) / 1000);
            const historyEntry = {
                round: currentRound,
                time: roundTime,
                attempts: attempts,
                success: true
            };

            const updatedHistory = [...roundHistory, historyEntry];
            setRoundHistory(updatedHistory);

            setTimeout(() => {
                if (currentRound < totalRounds) {
                    const nextRound = currentRound + 1;
                    setCurrentRound(nextRound);
                    setupNewRound(nextRound);
                } else {
                    onGameFinished(updatedHistory);
                }
            }, 1200);
        } else {
            playSound('fail');
            setFeedback('fail');
            setAttempts(prev => prev + 1);
            setTimeout(() => setFeedback(null), 1200);
        }
    };

    return {
        currentRound,
        sequence,
        countdown,
        gameState,
        equation,
        options,
        feedback,
        attempts,
        handleAnswer
    };
}