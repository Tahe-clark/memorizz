import { AVATARS } from '../data/avatars';
import { fighterMood, fighterState, hpLevel } from '../utils/battle';
import { AvatarBody, Glove } from './Avatar';

// L'arène 2D du mode Battle, en SVG : un ring de boxe (tapis, cordes, poteaux,
// public dans l'ombre). Chaque combattant est dessiné tourné vers la droite ;
// celui de droite est affiché en miroir, donc les animations (coup, esquive,
// chute), pilotées par des classes CSS, sont écrites une seule fois.

function Fighter({ player, state, mood, level }) {
    const { height } = AVATARS[player.avatar];
    return (
        <g className={`fighter av-${player.avatar} emote-${player.emote} hp-${level} ${state}`}>
            {/* Aura du coup final : flammes dorées et éclairs (invisibles le reste du temps) */}
            <g className="f-aura">
                <path className="aura-outer" d="M125 238 C34 238 22 150 58 92 C62 130 82 120 78 80 C96 106 112 56 102 8 C134 40 152 58 152 94 C168 82 172 56 166 38 C212 94 220 238 125 238 Z" />
                <path className="aura-inner" d="M125 236 C62 236 54 170 78 128 C82 152 96 146 94 118 C108 134 118 100 112 66 C134 88 146 100 146 126 C158 118 160 100 156 88 C188 128 192 236 125 236 Z" />
                <g className="aura-sparks">
                    <path d="M38 150 l16 -10 l-6 14 l18 -8" />
                    <path d="M196 96 l14 12 l-14 4 l16 12" />
                    <path d="M84 30 l-10 14 l14 2 l-10 16" />
                    <path d="M214 176 l-14 -6 l8 14 l-16 -4" />
                </g>
            </g>
            <g className="f-body">
                <g transform={`translate(70 ${190 - height})`}>
                    {/* Animation de repos propre à chaque avatar */}
                    <g className="av-idle">
                        <AvatarBody player={player} mood={mood} />
                    </g>
                </g>
                {/* Gant de garde */}
                <g className="f-guard"><Glove x={52} y={112} color={player.gloves} /></g>
            </g>
            {/* Bras qui frappe */}
            <g className="f-arm">
                <rect className="arm-bar" x="176" y="124" width="22" height="9" />
                <g className="arm-glove"><Glove x={198} y={114} color={player.gloves} /></g>
            </g>
            <text className="f-impact" x="150" y="100" textAnchor="middle">💥</text>
        </g>
    );
}

// Le public : deux rangées de têtes dans l'ombre, derrière les cordes.
const CROWD = Array.from({ length: 2 }, (_, row) => (
    Array.from({ length: 30 }, (_, i) => ({
        x: i * 25 + (row ? 12 : 0),
        y: 150 + row * 22 + ((i * 7 + row * 3) % 5) * 2,
        r: 11 + ((i * 5 + row) % 3),
    }))
)).flat();

function Ring() {
    return (
        <g className="ring">
            <g className="ring-crowd">
                {CROWD.map((head, i) => <circle key={i} cx={head.x} cy={head.y} r={head.r} />)}
            </g>
            {/* Tapis et jupe du ring */}
            <path className="ring-canvas" d="M34 198 H686 L720 232 H0 Z" />
            <rect className="ring-apron" x="0" y="232" width="720" height="8" />
            {/* Poteaux et protections de coin */}
            <rect className="ring-post" x="20" y="96" width="14" height="108" rx="4" />
            <rect className="ring-post" x="686" y="96" width="14" height="108" rx="4" />
            {/* Trois cordes */}
            {[112, 142, 172].map((y, i) => (
                <line key={y} className={`ring-rope rope-${i}`} x1="27" y1={y} x2="693" y2={y} />
            ))}
            <rect className="ring-pad pad-red" x="13" y="104" width="28" height="78" rx="9" />
            <rect className="ring-pad pad-blue" x="679" y="104" width="28" height="78" rx="9" />
        </g>
    );
}

export default function Arena({ battle, players }) {
    // La clé relance les animations à chaque nouvel événement.
    const key = battle.event.id;
    return (
        <svg className="arena" viewBox="0 0 720 240" aria-hidden="true">
            <Ring />
            <Fighter key={`l${key}`} player={players[0]} state={fighterState(0, battle)} mood={fighterMood(0, battle)} level={hpLevel(battle.hp[0])} />
            <g transform="translate(720 0) scale(-1 1)">
                <Fighter key={`r${key}`} player={players[1]} state={fighterState(1, battle)} mood={fighterMood(1, battle)} level={hpLevel(battle.hp[1])} />
            </g>
        </svg>
    );
}
