import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useEscape } from '../hooks/useEscape';
import { useI18n } from '../i18n/context';
import { playTrack, stopTrack } from '../utils/music';
import { playSound } from '../utils/audio';
import { bfs, coordsOf, hasDoor, roundScore, wallKey } from '../utils/escape';
import { AvatarFigure } from './Avatar';
import Tile from './Tile';

// La vraie 3D (Three.js) n'est téléchargée que si on choisit la vue 3D.
const Escape3D = lazy(() => import('../three/Escape3D'));

// Escape : la maison vue du dessus (2D) ou en perspective (3D), toutes portes ouvertes.
// On mémorise d'abord une séquence (comme WordSwap Calc) ; ensuite chaque porte
// proposée affiche un calcul « émoji ± chiffre » dans la pièce voisine, et cliquer
// sa réponse (ou taper son numéro) t'emmène derrière cette porte.
// Chaque pièce, chaque mur et chaque personnage est un <div> placé avec des
// variables CSS (--x, --y en nombre de pièces) ; la 3D incline simplement le plan
// et redresse les murs et les personnages.

function Monster() {
    // Créature voûtée aux bras trop longs, gueule pleine de crocs et yeux rouges.
    return (
        <svg className="esc-monster-svg" viewBox="0 0 120 150" aria-hidden="true">
            <defs>
                <radialGradient id="esc-aura">
                    <stop offset="0" stopColor="#ff1a1a" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#ff1a1a" stopOpacity="0" />
                </radialGradient>
            </defs>
            <ellipse cx="60" cy="70" rx="60" ry="70" fill="url(#esc-aura)" />
            <ellipse cx="60" cy="144" rx="34" ry="6" className="esc-shadow" />
            {/* Bras interminables et griffes */}
            <path className="esc-monster-arm" d="M30 62 C14 80 10 104 12 132 M90 62 C106 80 110 104 108 132" />
            <path className="esc-monster-claw" d="M12 130 l-8 14 M12 130 l0 16 M12 130 l8 14 M108 130 l-8 14 M108 130 l0 16 M108 130 l8 14" />
            {/* Corps voûté en lambeaux */}
            <path className="esc-monster-body" d="M60 40 C88 40 98 66 96 96 C95 112 100 126 104 140 L92 132 L86 142 L76 130 L68 142 L60 130 L52 142 L44 130 L34 142 L28 132 L16 140 C20 126 25 112 24 96 C22 66 32 40 60 40 Z" />
            {/* Tête allongée */}
            <path className="esc-monster-head" d="M60 4 C82 4 90 22 88 40 C86 56 76 68 60 70 C44 68 34 56 32 40 C30 22 38 4 60 4 Z" />
            <path className="esc-monster-crack" d="M60 6 l-4 10 l6 6 l-5 9 M78 14 l-6 8" />
            {/* Yeux en fente */}
            <path className="esc-monster-eye" d="M40 30 L54 36 L41 39 Z M80 30 L66 36 L79 39 Z" />
            {/* Gueule et crocs */}
            <path className="esc-monster-mouth" d="M42 48 C50 62 70 62 78 48 C70 54 50 54 42 48 Z" />
            <path className="esc-monster-teeth" d="M45 50 l3 6 l3 -5 l3 7 l3 -6 l3 7 l3 -6 l3 6 l3 -5 l3 6 l3 -5" />
        </svg>
    );
}

/** Tous les murs de la maison : intérieurs (avec ou sans porte) et extérieurs. */
function useWalls(house) {
    const walls = [];
    for (let r = 0; r < house.rows; r++) {
        for (let c = 0; c < house.cols; c++) {
            const cell = r * house.cols + c;
            if (c < house.cols - 1) walls.push({ key: wallKey(cell, cell + 1), x: c + 1, y: r, v: true, cells: [cell, cell + 1], door: hasDoor(house, cell, cell + 1) });
            if (r < house.rows - 1) walls.push({ key: wallKey(cell, cell + house.cols), x: c, y: r + 1, v: false, cells: [cell, cell + house.cols], door: hasDoor(house, cell, cell + house.cols) });
            if (r === 0) walls.push({ key: `out-${cell}-up`, x: c, y: 0, v: false, cells: [cell], outer: true });
            if (r === house.rows - 1) walls.push({ key: `out-${cell}-down`, x: c, y: r + 1, v: false, cells: [cell], outer: true });
            if (c === 0) walls.push({ key: `out-${cell}-left`, x: 0, y: r, v: true, cells: [cell], outer: true });
            if (c === house.cols - 1) walls.push({ key: `out-${cell}-right`, x: c + 1, y: r, v: true, cells: [cell], outer: true });
        }
    }
    return walls;
}

