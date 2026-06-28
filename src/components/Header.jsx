
import React, { useState } from 'react';
import { THEMES } from '../data/themes';
import { useGame } from '../hooks/useGame';

export function Header({ onViewChange, onOpenConnexion }) {
    return (
        <header className="container py-3 d-flex justify-content-between align-items-center border-bottom border-light">
            <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={() => onViewChange('home')}>
                <span className="h3 font-weight-bold m-0 me-2 text-dark">MEM’</span>
                <div className="border border-3 border-dark rounded-2 px-2 py-1 d-inline-flex align-items-center justify-content-center bg-white font-weight-bold">
                    <span style={{ fontSize: '18px' }}>🧠</span>
                </div>
                <span className="h3 font-weight-bold m-0 text-dark">RIZZ</span>
            </div>
            <button className="btn btn-light rounded-3 font-weight-bold py-2 px-3 border border-gray-300 shadow-sm" onClick={onOpenConnexion}>
                Se connecter
            </button>
        </header>
    );
}

// --- 4.2 FOOTER (Extractible dans "src/components/Footer.jsx") ---
export function Footer() {
    return (
        <footer className="bg-light text-muted text-center py-3 border-top w-100 mt-auto font-weight-bold" style={{ fontSize: '14px' }}>
            By Kelyan Tahe
        </footer>
    );
}

