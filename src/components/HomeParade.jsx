import { useEffect, useState } from 'react';
import { AVATAR_COLORS, AVATAR_IDS, normalizePlayer } from '../data/avatars';
import { readStorage } from '../utils/storage';
import { AvatarBody, AvatarFigure, Glove } from './Avatar';

// Petites scènes qui traversent l'écran d'accueil de temps en temps, sur une
// route dessinée sous le titre. Les avatars sont ceux des joueurs (réglages de
// Battle). Les scènes passent dans un ordre mélangé, sans répétition immédiate.
const FIRST_DELAY = 2500;
const pause = () => 7000 + Math.random() * 7000; // temps calme entre deux scènes

/* ---------- Éléments de décor ---------- */

function Wheel({ cx, cy = 92, r = 15 }) {
    return (
        <g className="pr-wheel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <circle cx={cx} cy={cy} r={r} />
            <path d={`M${cx - r * 0.6} ${cy} H${cx + r * 0.6} M${cx} ${cy - r * 0.6} V${cy + r * 0.6}`} />
        </g>
    );
}

// Une voiture décapotable : l'avatar dépasse de l'habitacle.
function Car({ player, police = false }) {
    return (
        <svg className={`pr-car ${police ? 'is-police' : ''}`} viewBox="0 0 230 112" aria-hidden="true">
            <g transform="translate(72 -10) scale(0.44)">
                <AvatarBody player={player} mood={police ? 'angry' : 'worried'} />
            </g>
            <path className="pr-body" d="M10 88 V66 q0 -10 12 -12 l34 -6 h96 q22 0 40 14 l22 6 q8 2 8 12 v8 z" style={police ? undefined : { fill: player.color }} />
            {police && <path className="pr-stripe" d="M10 74 H222 v8 H10 z" />}
            {police && <text x="112" y="71" textAnchor="middle" className="pr-label">POLICE</text>}
            <path className="pr-shield" d="M150 48 l20 14 h-30 z" />
            {police && (
                <g>
                    <rect className="pr-light pr-light-a" x="30" y="40" width="14" height="10" rx="3" />
                    <rect className="pr-light pr-light-b" x="44" y="40" width="14" height="10" rx="3" />
                </g>
            )}
            <Wheel cx={56} />
            <Wheel cx={176} />
        </svg>
    );
}

function CactusBall() {
    return (
        <svg className="pr-cactus" viewBox="-40 -40 80 80" aria-hidden="true">
            <g className="cactus-spikes">
                {Array.from({ length: 14 }, (_, i) => <line key={i} x1="0" y1="-26" x2="0" y2="-36" transform={`rotate(${i * (360 / 14)})`} />)}
            </g>
            <circle r="27" className="cactus-body" />
            <path className="cactus-ribs" d="M-14 -22 C-22 -8 -22 8 -14 22 M0 -27 V27 M14 -22 C22 -8 22 8 14 22" />
        </svg>
    );
}

function Tumbleweed() {
    return (
        <svg className="pr-weed" viewBox="-20 -20 40 40" aria-hidden="true">
            <circle r="17" />
            <path d="M-12 -6 C-4 -14 8 -12 12 -2 C8 10 -6 12 -12 4 M-6 -12 C2 -2 2 6 -4 12 M-14 2 C-4 0 6 2 14 6" />
        </svg>
    );
}

// Soucoupe volante : son rayon emporte un avatar.
function Ufo({ player }) {
    return (
        <svg className="pr-ufo" viewBox="0 0 150 118" aria-hidden="true">
            <path className="ufo-beam" d="M52 34 L98 34 L126 118 L24 118 Z" />
            <g className="ufo-catch" transform="translate(56 62) scale(0.3)">
                <AvatarBody player={player} mood="hurt" />
            </g>
            <path className="ufo-dome" d="M50 22 a25 22 0 0 1 50 0 z" />
            <ellipse className="ufo-hull" cx="75" cy="27" rx="62" ry="13" />
            {[30, 52, 75, 98, 120].map((x, i) => <circle key={x} className="ufo-lamp" cx={x} cy="29" r="4" style={{ animationDelay: `${i * -0.15}s` }} />)}
        </svg>
    );
}

