import { AVATARS } from '../data/avatars';

// Dessin des avatars. Tout est tracé dans un repère local : le corps occupe
// 110 de large sur "height" de haut, et le personnage regarde vers la droite
// (le joueur de droite est simplement affiché en miroir).

const INK = 'var(--char-ink)';
const line = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round', fill: 'none' };
const part = { fill: '#fff', stroke: INK, strokeWidth: 5 };

/**
 * Les yeux, selon l'humeur : 'angry' (en forme), 'worried' (vie moyenne),
 * 'hurt' (vie basse), 'happy' (victoire), 'sad' (défaite), 'ko'.
 */
function Eyes({ eyes, mood }) {
    const { cx1, cx2, cy } = eyes;
    if (mood === 'ko') {
        return (
            <g style={line}>
                {[cx1, cx2].map((cx) => (
                    <g key={cx}>
                        <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} />
                        <line x1={cx - 6} y1={cy + 6} x2={cx + 6} y2={cy - 6} />
                    </g>
                ))}
            </g>
        );
    }
    if (mood === 'happy') {
        return (
            <g style={line}>
                {[cx1, cx2].map((cx) => (
                    <path key={cx} d={`M${cx - 7} ${cy + 3} Q${cx} ${cy - 9} ${cx + 7} ${cy + 3}`} />
                ))}
            </g>
        );
    }
    if (mood === 'hurt') {
        // Yeux plissés de douleur : > <
        return (
            <g style={line}>
                <path d={`M${cx1 - 6} ${cy - 6} L${cx1 + 5} ${cy} L${cx1 - 6} ${cy + 6}`} />
                <path d={`M${cx2 + 6} ${cy - 6} L${cx2 - 5} ${cy} L${cx2 + 6} ${cy + 6}`} />
            </g>
        );
    }
    const brow = mood === 'sad' || mood === 'worried' ? -1 : 1; // sourcils inversés quand il est inquiet ou triste
    return (
        <g>
            <circle cx={cx1} cy={cy} r="5" fill={INK} />
            <circle cx={cx2} cy={cy} r="5" fill={INK} />
            <g style={line}>
                <line x1={cx1 - 9} y1={cy - 13.5 - 3.5 * brow} x2={cx1 + 8} y2={cy - 13.5 + 3.5 * brow} />
                <line x1={cx2 - 8} y1={cy - 13.5 + 3.5 * brow} x2={cx2 + 9} y2={cy - 13.5 - 3.5 * brow} />
            </g>
        </g>
    );
}

// Ce qui est dessiné sur la face avant de chaque avatar (sans les yeux).
const FRONTS = {
    console: () => (
        <g fill={INK}>
            <rect style={part} x="17" y="16" width="76" height="54" rx="8" />
            <rect x="24" y="101" width="30" height="10" rx="2" />
            <rect x="34" y="91" width="10" height="30" rx="2" />
            <circle className="av-button av-button-a" cx="74" cy="100" r="6" />
            <circle className="av-button av-button-b" cx="90" cy="114" r="6" />
            <circle cx="68" cy="134" r="2" /><circle cx="78" cy="134" r="2" /><circle cx="88" cy="134" r="2" />
        </g>
    ),
    tower: () => (
        <g fill={INK}>
            <rect style={part} x="18" y="104" width="64" height="34" rx="5" />
            <g style={{ ...line, strokeWidth: 3 }}>
                <line x1="26" y1="116" x2="74" y2="116" />
                <line x1="26" y1="126" x2="74" y2="126" />
            </g>
            <circle className="av-led av-led-1" cx="70" cy="86" r="2.5" />
            <circle className="av-led av-led-2" cx="80" cy="86" r="2.5" />
            <circle className="av-led av-led-3" cx="90" cy="86" r="2.5" />
        </g>
    ),
    tv: () => (
        <g fill={INK}>
            <g className="av-antenna">
                <g style={line}>
                    <line x1="55" y1="0" x2="36" y2="-24" />
                    <line x1="55" y1="0" x2="76" y2="-20" />
                </g>
                <circle cx="36" cy="-24" r="4" /><circle cx="76" cy="-20" r="4" />
            </g>
            <rect style={part} x="12" y="14" width="72" height="72" rx="16" />
            <circle cx="97" cy="28" r="5" />
            <circle cx="97" cy="48" r="5" />
            <g style={{ ...line, strokeWidth: 3 }}>
                <line x1="20" y1="104" x2="60" y2="104" />
                <line x1="20" y1="116" x2="60" y2="116" />
            </g>
            <rect x="72" y="100" width="24" height="20" rx="4" />
        </g>
    ),
    radio: () => (
        <g fill={INK}>
            <circle style={part} cx="55" cy="92" r="34" />
            <g className="av-speaker">
                <circle style={{ ...line, strokeWidth: 3 }} cx="55" cy="92" r="22" />
                <circle cx="55" cy="92" r="8" />
            </g>
            <rect x="12" y="16" width="16" height="6" rx="3" />
            <rect x="12" y="30" width="16" height="6" rx="3" />
        </g>
    ),
};

