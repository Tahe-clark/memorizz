import { useCallback, useEffect, useState } from 'react';
import BattleBoard from './components/BattleBoard';
import BattleOver from './components/BattleOver';
import Footer from './components/Footer';
import GameBoard from './components/GameBoard';
import GameConfig from './components/GameConfig';
import GameOver from './components/GameOver';
import Header from './components/Header';
import Home from './components/Home';
import LoginModal from './components/LoginModal';
import { DEFAULT_PLAYERS, normalizePlayer } from './data/avatars';
import { GAMES } from './data/games';
import { useI18n } from './i18n/context';
import { announce } from './utils/announcer';
import { playSound } from './utils/audio';
import { setMusicMood, startMusic } from './utils/music';
import { readStorage, writeStorage } from './utils/storage';
import { computeScore } from './utils/wordswap';

const DEFAULT_CONFIG = { theme: 'animals', level: 'easy', sequenceLength: 7 };
const DEFAULT_BATTLE_CONFIG = { theme: 'animals', level: 'medium', sequenceLength: 5, view: '2d', duel: true, cpu: null, players: DEFAULT_PLAYERS };

const loadConfig = (gameId) => {
    const saved = readStorage(`${gameId}:config`, {});
    if (gameId !== 'battle') return { ...DEFAULT_CONFIG, ...saved };
    const config = { ...DEFAULT_BATTLE_CONFIG, ...saved };
    // Anciennes sauvegardes : seulement des noms, ou des joueurs incomplets.
    config.players = [0, 1].map((i) => normalizePlayer({ name: saved.names?.[i] ?? '', ...saved.players?.[i] }, i));
    delete config.names;
    return config;
};

export default function App() {
    const { t } = useI18n();
    const [view, setView] = useState('home'); // 'home' | 'config' | 'play' | 'score'
    const [gameId, setGameId] = useState('wordswap'); // 'wordswap' | 'battle'
    const [config, setConfig] = useState(() => loadConfig('wordswap'));
    const [result, setResult] = useState(null);
    const [gameKey, setGameKey] = useState(0); // force une nouvelle partie à chaque lancement
    const [showLogin, setShowLogin] = useState(false);

    // La musique ne peut démarrer qu'après une première action de l'utilisateur.
    useEffect(() => {
        const start = () => startMusic();
        window.addEventListener('pointerdown', start);
        window.addEventListener('keydown', start);
        return () => {
            window.removeEventListener('pointerdown', start);
            window.removeEventListener('keydown', start);
        };
    }, []);

    // Hors combat : le morceau des menus (pendant un combat, c'est useBattle qui choisit).
    useEffect(() => {
        if (!(view === 'play' && gameId === 'battle')) setMusicMood('menu');
    }, [view, gameId]);

    const game = GAMES.find((g) => g.id === gameId);
    const goHome = () => setView('home');

    const openGame = (id) => {
        setGameId(id);
        setConfig(loadConfig(id));
        setView('config');
    };

    const startGame = (gameConfig) => {
        setConfig(gameConfig);
        writeStorage(`${gameId}:config`, gameConfig);
        setGameKey((k) => k + 1);
        setView('play');
    };

    const finishGame = useCallback((roundHistory) => {
        // Calcul du score et du record une seule fois, à la fin de la partie.
        const score = computeScore(roundHistory);
        const previousBest = readStorage('best:wordswap', 0);
        const isNewBest = score > previousBest;
        if (isNewBest) writeStorage('best:wordswap', score);
        setResult({ history: roundHistory, score, best: Math.max(score, previousBest), isNewBest });
        setView('score');
    }, []);

    const finishBattle = useCallback((matchResult) => {
        playSound('win');
        announce('winner');
        setResult(matchResult);
        setView('score');
    }, []);

    // Joueurs affichés en Battle : nom saisi, sinon « Joueur 1 / Joueur 2 ».
    const players = [0, 1].map((i) => {
        const player = normalizePlayer(config.players?.[i], i);
        const fallback = i === 1 && config.cpu ? t('config.cpuName') : t('config.playerDefault', { n: i + 1 });
        return { ...player, name: player.name || fallback };
    });
    const isBattle = gameId === 'battle';

    return (
        <div className="app">
            <Header onHome={goHome} onOpenLogin={() => setShowLogin(true)} />

            <main className="container main-area">
                {view === 'home' && <Home onPlay={openGame} />}

                {view === 'config' && (
                    <GameConfig key={gameId} game={game} initialConfig={config} onStart={startGame} onBack={goHome} />
                )}

                {view === 'play' && !isBattle && (
                    <GameBoard key={gameKey} config={config} onGameFinished={finishGame} onQuit={goHome} />
                )}
                {view === 'play' && isBattle && (
                    <BattleBoard key={gameKey} config={config} players={players} onMatchFinished={finishBattle} onQuit={goHome} />
                )}

                {view === 'score' && result && !isBattle && (
                    <GameOver
                        result={result}
                        onReplay={() => startGame(config)}
                        onSettings={() => setView('config')}
                        onHome={goHome}
                    />
                )}
                {view === 'score' && result && isBattle && (
                    <BattleOver
                        result={result}
                        players={players}
                        view={config.view}
                        onRematch={() => startGame(config)}
                        onSettings={() => setView('config')}
                        onHome={goHome}
                    />
                )}
            </main>

            <Footer />

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
    );
}