// Fusée couchée, avec son pilote à califourchon.
function Rocket({ player }) {
    return (
        <svg className="pr-rocket" viewBox="0 0 210 104" aria-hidden="true">
            <path className="rocket-flame" d="M40 66 L4 54 L24 66 L0 76 L40 80 Z" />
            <g transform="translate(88 -6) scale(0.4)">
                <AvatarBody player={player} mood="happy" />
            </g>
            <path className="rocket-fin" d="M52 52 L30 34 L70 50 Z M52 92 L30 110 L70 94 Z" />
            <path className="rocket-body" d="M40 54 H150 Q196 62 206 73 Q196 84 150 92 H40 Q32 73 40 54 Z" style={{ fill: player.color }} />
            <circle className="rocket-window" cx="150" cy="73" r="10" />
        </svg>
    );
}

// Skateboard : l'avatar fait une figure au milieu du trajet.
function Skater({ player }) {
    return (
        <div className="pr-skater">
            <AvatarFigure player={player} mood="happy" />
            <svg className="pr-board" viewBox="0 0 90 22" aria-hidden="true">
                <path d="M6 6 Q2 6 4 2 M84 6 Q88 6 86 2 M6 6 H84" />
                <circle cx="22" cy="14" r="6" /><circle cx="68" cy="14" r="6" />
            </svg>
        </div>
    );
}

// Petit train : l'avatar tire des wagons-tuiles qui se retournent, comme dans le jeu.
function TileTrain({ player }) {
    return (
        <div className="pr-train">
            {['4', '🐙', '2', '1'].map((item, i) => (
                <div key={item} className="pr-wagon" style={{ '--i': i }}>
                    <div className="pr-wagon-tile"><span>{item}</span><span>?</span></div>
                    <i /><i />
                </div>
            ))}
            <AvatarFigure player={player} mood="happy" />
        </div>
    );
}

// L'avatar s'envole, suspendu à trois ballons.
function Balloons({ player }) {
    return (
        <svg className="pr-balloons" viewBox="0 0 110 150" aria-hidden="true">
            {[[30, 26, '#ff5d8f'], [56, 16, '#ffd23f'], [82, 28, '#5b8cff']].map(([x, y, color]) => (
                <g key={x}>
                    <path className="balloon-string" d={`M${x} ${y + 18} Q${(x + 55) / 2} 70 55 86`} />
                    <ellipse className="balloon" cx={x} cy={y} rx="15" ry="18" style={{ fill: color }} />
                </g>
            ))}
            <g transform="translate(36 84) scale(0.34)">
                <AvatarBody player={player} mood="happy" />
            </g>
        </svg>
    );
}

// Un gant de boxe géant monté sur ressort.
function SpringGlove({ color }) {
    return (
        <svg className="pr-spring" viewBox="0 0 190 86" aria-hidden="true">
            <path className="spring-coil" d="M0 44 l10 -14 l12 28 l12 -28 l12 28 l12 -28 l12 28 l10 -14" />
            <g transform="translate(86 4) scale(2.7)"><Glove x={0} y={0} color={color} /></g>
        </svg>
    );
}