// Gouttes de sueur : une quand il s'inquiète, deux quand il a mal.
function Sweat({ mood }) {
    if (mood !== 'worried' && mood !== 'hurt') return null;
    const drop = 'M0 -9 C5 -2 6 2 0 6 C-6 2 -5 -2 0 -9 Z';
    return (
        <g className="av-sweat" fill="#7cc8ff" stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <path d={drop} transform="translate(98 20)" />
            {mood === 'hurt' && <path d={drop} transform="translate(12 30) scale(0.8)" />}
        </g>
    );
}

/**
 * Gant de boxe : poing rond tourné vers la droite, pouce et manchette blanche.
 * (x, y) est le coin haut-gauche d'une boîte d'environ 30 × 28.
 */
export function Glove({ x, y, color }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x="-7" y="6" width="12" height="16" rx="3" fill="#fff" stroke={INK} strokeWidth="4" />
            <path
                d="M5 0 h13 a12 12 0 0 1 12 12 v4 a12 12 0 0 1 -12 12 h-13 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4 z"
                fill={color}
                stroke={INK}
                strokeWidth="4.5"
                strokeLinejoin="round"
            />
            <path d="M7 10 q8 -6 15 1" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        </g>
    );
}

function Accessory({ id, eyes, mood, height }) {
    if (id === 'bow') {
        return (
            <g fill="#ff5d8f" stroke={INK} strokeWidth="4" strokeLinejoin="round">
                <path d="M30 2 L8 -11 L8 15 Z" />
                <path d="M30 2 L52 -11 L52 15 Z" />
                <circle cx="30" cy="2" r="6.5" />
            </g>
        );
    }
    if (id === 'crown') {
        return (
            <path
                d="M30 3 L30 -24 L43 -11 L55 -30 L67 -11 L80 -24 L80 3 Z"
                fill="#ffc531"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
            />
        );
    }
    if (id === 'cap') {
        return (
            <g fill="#ff6b5e" stroke={INK} strokeWidth="4" strokeLinejoin="round">
                <path d="M16 3 A39 34 0 0 1 94 3 Z" />
                <rect x="84" y="-6" width="38" height="9" rx="4.5" />
            </g>
        );
    }
    // Déguisement du duel au Far West (pas proposé dans les réglages)
    if (id === 'cowboy') {
        const neck = height * 0.6;
        return (
            <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
                {/* Foulard */}
                <path d={`M3 ${neck} L107 ${neck} L55 ${neck + 34} Z`} fill="#d9372c" />
                <path d={`M3 ${neck} L107 ${neck}`} stroke="#fff" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
                {/* Étoile de shérif */}
                <path
                    transform={`translate(88 ${height - 20})`}
                    d="M0 -11 L3 -3.5 L11 -3.5 L4.6 1.4 L7 9 L0 4.4 L-7 9 L-4.6 1.4 L-11 -3.5 L-3 -3.5 Z"
                    fill="#ffc531"
                    strokeWidth="3"
                />
                {/* Chapeau */}
                <path d="M26 2 C24 -36 42 -42 55 -31 C68 -42 86 -36 84 2 Z" fill="#9a6532" />
                <path d="M27 -9 L83 -9 L84 2 L26 2 Z" fill="#5b3716" />
                <path d="M-22 -2 C-6 12 116 12 132 -2 C120 -8 -10 -8 -22 -2 Z" fill="#b47a40" />
            </g>
        );
    }
    if (id === 'shades' && mood !== 'ko') {
        const { cx1, cx2, cy } = eyes;
        return (
            <g fill={INK} stroke={INK} strokeWidth="4" transform={mood === 'hurt' ? `rotate(9 ${cx1} ${cy})` : undefined}>
                <rect x={cx1 - 12} y={cy - 8} width="23" height="16" rx="5" />
                <rect x={cx2 - 11} y={cy - 8} width="23" height="16" rx="5" />
                <line x1={cx1 + 8} y1={cy - 3} x2={cx2 - 8} y2={cy - 3} />
            </g>
        );
    }
    return null;
}

