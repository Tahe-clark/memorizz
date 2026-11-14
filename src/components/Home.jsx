import { lazy, Suspense, useEffect, useState } from 'react';
import { GAMES } from '../data/games';
import { useI18n } from '../i18n/context';
import { readStorage } from '../utils/storage';
import { hasWebGL } from '../utils/webgl';
import { AvatarFigure } from './Avatar';
import DemoModal from './DemoModal';

// Accueil façon « ciné » : une grande image plein écran qui présente un jeu à la
// une (elle change toute seule), le skin du joueur en 3D à côté, puis la rangée
// de tous les jeux. Les emojis ne servent que sur les cartes du jeu.

const AvatarStage = lazy(() => import('../three/AvatarStage'));
const ART = `${import.meta.env.BASE_URL}art/`;
const SLIDES = ['escape', 'battle', 'wordswap'];
const SLIDE_MS = 7000;
const CARD_ART = { escape: 'escape-card.jpg', battle: 'battle-card.jpg' };
const HERO_ART = { escape: 'escape-hero.jpg', battle: 'battle-hero.jpg' };

/** Illustration de WordSwap Calc : quelques cartes du jeu, dont une retournée. */
function WordSwapArt({ big = false }) {
    return (
        <div className={`ws-art ${big ? 'is-big' : ''}`} aria-hidden="true">
            <div className="ws-row">
                {['3', '🦊', '?', '7', '🐙'].map((item, i) => (
                    <span key={i} className={`ws-tile ${item === '?' ? 'is-hidden' : ''}`} style={{ '--i': i }}>{item}</span>
                ))}
            </div>
        </div>
    );
}

export default function Home({ onPlay, player, onOpenLocker }) {
    const { t } = useI18n();
    const [slide, setSlide] = useState(0);
    const [paused, setPaused] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [noWebGL, setNoWebGL] = useState(() => !hasWebGL());
    const featured = SLIDES[slide];

    // Le jeu à la une change toutes les 7 secondes (sauf quand la souris est dessus)
    useEffect(() => {
        if (paused) return undefined;
        const timer = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
        return () => clearTimeout(timer);
    }, [slide, paused]);

    const meta = (game) => {
        if (game.players === 2) return t('home.meta.duo');
        const best = readStorage(`best:${game.id}`);
        return best ? `${t('home.meta.solo')} · ${t('home.best', { n: best })}` : t('home.meta.solo');
    };

    return (
        <div className="home-c">
            <section className={`feature feature-${featured}`} aria-roledescription="carousel" aria-label={t('home.featured')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                {/* Les images de fond se fondent l'une dans l'autre */}
                <div className="feature-bgs" aria-hidden="true">
                    {SLIDES.map((id, i) => (
                        <div key={id} className={`feature-bg ${i === slide ? 'is-on' : ''}`}>
                            {HERO_ART[id] ? <img src={ART + HERO_ART[id]} alt="" /> : <WordSwapArt big />}
                        </div>
                    ))}
                </div>
                <div className="feature-shade" aria-hidden="true" />

                <div className="feature-inner">
                    <div className="feature-text" key={featured}>
                        <span className="feature-kicker">{t(`home.feature.${featured}.kicker`)}</span>
                        <h1 className="feature-title">{GAMES.find((g) => g.id === featured).name}</h1>
                        <p className="feature-desc">{t(`home.feature.${featured}.desc`)}</p>
                        <div className="feature-cta">
                            <button type="button" className="btn-c btn-c-accent" onClick={() => onPlay(featured)}>
                                <i className="fa-solid fa-play" aria-hidden="true"></i> {t('home.play')}
                            </button>
                            <button type="button" className="btn-c btn-c-glass" onClick={() => setShowDemo(true)}>
                                <i className="fa-regular fa-circle-play" aria-hidden="true"></i> {t('home.demo')}
                            </button>
                        </div>
                    </div>

                    {/* Le skin du joueur, en 3D */}
                    <div className="skin-panel">
                        <div className="skin-stage">
                            {noWebGL ? (
                                <div className="skin-fallback"><AvatarFigure player={player} mood="happy" /></div>
                            ) : (
                                <Suspense fallback={<div className="skin-fallback"><AvatarFigure player={player} mood="happy" /></div>}>
                                    <AvatarStage player={player} onFail={() => setNoWebGL(true)} />
                                </Suspense>
                            )}
                        </div>
                        <div className="skin-bar">
                            <div>
                                <small>{t('home.skin.title')}</small>
                                <b>{player.name || t('config.playerDefault', { n: 1 })}</b>
                            </div>
                            <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={onOpenLocker}>
                                <i className="fa-solid fa-shirt" aria-hidden="true"></i> {t('home.skin.customize')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="feature-dots" role="tablist" aria-label={t('home.featured')}>
                    {SLIDES.map((id, i) => (
                        <button key={id} type="button" role="tab" aria-selected={i === slide} aria-label={GAMES.find((g) => g.id === id).name} className={i === slide ? 'is-on' : ''} onClick={() => setSlide(i)}>
                            {i === slide && !paused && <span style={{ animationDuration: `${SLIDE_MS}ms` }} />}
                        </button>
                    ))}
                </div>
            </section>

            <section className="rail" id="jeux" aria-labelledby="rail-title">
                <div className="rail-head">
                    <h2 id="rail-title">{t('home.allGames')}</h2>
                </div>
                <div className="rail-cards">
                    {GAMES.map((game) => (game.available ? (
                        <button
                            key={game.id}
                            type="button"
                            className={`rail-card ${featured === game.id ? 'is-featured' : ''}`}
                            onClick={() => onPlay(game.id)}
                            onMouseEnter={() => SLIDES.includes(game.id) && setSlide(SLIDES.indexOf(game.id))}
                            onFocus={() => SLIDES.includes(game.id) && setSlide(SLIDES.indexOf(game.id))}
                        >
                            <div className="rail-art">{CARD_ART[game.id] ? <img src={ART + CARD_ART[game.id]} alt="" loading="lazy" /> : <WordSwapArt />}</div>
                            <div className="rail-label">
                                <b>{game.name}</b>
                                <small>{meta(game)}</small>
                            </div>
                            <span className="rail-play" aria-hidden="true"><i className="fa-solid fa-play"></i></span>
                        </button>
                    ) : (
                        <div key={game.id} className="rail-card is-next">
                            <div className="next-body">
                                <i className="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>
                                <b>{t('home.next.title')}</b>
                                <small>{t('home.next.tag')}</small>
                                <div className="next-progress" role="progressbar" aria-label={t('home.next.tag')} aria-valuetext={t('home.next.tag')}><span /></div>
                            </div>
                        </div>
                    )))}
                </div>
            </section>

            {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
        </div>
    );
}
