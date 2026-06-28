import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, Footer, Dashboard, GameBoard, GameOver } from './components/Header';


export default function App() {
    const [view, setView] = useState('home'); // 'home' | 'config' | 'play' | 'score'
    const [config, setConfig] = useState({ theme: 'animals', level: 'easy', sequenceLength: 7 });
    const [roundHistory, setRoundHistory] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleStartGame = (gameConfig) => {
        setConfig(gameConfig);
        setView('play');
    };

    const handleGameFinished = (history) => {
        setRoundHistory(history);
        setView('score');
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-white">
            <Header onViewChange={setView} onOpenConnexion={() => setShowModal(true)} />

            <main className="container my-auto py-4 flex-grow-1 d-flex align-items-center justify-content-center">
                {view === 'home' && (
                    <div className="text-center w-100">
                        <h2 className="mb-4 fw-bold text-dark">Travaillons le cerveau !! 🧠🏋️</h2>
                        <div className="row g-4 mt-2 justify-content-center">
                            <div className="col-12 col-md-4">
                                <div className="card p-5 rounded-5 border border-3 border-dark bg-light d-flex flex-column align-items-center justify-content-center transition hover-scale" style={{ cursor: 'pointer', height: '240px' }} onClick={() => setView('config')}>
                                    <h4 className="fw-bold m-0 text-dark">WordSwap Calc</h4>
                                    <span className="badge bg-dark mt-2">JEU ACTIF</span>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <div className="card p-5 rounded-5 border-0 bg-light d-flex flex-column align-items-center justify-content-center opacity-75" style={{ height: '240px' }}>
                                    <h4 className="fw-bold text-muted m-0">GridMatching</h4>
                                    <span className="badge bg-secondary mt-2">À venir</span>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <div className="card p-5 rounded-5 border-0 bg-light d-flex flex-column align-items-center justify-content-center opacity-75" style={{ height: '240px' }}>
                                    <h4 className="fw-bold text-muted m-0">SequenceFocus</h4>
                                    <span className="badge bg-secondary mt-2">À venir</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'config' && (
                    <Dashboard onStart={handleStartGame} onBack={() => setView('home')} />
                )}

                {view === 'play' && (
                    <GameBoard theme={config.theme} level={config.level} sequenceLength={config.sequenceLength} onGameFinished={handleGameFinished} onBack={() => setView('home')} />
                )}

                {view === 'score' && (
                    <GameOver history={roundHistory} totalRounds={3} onRestart={() => setView('config')} />
                )}
            </main>

            <Footer />

            {/* Notification élégante pour remplacer le "alert" (Modal Bootstrap simulé) */}
            {showModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
                    <div className="card p-4 rounded-4 shadow-lg border-0 bg-white text-center" style={{ maxWidth: '400px' }}>
                        <div className="mb-3">
                            <span className="h1">🔒</span>
                        </div>
                        <h4 className="fw-bold text-dark">Espace Profil Usager</h4>
                        <p className="text-secondary small">
                            Ce service de connexion sera entièrement intégré lors du Devoir 4 (Base de données et profils utilisateurs) !
                        </p>
                        <button className="btn btn-dark w-100 rounded-3 py-2 fw-bold" onClick={() => setShowModal(false)}>
                            Compris !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}