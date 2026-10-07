import { AVATARS } from '../data/avatars';
import { cowboyLook } from '../utils/battle';
import { AvatarBody, Glove } from './Avatar';

// Le duel au Far West (vue 2D) : coucher de soleil sur le désert, montagnes en
// plusieurs plans, cactus en fleurs, rochers, oiseaux et boule de foin qui roule.
// Les deux avatars sont en cowboys (chapeau, foulard, étoile) et tiennent un
// revolver. Comme dans l'arène, celui de droite est le miroir de celui de gauche.

function Cowboy({ player, state, mood }) {
    const { height } = AVATARS[player.avatar];
    return (
        <g className={`cowboy ${state}`}>
            <ellipse className="cb-shadow" cx="126" cy="264" rx="78" ry="9" />
            <g className="cb-body">
                <g transform={`translate(64 ${222 - height})`}>
                    <AvatarBody player={{ ...player, accessory: 'cowboy' }} mood={mood} />
                </g>
                <Glove x={46} y={150} color={player.gloves} />
            </g>
            <g className="cb-gun">
                <rect x="170" y="158" width="20" height="9" />
                <path className="cb-revolver" d="M212 152 h40 v9 h-22 l-4 16 h-12 z" />
                <Glove x={190} y={148} color={player.gloves} />
                <g className="cb-flash">
                    <path d="M262 156 l22 -16 l-8 14 l20 2 l-20 4 l8 14 z" />
                    <circle cx="262" cy="156" r="9" />
                </g>
            </g>
            {/* Trajectoire d'un tir réussi, et d'un tir raté (trop haut) */}
            <line className="cb-bullet cb-bullet-hit" x1="262" y1="156" x2="540" y2="156" />
            <line className="cb-bullet cb-bullet-miss" x1="262" y1="156" x2="700" y2="40" />
        </g>
    );
}