/** Face avant seule (dessin + yeux + accessoire) : utilisée telle quelle par l'arène 3D. */
export function AvatarFront({ player, mood = 'angry' }) {
    const { eyes, height } = AVATARS[player.avatar];
    const Front = FRONTS[player.avatar];
    const hideEyes = player.accessory === 'shades' && mood !== 'ko';
    return (
        <g>
            <Front />
            {!hideEyes && <Eyes eyes={eyes} mood={mood} />}
            <Accessory id={player.accessory} eyes={eyes} mood={mood} height={height} />
            <Sweat mood={mood} />
        </g>
    );
}

/** Corps complet en 2D : jambes, bloc coloré et face avant. Origine = coin haut-gauche du bloc. */
export function AvatarBody({ player, mood }) {
    const { height } = AVATARS[player.avatar];
    return (
        <g>
            <g style={line}>
                <line x1="32" y1={height} x2="32" y2={height + 34} />
                <line x1="80" y1={height} x2="80" y2={height + 34} />
            </g>
            <rect style={part} x="26" y={height + 30} width="26" height="10" rx="5" />
            <rect style={part} x="74" y={height + 30} width="26" height="10" rx="5" />
            <rect x="7" y="7" width="110" height={height} rx="16" fill={INK} opacity="0.9" />
            <rect x="0" y="0" width="110" height={height} rx="16" fill={player.color} stroke={INK} strokeWidth="5" />
            <AvatarFront player={player} mood={mood} />
        </g>
    );
}

/**
 * Personnage entier dans son propre SVG (aperçu des réglages, podium).
 * mood 'happy' : bras levés ; "flip" : regarde vers la gauche.
 */
export function AvatarFigure({ player, mood = 'angry', flip = false, className = '' }) {
    const { height } = AVATARS[player.avatar];
    const armsUp = mood === 'happy';
    const gloveY = armsUp ? -6 : height * 0.5;
    return (
        <svg className={`avatar-figure av-${player.avatar} ${className}`} viewBox={`-34 -40 186 ${height + 86}`} aria-hidden="true">
            {/* Le miroir est fait à l'intérieur du dessin : la danse (animée sur le SVG) ne l'annule pas. */}
            <g transform={flip ? 'translate(118 0) scale(-1 1)' : undefined}>
                <AvatarBody player={player} mood={mood} />
                {armsUp && (
                    <g style={line}>
                        <line x1="0" y1={height * 0.42} x2="-14" y2="14" />
                        <line x1="110" y1={height * 0.42} x2="124" y2="14" />
                    </g>
                )}
                <Glove x={-32} y={gloveY} color={player.gloves} />
                <Glove x={114} y={gloveY} color={player.gloves} />
            </g>
        </svg>
    );
}