// --- 4.3 DASHBOARD (Extractible dans "src/components/Dashboard.jsx" ou "GameConfig.jsx") ---
export function Dashboard({ onStart, onBack }) {
    const [theme, setTheme] = useState('animals');
    const [level, setLevel] = useState('easy');
    const [sequenceLength, setSequenceLength] = useState(7);

    return (
        <div className="card p-5 border-0 rounded-5 shadow-lg bg-light w-100 max-w-lg mx-auto" style={{ maxWidth: '680px' }}>
            <div className="d-flex align-items-center mb-4">
                <button className="btn btn-link text-dark p-0 me-3" onClick={onBack}>
                    <i className="fa-solid fa-arrow-left fa-2x"></i>
                </button>
                <h2 className="m-0 fw-bold text-dark">Configuration de la partie</h2>
            </div>

            <div className="row g-4">
                {/* 1. Difficulté */}
                <div className="col-md-6 d-flex flex-column gap-2">
                    <p className="fw-bold text-secondary mb-1">1. Difficulté (Temps d'encodage)</p>
                    <button className={`btn w-100 py-3 rounded-4 fw-bold border-2 transition ${level === 'easy' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setLevel('easy')}>
                        FACILE (20s)
                    </button>
                    <button className={`btn w-100 py-3 rounded-4 fw-bold border-2 transition ${level === 'medium' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setLevel('medium')}>
                        MOYEN (10s)
                    </button>
                    <button className={`btn w-100 py-3 rounded-4 fw-bold border-2 transition ${level === 'hard' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setLevel('hard')}>
                        DIFFICILE (5s)
                    </button>
                </div>

                {/* 2. Éléments */}
                <div className="col-md-6 text-center d-flex flex-column align-items-center justify-content-center">
                    <p className="fw-bold text-secondary mb-2">2. Éléments dans la séquence</p>
                    <div className="bg-white rounded-4 p-4 shadow-sm mb-3 d-flex align-items-center justify-content-center border" style={{ width: '120px', height: '120px' }}>
                        <span className="display-3 fw-bold m-0 text-dark">{sequenceLength}</span>
                    </div>
                    <div className="d-flex gap-3">
                        <button className="btn btn-dark rounded-circle px-3 py-2" onClick={() => setSequenceLength(prev => Math.max(5, prev - 1))}>
                            <i className="fa-solid fa-minus"></i>
                        </button>
                        <button className="btn btn-dark rounded-circle px-3 py-2" onClick={() => setSequenceLength(prev => Math.min(9, prev + 1))}>
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>

                {/* 3. Thématique */}
                <div className="col-12 mt-3">
                    <p className="fw-bold text-secondary mb-2">3. Sélection du thème cognitif</p>
                    <div className="d-flex gap-3 justify-content-center">
                        {Object.keys(THEMES).map(t => (
                            <button key={t} className={`btn flex-grow-1 py-3 rounded-4 fw-bold border-2 transition ${theme === t ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTheme(t)}>
                                {THEMES[t].label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button className="btn btn-dark w-100 py-3 mt-5 rounded-4 fw-bold text-uppercase shadow" onClick={() => onStart({ theme, level, sequenceLength })}>
                Commencer le cycle (3 manches)
            </button>
        </div>
    );
}

// --- 4.4 GAMEBOARD (Extractible dans "src/components/GameBoard.jsx") ---
export function GameBoard({ theme, level, sequenceLength, onGameFinished, onBack }) {
    const totalRounds = 3;
    const {
        currentRound,
        sequence,
        countdown,
        gameState,
        equation,
        options,
        feedback,
        attempts,
        handleAnswer
    } = useGame({ theme, level, sequenceLength, totalRounds, onGameFinished });

    return (
        <div className="card p-5 border-0 rounded-5 shadow-lg bg-light w-100 mx-auto" style={{ maxWidth: '780px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold text-secondary">Manche {currentRound} / {totalRounds}</span>
                <button className="btn btn-link text-dark p-0" onClick={onBack}>
                    <i className="fa-solid fa-circle-xmark fa-2x"></i>
                </button>
            </div>

            {gameState === 'memorize' ? (
                <div className="text-center">
                    <h2 className="mb-4 fw-bold text-dark">Mémorisez la séquence mixte !</h2>
                    
                    {/* Séquence mixte (Loi de Région Commune) */}
                    <div className="bg-white rounded-4 p-4 shadow-inner d-flex justify-content-center align-items-center gap-3 my-4 flex-wrap border">
                        {sequence.map((item, index) => (
                            <div key={index} className="d-flex flex-column align-items-center">
                                <span className="display-4 fw-bold mx-1" style={{ color: isNaN(item) ? '#2563eb' : '#000000' }}>
                                    {item}
                                </span>
                                <small className="text-muted fw-bold mt-1" style={{ fontSize: '12px' }}>Pos {index + 1}</small>
                            </div>
                        ))}
                    </div>

                    <div className="w-50 mx-auto mt-4">
                        <h5 className="text-secondary mb-2">Temps d'observation restant : {countdown}s</h5>
                        <div className="progress rounded-pill" style={{ height: '10px' }}>
                            <div className="progress-bar bg-dark progress-bar-striped progress-bar-animated" style={{ width: `${(countdown / (level === 'easy' ? 20 : level === 'medium' ? 10 : 5)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <h2 className="mb-4 fw-bold text-dark d-flex align-items-center justify-content-center gap-2">
                        Résolvez l'Équation Spatiale 📟
                    </h2>

                    <div className="d-flex align-items-center justify-content-center gap-3 gap-md-4 my-4 flex-wrap">
                        {/* Formule spatiale */}
                        <div className="bg-white border rounded-4 p-4 d-flex align-items-center justify-content-center shadow-sm" style={{ minWidth: '180px', height: '120px' }}>
                            {equation.opType === '+' ? (
                                <span className="h1 fw-bold m-0 d-flex align-items-center gap-2">
                                    {equation.operandValue} + <span style={{ fontSize: '2.5rem' }}>{equation.item}</span>
                                </span>
                            ) : (
                                <span className="h1 fw-bold m-0 d-flex align-items-center gap-2">
                                    <span style={{ fontSize: '2.5rem' }}>{equation.item}</span> - {equation.operandValue}
                                </span>
                            )}
                        </div>

                        <span className="display-4 fw-bold text-dark">=</span>

                        {/* Zone de réponse */}
                        <div className="border rounded-4 p-4 d-flex flex-column align-items-center justify-content-center shadow-sm" style={{ minWidth: '180px', height: '120px', backgroundColor: feedback === 'success' ? '#d4edda' : '#ffffff', transition: 'background 0.2s' }}>
                            {feedback === 'success' ? (
                                <>
                                    <span className="display-4 m-0 text-success fw-bold">{equation.answerValue}</span>
                                    <small className="text-success fw-bold mt-1" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>GOOD!</small>
                                </>
                            ) : (
                                <span className="display-4 text-muted fw-bold">?</span>
                            )}
                        </div>
                    </div>

                    <div className="text-muted small mb-4">
                        <i className="fa-solid fa-circle-info me-1"></i>
                        {equation.opType === '+' ? (
                            <span>Additionnez la valeur {equation.operandValue} à l'index d'origine de l'élément {equation.item} pour cibler la réponse.</span>
                        ) : (
                            <span>Soustrayez la valeur {equation.operandValue} à l'index d'origine de l'élément {equation.item} pour cibler la réponse.</span>
                        )}
                    </div>

                    {/* Grille de réponses alternatives */}
                    <div className="row g-3 justify-content-center mt-2">
                        {options.map((opt, index) => (
                            <div key={index} className="col-6 col-sm-3">
                                <button className="btn btn-white border border-2 py-3 w-100 rounded-3 h2 fw-bold shadow-sm hover-shadow transition" onClick={() => handleAnswer(opt)} disabled={feedback === 'success'}>
                                    {opt}
                                </button>
                            </div>
                        ))}
                    </div>

                    {feedback === 'fail' && (
                        <div className="alert alert-danger py-2 mt-4 rounded-pill d-inline-block px-4">
                            <i className="fa-solid fa-circle-xmark me-2"></i> FAUX! La position spatiale n'est pas correcte. Réessayez...
                        </div>
                    )}

                    <div className="d-flex justify-content-between mt-4 text-muted font-semibold">
                        <span>Tentative {attempts}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 4.5 GAMEOVER (Extractible dans "src/components/GameOver.jsx") ---
export function GameOver({ history, totalRounds, onRestart }) {
    const calculateScore = () => {
        if (history.length === 0) return 0;
        let totalAttempts = 0;
        let totalTime = 0;
        history.forEach(r => {
            totalAttempts += r.attempts;
            totalTime += r.time;
        });

        let penalty = (totalAttempts - totalRounds) * 5;
        const avgTime = totalTime / totalRounds;
        if (avgTime > 5) {
            penalty += Math.round(avgTime - 5) * 2;
        }

        return Math.max(10, 100 - penalty);
    };

    return (
        <div className="card p-5 border-0 rounded-5 shadow-lg bg-light text-center w-100 mx-auto" style={{ maxWidth: '580px' }}>
            <div className="p-4 rounded-5 text-dark" style={{ backgroundColor: '#fcd34d' }}>
                <h2 className="mb-4 fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2">
                    Bilan du cycle 🎯
                </h2>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                    <span className="display-1 fw-bold m-0">{calculateScore()}</span>
                    <span style={{ fontSize: '2.5rem' }}>%</span>
                </div>

                <div className="bg-white rounded-4 p-3 text-start mb-4 text-dark shadow-sm">
                    <h6 className="fw-bold border-bottom pb-2 mb-2">Performance par manche :</h6>
                    {history.map((r, i) => (
                        <div key={i} className="d-flex justify-content-between small py-1">
                            <span>Manche {r.round} :</span>
                            <span className="fw-semibold">Résolu en {r.time}s ({r.attempts} {r.attempts > 1 ? 'essais' : 'essai'})</span>
                        </div>
                    ))}
                </div>

                <button className="btn btn-dark w-100 py-3 rounded-pill text-white fw-bold px-5" onClick={onRestart}>
                    Recommencer un cycle
                </button>
            </div>
        </div>
    );
}