function Cactus({ x, y, scale = 1, flower = false }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`} className="ds-cactus">
            <path d="M-10 0 V-70 a10 10 0 0 1 20 0 V0 Z" />
            <path d="M-10 -28 h-14 a9 9 0 0 1 -9 -9 v-14 a7 7 0 0 1 14 0 v9 h9 Z" />
            <path d="M10 -40 h13 a9 9 0 0 0 9 -9 v-18 a7 7 0 0 0 -14 0 v13 h-8 Z" />
            <path className="ds-cactus-rib" d="M-3 -6 V-72 M4 -6 V-72" />
            {flower && <circle className="ds-flower" cx="0" cy="-82" r="6" />}
            {flower && <circle className="ds-flower" cx="25" cy="-76" r="4.5" />}
        </g>
    );
}

const ROCKS = [[96, 281, 15, 6], [286, 290, 10, 4], [404, 273, 8, 3.5], [540, 286, 13, 5], [650, 277, 7, 3]];
const TUFTS = [150, 250, 352, 478, 590, 690];

export default function DuelScene({ battle, players, title, subtitle }) {
    const key = battle.event.id;
    return (
        <svg className={`duel-scene phase-${battle.phase}`} viewBox="0 0 720 300" aria-hidden="true">
            <defs>
                <linearGradient id="duel-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f2603c" />
                    <stop offset="0.5" stopColor="#ffa558" />
                    <stop offset="0.82" stopColor="#ffe0a0" />
                </linearGradient>
                <linearGradient id="duel-sand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f7d38f" />
                    <stop offset="1" stopColor="#dd9d55" />
                </linearGradient>
                <radialGradient id="duel-glow">
                    <stop offset="0.35" stopColor="#fff6c4" stopOpacity="0.75" />
                    <stop offset="1" stopColor="#fff6c4" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="duel-vignette" cx="0.5" cy="0.45" r="0.75">
                    <stop offset="0.55" stopColor="#3a1300" stopOpacity="0" />
                    <stop offset="1" stopColor="#3a1300" stopOpacity="0.45" />
                </radialGradient>
            </defs>
            <rect width="720" height="300" fill="url(#duel-sky)" />

            {/* Soleil couchant : halo, rayons qui tournent, disque */}
            <circle cx="360" cy="132" r="150" fill="url(#duel-glow)" />
            <g className="ds-rays">
                {Array.from({ length: 16 }, (_, i) => (
                    <line key={i} x1="360" y1="40" x2="360" y2={i % 2 ? 62 : 54} transform={`rotate(${i * 22.5} 360 132)`} />
                ))}
            </g>
            <circle className="ds-sun-disc" cx="360" cy="132" r="56" />

            {/* Nuages effilés */}
            <g className="ds-clouds">
                <rect x="40" y="46" width="170" height="9" rx="4.5" />
                <rect x="90" y="60" width="110" height="7" rx="3.5" />
                <rect x="500" y="34" width="150" height="9" rx="4.5" />
                <rect x="470" y="50" width="210" height="7" rx="3.5" />
                <rect x="250" y="20" width="120" height="6" rx="3" />
            </g>
            {/* Oiseaux */}
            <g className="ds-birds">
                <path d="M0 0 q7 -8 14 0 q7 -8 14 0" />
                <path d="M34 14 q5 -6 10 0 q5 -6 10 0" />
                <path d="M-22 18 q5 -6 10 0 q5 -6 10 0" />
            </g>

            {/* Montagnes : un plan lointain clair, puis les mesas */}
            <path className="ds-far" d="M0 232 L0 178 L70 150 L130 176 L210 140 L300 182 L380 168 L470 136 L540 174 L620 148 L720 180 L720 232 Z" />
            <path className="ds-mesa" d="M0 236 L0 196 L46 196 L58 168 L140 168 L152 200 L250 200 L262 218 L420 218 L436 184 L470 184 L480 156 L560 156 L574 190 L660 190 L672 208 L720 208 L720 236 Z" />
            <path className="ds-strata" d="M52 182 H146 M476 170 H566 M440 198 H570 M4 208 H150 M664 198 H720" />

            {/* Sable, dune, cailloux, touffes d'herbe sèche */}
            <rect y="230" width="720" height="70" fill="url(#duel-sand)" />
            <path className="ds-dune" d="M0 250 C120 232 240 262 360 246 C480 230 600 262 720 244 L720 232 L0 232 Z" />
            {ROCKS.map(([cx, cy, rx, ry]) => <ellipse key={cx} className="ds-rock" cx={cx} cy={cy} rx={rx} ry={ry} />)}
            {TUFTS.map((x, i) => (
                <path key={x} className="ds-tuft" d={`M${x} ${272 + (i % 3) * 7} l-5 -9 M${x} ${272 + (i % 3) * 7} l0 -11 M${x} ${272 + (i % 3) * 7} l5 -9`} />
            ))}
            <Cactus x={300} y={240} scale={0.5} />
            <Cactus x={452} y={244} scale={0.72} flower />
            <Cactus x={20} y={272} scale={1.2} flower />
            <Cactus x={702} y={274} scale={1.08} />

            {/* Boule de foin qui traverse le désert */}
            <g className="ds-tumble">
                <g className="ds-tumble-roll">
                    <circle r="17" />
                    <path d="M-12 -6 C-4 -14 8 -12 12 -2 C8 10 -6 12 -12 4 M-6 -12 C2 -2 2 6 -4 12 M-14 2 C-4 0 6 2 14 6" />
                </g>
            </g>

            <g className="ds-cowboy ds-cowboy-left">
                <Cowboy key={`l${key}`} player={players[0]} {...cowboyLook(0, battle)} />
            </g>
            <g className="ds-cowboy ds-cowboy-right" transform="translate(720 0) scale(-1 1)">
                <Cowboy key={`r${key}`} player={players[1]} {...cowboyLook(1, battle)} />
            </g>

            {/* Poussière portée par le vent, puis assombrissement des bords */}
            <g className="ds-dust">
                {[[80, 236], [240, 254], [420, 244], [560, 262], [660, 240]].map(([x, y], i) => (
                    <circle key={x} cx={x} cy={y} r={2 + (i % 2)} style={{ animationDelay: `${i * -1.3}s` }} />
                ))}
            </g>
            <rect width="720" height="300" fill="url(#duel-vignette)" />

            {/* Cinématique : bandes noires et titre */}
            <rect className="ds-bar ds-bar-top" width="720" height="44" />
            <rect className="ds-bar ds-bar-bottom" y="256" width="720" height="44" />
            <g className="ds-title">
                <text x="360" y="152" textAnchor="middle" className="ds-title-main">★ {title} ★</text>
                <text x="360" y="186" textAnchor="middle" className="ds-title-sub">{subtitle}</text>
            </g>
        </svg>
    );
}