export default function EscapeBoard({ config, player, onFinished, onQuit }) {
    const { t } = useI18n();
    const game = useEscape(config, onFinished);
    const { house, phase, event } = game;
    const playing = phase === 'play';
    const presenting = phase === 'reveal' || phase === 'countdown';
    // Vue 3D en Three.js ; si le navigateur ne gère pas la 3D, on garde l'ancienne vue en perspective CSS.
    const [webglFailed, setWebglFailed] = useState(false);
    // Escape est toujours en 3D : vraie 3D (Three.js), ou 3D en CSS si le navigateur ne gère pas WebGL.
    const view = '3d';
    const realThree = !webglFailed;
    const walls = useWalls(house);

    // Distance du monstre (en portes) : à deux portes ou moins, la tension monte.
    const monsterDist = bfs(house, game.player).dist[game.monster];
    const near = playing && monsterDist <= 2;
    const dangerDoors = playing ? game.calcs.filter((c) => c.cell === game.monster).map((c) => wallKey(game.player, c.cell)) : [];
    const offered = playing ? game.calcs.map((c) => wallKey(game.player, c.cell)) : [];

    // Au lancement, le plateau est cadré en haut de l'écran, et la musique d'Escape
    // (public/escape.mp3) tourne en boucle tant qu'on est dans la maison.
    const panelRef = useRef(null);
    useEffect(() => {
        panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        playTrack(`${import.meta.env.BASE_URL}escape.mp3`);
        return () => stopTrack();
    }, []);

    // Bruitages, un par événement ; le monstre grogne quand il approche.
    useEffect(() => {
        const sounds = { step: 'step', play: 'lightsout', escaped: 'escape', caught: 'caught', round: 'whoosh', reveal: 'whoosh' };
        if (sounds[event.type]) playSound(sounds[event.type]);
        if (event.type === 'hunt' && monsterDist <= 3) playSound('creature');
        const timers = [];
        // Présentation : le monstre rugit quand la caméra le montre
        if (event.type === 'reveal') timers.push(setTimeout(() => playSound('creature'), 1500));
        // Compte à rebours : 3, 2, 1… (même rythme que l'animation CSS)
        if (event.type === 'countdown') [0, 700, 1400].forEach((at) => timers.push(setTimeout(() => playSound('tick'), at)));
        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- un son par événement
    }, [event.id]);
    // Le cœur s'emballe quand il est tout près.
    useEffect(() => {
        if (!near) return undefined;
        const beat = setInterval(() => playSound('heartbeat'), monsterDist <= 1 ? 480 : 820);
        return () => clearInterval(beat);
    }, [near, monsterDist]);

    // Clavier : 1, 2, 3 pour choisir une réponse ; Entrée pour lancer la poursuite.
    const { answer, ready: start, options } = game;
    useEffect(() => {
        const onKey = (e) => {
            const index = Number(e.key) - 1;
            if (playing && index >= 0 && index < options.length) {
                e.preventDefault();
                answer(options[index]);
            } else if (e.key === 'Enter' && phase === 'memorize') {
                start();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answer, start, options, playing, phase]);

    const [px, py] = coordsOf(house, game.player);
    const [mx, my] = coordsOf(house, game.monster);
    const last = game.history[game.history.length - 1];
    const calcIn = (cell) => (playing ? game.calcs.find((c) => c.cell === cell) : null);

    let status = t('escape.status.play');
    if (phase === 'memorize') status = t('escape.status.memorize');
    else if (phase === 'reveal') status = t('escape.status.reveal');
    else if (phase === 'countdown') status = t('escape.status.countdown');
    else if (phase === 'escaped') status = t('escape.status.escaped', { n: roundScore(last) });
    else if (phase === 'caught') status = t('escape.status.caught');
    else if (near) status = t('escape.status.near');
    // Après chaque pas, la carte de la réponse se retourne un instant (vérification).
    const flash = event.type === 'step' && game.lastStep ? game.lastStep.answerPosition : null;

    return (
        <div ref={panelRef} className="panel panel-wide escape">
            <div className="board-top">
                <div className="board-progress">
                    <span className="round-label">{t('escape.round', { n: game.round, total: game.rounds })}</span>
                </div>
                <div className="esc-stats">
                    <span title={t('escape.moves')}><i className="fa-solid fa-shoe-prints" aria-hidden="true"></i> {game.moves}</span>
                </div>
                <button type="button" className="icon-button" onClick={onQuit} aria-label={t('board.quit')} title={t('board.quit')}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <p className={`escape-status is-${phase}`} aria-live="polite">{status}</p>

            {/* La séquence (WordSwap Calc), retournée pendant la poursuite : la réponse se dévoile un instant après chaque pas */}
            {phase !== 'memorize' && (
                <div className={`esc-sequence phase-${phase}`} style={{ '--n': game.sequence.length }}>
                    {game.sequence.map((item, i) => (
                        <Tile
                            key={`${game.round}-${i}`}
                            item={item}
                            position={i + 1}
                            hidden={flash !== i + 1}
                            highlight={flash === i + 1}
                            label={t('board.pos', { n: i + 1 })}
                            hiddenLabel={t('board.hidden', { n: i + 1 })}
                        />
                    ))}
                </div>
            )}

            <div
                className={`esc-view is-${view} ${realThree ? 'is-webgl' : ''} phase-${phase} ${presenting ? 'is-presenting' : ''} ${near ? `is-near near-${monsterDist}` : ''}`}
                style={{ '--cols': house.cols, '--rows': house.rows }}
            >
                {realThree && (
                    <Suspense fallback={<div className="esc-canvas is-loading" />}>
                        <Escape3D
                            house={house}
                            player={game.player}
                            monster={game.monster}
                            calcs={game.calcs}
                            phase={phase}
                            near={near ? monsterDist : 0}
                            hero={player}
                            onFail={() => setWebglFailed(true)}
                        />
                    </Suspense>
                )}
                <div className="esc-camera" hidden={realThree}>
                    <div className="esc-house" key={`house-${game.round}`}>
                        {Array.from({ length: house.cols * house.rows }, (_, cell) => {
                            const [x, y] = coordsOf(house, cell);
                            const calc = calcIn(cell);
                            const classes = ['esc-room', cell === game.player ? 'is-here' : '', cell === house.exit ? 'is-exit' : '', cell === game.monster ? 'is-monster' : '', game.trail.includes(cell) ? 'is-visited' : '', calc ? 'is-door' : ''];
                            return (
                                <div key={cell} className={classes.join(' ')} style={{ '--x': x, '--y': y }}>
                                    {cell === house.exit && <span className="esc-hatch" />}
                                    {presenting && cell === house.start && <span className="esc-tag is-you">{t('escape.legend.you')}</span>}
                                    {presenting && cell === house.exit && <span className="esc-tag is-exit">{t('escape.legend.exit')}</span>}
                                    {presenting && cell === game.monster && <span className="esc-tag is-beast">{t('escape.legend.monster')}</span>}
                                    {calc && (
                                        <span className="esc-calc" key={`${game.player}-${calc.item}${calc.op}${calc.value}`}>
                                            <span className="esc-calc-item">{calc.item}</span> {calc.op === '+' ? '+' : '−'} {calc.value}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {walls.map((w) => {
                            const classes = ['esc-wall', 'is-on', w.v ? 'is-v' : 'is-h', w.door ? 'has-door' : '', w.outer ? 'is-outer' : '', offered.includes(w.key) ? 'is-offered' : '', dangerDoors.includes(w.key) ? 'is-danger' : ''];
                            return (
                                <div key={w.key} className={classes.join(' ')} style={{ '--x': w.x, '--y': w.y }}>
                                    {w.door ? (<><i /><i /></>) : <i />}
                                </div>
                            );
                        })}
                        <div className="esc-token esc-player" style={{ '--x': px, '--y': py }}>
                            <div className="esc-lantern" />
                            <div className="esc-stand">
                                <AvatarFigure player={player} mood={phase === 'caught' ? 'ko' : phase === 'escaped' ? 'happy' : near ? 'worried' : 'angry'} />
                            </div>
                        </div>
                        <div className="esc-token esc-monster is-seen" style={{ '--x': mx, '--y': my }}>
                            <div className="esc-stand"><Monster /></div>
                        </div>
                    </div>
                </div>
                {/* 1. Ce qu'il faut retenir, en très grand, par-dessus la maison */}
                {phase === 'memorize' && (
                    <div className="esc-memo" key={`memo-${game.round}`}>
                        <p className="esc-memo-title">{t('escape.memo.title')}</p>
                        <div className="esc-memo-tiles" style={{ '--n': game.sequence.length }}>
                            {game.sequence.map((item, i) => (
                                <div key={i} className="esc-memo-tile" style={{ '--i': i }}>
                                    <span className={`esc-memo-item ${Number.isNaN(Number(item)) ? 'is-emoji' : ''}`}>{item}</span>
                                    <span className="esc-memo-pos">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                        <div className="esc-memo-bottom">
                            <div className="timer"><div className="timer-fill is-draining" style={{ animationDuration: `${game.seconds}s` }} /></div>
                            <button type="button" className="btn-mz btn-mz-sun" onClick={start}>{t('escape.ready')}</button>
                        </div>
                    </div>
                )}
                {/* 2. Présentation de la maison : toi, la sortie, le monstre */}
                {(phase === 'reveal' || phase === 'countdown') && (
                    <div className="esc-legend" key={`legend-${game.round}`}>
                        <span className="is-you" style={{ '--i': 0 }}>{t('escape.legend.you')}</span>
                        <span className="is-exit" style={{ '--i': 1 }}>{t('escape.legend.exit')}</span>
                        <span className="is-beast" style={{ '--i': 2 }}>{t('escape.legend.monster')}</span>
                    </div>
                )}
                {/* 3. Compte à rebours : 3, 2, 1… fuis ! */}
                {phase === 'countdown' && (
                    <div className="esc-countdown" key={`count-${game.round}`} aria-live="assertive">
                        {['3', '2', '1', t('escape.go')].map((label, i) => (
                            <span key={label} className={i === 3 ? 'is-go' : ''} style={{ '--i': i }}>{label}</span>
                        ))}
                    </div>
                )}
                <div className="esc-dust" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
                <div className="esc-vignette" />
                {/* En 3D, la capture est jouée dans la scène (le monstre se jette sur toi) : ici juste un éclair rouge */}
                {phase === 'caught' && realThree && <div className="esc-flash3d" aria-hidden="true" />}
                {phase === 'caught' && !realThree && (
                    <div className="esc-scare">
                        <Monster />
                    </div>
                )}
            </div>

            {/* Les réponses proposées : la bonne t'emmène dans la pièce de ce calcul */}
            <div className="esc-answers" role="group" aria-label={t('escape.answers')}>
                {options.map((value, i) => (
                    <button
                        key={`${game.player}-${game.moves}-${value}`}
                        type="button"
                        className={`esc-answer ${Number.isNaN(Number(value)) ? 'is-emoji' : ''}`}
                        onClick={() => answer(value)}
                        disabled={!playing}
                        style={{ '--i': i }}
                    >
                        <span className="esc-answer-value">{value}</span>
                        <span className="esc-answer-key">{i + 1}</span>
                    </button>
                ))}
            </div>
            <p className="text-soft small esc-hint">{t('escape.keys')}</p>
        </div>
    );
}
