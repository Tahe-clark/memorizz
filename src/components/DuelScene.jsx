import { AVATARS } from '../data/avatars';
import { cowboyLook } from '../utils/battle';
import { AvatarBody, Glove } from './Avatar';
import { DesertLayers, DesertOverlay } from './DesertBackdrop';

// Le duel au Far West (vue 2D), sur le décor partagé (DesertBackdrop).
// Les deux avatars sont en cowboys (chapeau, foulard, étoile) et tiennent un
// revolver. Comme dans l'arène, celui de droite est le miroir de celui de gauche.
// La cinématique d'entrée est dans DuelCinematic.

// Fumée du coup de feu : quelques bouffées qui gonflent et montent.
const SMOKE = [[0, 0, 11], [16, -6, 14], [32, -2, 12], [8, -16, 10], [44, -12, 9], [26, -22, 8]];

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
                    <path d="M262 156 l26 -18 l-8 15 l26 3 l-26 5 l8 15 z" />
                    <circle cx="264" cy="156" r="10" />
                </g>
            </g>
            <g className="cb-smoke">
                {SMOKE.map(([dx, dy, r], i) => (
                    <circle key={i} cx={270 + dx} cy={156 + dy} r={r} style={{ animationDelay: `${0.03 * i}s` }} />
                ))}
            </g>
            {/* Trajectoire d'un tir réussi, et d'un tir raté (trop haut) */}
            <line className="cb-bullet cb-bullet-hit" x1="262" y1="156" x2="540" y2="156" />
            <line className="cb-bullet cb-bullet-miss" x1="262" y1="156" x2="700" y2="40" />
        </g>
    );
}

export default function DuelScene({ battle, players }) {
    const key = battle.event.id;
    return (
        <svg className={`duel-scene phase-${battle.phase}`} viewBox="0 0 720 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <DesertLayers />
            <g className="ds-cowboy ds-cowboy-left">
                <Cowboy key={`l${key}`} player={players[0]} {...cowboyLook(0, battle)} />
            </g>
            <g className="ds-cowboy ds-cowboy-right" transform="translate(720 0) scale(-1 1)">
                <Cowboy key={`r${key}`} player={players[1]} {...cowboyLook(1, battle)} />
            </g>
            <DesertOverlay />
        </svg>
    );
}