/* ---------- Les scènes ---------- */
// Chaque scène reçoit les deux joueurs (a, b) et la troupe complète des quatre avatars.
const SCENES = {
    // Course-poursuite : la police aux trousses d'une décapotable
    chase: ({ a, b }) => (
        <>
            <div className="pr-item pr-bump"><Car player={{ ...a, accessory: 'cap' }} police /></div>
            <div className="pr-item pr-bump pr-lead"><Car player={{ ...b, accessory: 'shades' }} /></div>
        </>
    ),
    // Fuite devant la boule de cactus
    cactus: ({ a }) => (
        <>
            <div className="pr-item pr-roll"><CactusBall /></div>
            <div className="pr-item pr-hop pr-lead"><AvatarFigure player={a} mood="hurt" /></div>
        </>
    ),
    // Défilé dansant des deux joueurs
    dance: ({ a, b }) => (
        <>
            <div className="pr-item"><AvatarFigure player={a} mood="happy" className={`is-emoting emote-${a.emote}`} /></div>
            <div className="pr-item"><AvatarFigure player={b} mood="happy" className={`is-emoting emote-${b.emote}`} /></div>
        </>
    ),
    // Enlèvement par une soucoupe volante
    ufo: ({ b }) => <div className="pr-item pr-float"><Ufo player={b} /></div>,
    // À califourchon sur une fusée
    rocket: ({ a }) => <div className="pr-item pr-bump"><Rocket player={a} /></div>,
    // Figure de skateboard
    skate: ({ b }) => <div className="pr-item"><Skater player={b} /></div>,
    // Le train des tuiles
    train: ({ a }) => <div className="pr-item"><TileTrain player={a} /></div>,
    // Envol en ballons
    balloons: ({ b }) => <div className="pr-item pr-float"><Balloons player={b} /></div>,
    // La chenille : les quatre avatars à la queue leu leu
    conga: ({ troupe }) => troupe.map((player, i) => (
        <div key={player.avatar} className="pr-item pr-conga" style={{ animationDelay: `${i * -0.14}s` }}>
            <AvatarFigure player={player} mood="happy" />
        </div>
    )),
    // Cowboy poursuivi par des boules de foin
    western: ({ a }) => (
        <>
            <div className="pr-item pr-roll"><Tumbleweed /></div>
            <div className="pr-item pr-roll pr-small"><Tumbleweed /></div>
            <div className="pr-item pr-roll"><Tumbleweed /></div>
            <div className="pr-item pr-hop pr-lead"><AvatarFigure player={{ ...a, accessory: 'cowboy' }} mood="worried" /></div>
        </>
    ),
    // Gant de boxe à ressort qui pourchasse un avatar
    glove: ({ a, b }) => (
        <>
            <div className="pr-item pr-punchy"><SpringGlove color={a.gloves} /></div>
            <div className="pr-item pr-hop"><AvatarFigure player={b} mood="hurt" /></div>
        </>
    ),
    // Course entre les deux joueurs, coude à coude
    race: ({ a, b }) => (
        <>
            <div className="pr-item pr-hop"><AvatarFigure player={a} mood="angry" /></div>
            <div className="pr-item pr-hop pr-late"><AvatarFigure player={b} mood="angry" /></div>
        </>
    ),
};
// Durée de traversée (secondes) : certaines scènes filent, d'autres flânent.
const SPEED = { rocket: 4.2, chase: 6.5, dance: 11, ufo: 10, balloons: 12, conga: 11, train: 10, skate: 7.5 };
const NAMES = Object.keys(SCENES);

function shuffled(previous) {
    const list = [...NAMES];
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    // Pas deux fois la même scène à la suite quand on recommence un tour.
    if (list[0] === previous) list.push(list.shift());
    return list;
}

export default function HomeParade() {
    const [scene, setScene] = useState(null); // { id, type }
    const [cast] = useState(() => {
        const saved = readStorage('battle:config', {});
        const [a, b] = [0, 1].map((i) => normalizePlayer(saved.players?.[i], i));
        // La troupe : un avatar de chaque sorte, chacun de sa couleur.
        const troupe = AVATAR_IDS.map((avatar, i) => ({ ...a, avatar, color: AVATAR_COLORS[i], accessory: 'none', emote: 'wiggle' }));
        return { a, b, troupe };
    });

    useEffect(() => {
        // Pas d'animation automatique si la personne a demandé moins de mouvement.
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        // ?scene=nom dans l'adresse : rejoue toujours cette scène (pratique pour tester).
        const forced = new URLSearchParams(window.location.search).get('scene');
        let id;
        let count = 0;
        let queue = [];
        let last = null;
        const play = () => {
            if (queue.length === 0) queue = shuffled(last);
            const type = SCENES[forced] ? forced : queue.shift();
            last = type;
            const duration = (SPEED[type] ?? 8) * 1000;
            if (!document.hidden) setScene({ id: count, type });
            count += 1;
            id = setTimeout(() => {
                setScene(null);
                id = setTimeout(play, forced ? 1500 : pause());
            }, duration);
        };
        id = setTimeout(play, FIRST_DELAY);
        return () => clearTimeout(id);
    }, []);

    const Scene = scene && SCENES[scene.type];
    return (
        <div className="parade" aria-hidden="true">
            {Scene && (
                <div key={scene.id} className={`pr-run scene-${scene.type}`} style={{ animationDuration: `${SPEED[scene.type] ?? 8}s` }}>
                    <Scene {...cast} />
                </div>
            )}
        </div>
    );
}
