import { useState } from 'react';
import { GAMES } from '../data/games';
import { useI18n } from '../i18n/context';
import { readStorage } from '../utils/storage';
import DemoModal from './DemoModal';
import HomeParade from './HomeParade';
import Tile from './Tile';

// Petite séquence de démonstration : elle se retourne une fois au chargement,
// comme dans le jeu, en laissant un seul émoji visible.
const DEMO = ['▶', '🦊', '3', '4', '🐙', '6', '7'];
const DEMO_KEPT = 4;
const DEMO_PLAY = 0; // la première carte reste visible : elle lance la vidéo de démonstration

export default function Home({ onPlay }) {
    const { t } = useI18n();
    const [showDemo, setShowDemo] = useState(false);

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-text">
                    <h1 className="h-display">{t('home.title')}</h1>
                    <p className="lead-mz">{t('home.lead')}</p>
                </div>
                <div className="hero-tiles">
                    {DEMO.map((item, i) => (i === DEMO_PLAY ? (
                        <button key={i} type="button" className="demo-play" onClick={() => setShowDemo(true)} aria-label={t('demo.title')} title={t('demo.title')}>
                            <Tile item={item} position={i + 1} highlight />
                        </button>
                    ) : (
                        <div key={i} className={i === DEMO_KEPT ? '' : 'demo-flip'} style={{ '--i': i }} aria-hidden="true">
                            <Tile item={item} position={i + 1} highlight={i === DEMO_KEPT} />
                        </div>
                    )))}
                </div>
            </section>

            {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

            <HomeParade />

            <section aria-labelledby="games-title">
                <h2 id="games-title" className="h-section mb-3">{t('home.gamesTitle')}</h2>
                <div className="games-grid">
                    {GAMES.map((game) => {
                        if (!game.available) {
                            return (
                                <div key={game.id} className={`game-card is-soon color-${game.color}`}>
                                    <h3 className="game-name">{game.name}</h3>
                                    <span className="tag">{t('home.soon')}</span>
                                </div>
                            );
                        }
                        const best = readStorage(`best:${game.id}`);
                        return (
                            <article key={game.id} className={`game-card is-live color-${game.color}`}>
                                <h3 className="game-name">{game.name}</h3>
                                <p className="game-desc">{t(`game.${game.id}.desc`)}</p>
                                <div className="game-foot">
                                    <span className="game-best">
                                        {game.players === 2 && t('home.twoPlayers')}
                                        {game.players === 1 && (best ? t('home.best', { n: best }) : t('home.noBest'))}
                                    </span>
                                    <button type="button" className="btn-mz btn-mz-ink" onClick={() => onPlay(game.id)}>
                                        {t('home.play')}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
