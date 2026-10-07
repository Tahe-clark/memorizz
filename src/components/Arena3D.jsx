import { AVATARS } from '../data/avatars';
import { cowboyLook, fighterMood, fighterState, hpLevel } from '../utils/battle';
import { AvatarFront } from './Avatar';

// L'arène en 3D : les deux personnages sont de vrais blocs (6 faces en CSS 3D),
// posés sur un ring vu en perspective, avec une caméra qui tourne doucement.
// Le combattant de droite est un miroir de celui de gauche, donc les animations
// (coup, esquive, chute) sont écrites une seule fois.

function Fighter3D({ player, state, mood, level, gun = false }) {
    const { height } = AVATARS[player.avatar];
    return (
        <div className={`f3 av-${player.avatar} emote-${player.emote} hp-${level} ${state}`} style={{ '--face': player.color, '--glove': player.gloves, '--h': `${height / 10}em` }}>
            <div className="f3-shadow" />
            {/* Aura du coup final */}
            <div className="f3-aura" />
            <div className="f3-body">
                {/* Animation de repos propre à chaque avatar */}
                <div className="f3-idle">
                <div className="f3-leg f3-leg-a" />
                <div className="f3-leg f3-leg-b" />
                <div className="f3-cube">
                    <div className="f3-face f3-back" />
                    <div className="f3-face f3-side f3-side-far" />
                    <div className="f3-face f3-side f3-side-near" />
                    <div className="f3-face f3-top" />
                    <div className="f3-face f3-front">
                        <svg viewBox={`0 0 110 ${height}`} className="f3-art">
                            <AvatarFront player={player} mood={mood} />
                        </svg>
                    </div>
                </div>
                </div>
            </div>
            <div className="f3-arm">
                <div className="f3-bar" />
                <div className="f3-glove" />
                {/* Duel au Far West : revolver, éclair du tir et trajectoires de la balle */}
                {gun && (
                    <>
                        <div className="f3-revolver" />
                        <div className="f3-flash" />
                        <div className="f3-bullet f3-bullet-hit" />
                        <div className="f3-bullet f3-bullet-miss" />
                    </>
                )}
            </div>
            <div className="f3-impact">💥</div>
        </div>
    );
}

export default function Arena3D({ battle, players }) {
    // La clé relance les animations à chaque nouvel événement.
    const key = battle.event.id;
    return (
        <div className="arena3d" aria-hidden="true">
            <div className="a3-scene">
                <div className="a3-stage">
                    <div className="a3-floor" />
                    {/* Ring : poteaux aux quatre coins, cordes au fond et sur les côtés */}
                    {['bl', 'br', 'fl', 'fr'].map((corner) => <div key={corner} className={`a3-post a3-post-${corner}`} />)}
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`a3-ropes rope-${i}`}>
                            <div className="a3-rope a3-rope-back" />
                            <div className="a3-rope a3-rope-left" />
                            <div className="a3-rope a3-rope-right" />
                        </div>
                    ))}
                    {[0, 1].map((p) => (
                        <div key={p} className={`a3-slot ${p === 0 ? 'a3-slot-left' : 'a3-slot-right'}`}>
                            <Fighter3D key={key} player={players[p]} state={fighterState(p, battle)} mood={fighterMood(p, battle)} level={hpLevel(battle.hp[p])} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const CACTUS_PATH = 'M-10 0 V-70 a10 10 0 0 1 20 0 V0 Z M-10 -28 h-14 a9 9 0 0 1 -9 -9 v-14 a7 7 0 0 1 14 0 v9 h9 Z M10 -40 h13 a9 9 0 0 0 9 -9 v-18 a7 7 0 0 0 -14 0 v13 h-8 Z';

// Un cactus « debout » dans la scène : une silhouette plate placée à une certaine
// profondeur, ce qui donne l'effet de relief quand la caméra tourne.
function Cactus3D({ x, z, size }) {
    return (
        <svg className="d3-cactus" viewBox="-36 -84 72 86" style={{ left: `${x}em`, width: `${size}em`, top: `${23 - size * 1.19}em`, transform: `translateZ(${z}em)` }}>
            <path d={CACTUS_PATH} />
        </svg>
    );
}

/** Le duel au Far West en 3D : désert en perspective, cowboys en volume. */
export function DuelScene3D({ battle, players, title, subtitle }) {
    const key = battle.event.id;
    return (
        <div className={`arena3d duel3d phase-${battle.phase}`} aria-hidden="true">
            <div className="a3-scene">
                <div className="a3-stage">
                    <div className="d3-sun" />
                    <div className="d3-cloud d3-cloud-a" />
                    <div className="d3-cloud d3-cloud-b" />
                    <div className="d3-mesa d3-mesa-far" />
                    <div className="d3-mesa" />
                    <div className="a3-floor d3-sand" />
                    <Cactus3D x={25} z={-9} size={5} />
                    <Cactus3D x={43} z={-6} size={6.5} />
                    <Cactus3D x={1} z={2} size={9} />
                    <Cactus3D x={63} z={4} size={8.5} />
                    <div className="d3-tumble"><div className="d3-tumble-roll" /></div>
                    {[0, 1].map((p) => {
                        const look = cowboyLook(p, battle);
                        return (
                            <div key={p} className={`a3-slot ${p === 0 ? 'a3-slot-left' : 'a3-slot-right'}`}>
                                <Fighter3D
                                    key={key}
                                    gun
                                    player={{ ...players[p], accessory: 'cowboy' }}
                                    state={look.state}
                                    mood={look.mood}
                                    level={look.state === 'is-missing' ? 'low' : 'high'}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="d3-vignette" />
            {/* Cinématique : bandes noires et titre */}
            <div className="d3-bar d3-bar-top" />
            <div className="d3-bar d3-bar-bottom" />
            <div className="d3-title">
                <span className="d3-title-main">★ {title} ★</span>
                <span className="d3-title-sub">{subtitle}</span>
            </div>
        </div>
    );
}

// Une marche du podium : un bloc en 3D avec le rang écrit sur la face avant.
function Step3D({ rank, color, left, height }) {
    return (
        <div className="f3-cube p3-step" style={{ '--face': color, '--w': '15em', '--h': `${height}em`, '--d': '11em', left: `${left}em` }}>
            <div className="f3-face f3-back" />
            <div className="f3-face f3-side f3-side-far" />
            <div className="f3-face f3-side f3-side-near" />
            <div className="f3-face f3-top" />
            <div className="f3-face f3-front"><span className="p3-rank">{rank}</span></div>
        </div>
    );
}

/** Le podium de fin de match en 3D : le gagnant danse sur la marche 1. */
export function Podium3D({ players, winner }) {
    const loser = 1 - winner;
    const STEPS = { 1: { left: 37, height: 9 }, 2: { left: 20, height: 5.5 } };
    const place = (player, rank) => (
        <div
            className={`a3-slot ${rank === 1 ? 'a3-slot-right' : 'a3-slot-left'}`}
            style={{ left: `${STEPS[rank].left + 2}em`, top: `${3.4 - STEPS[rank].height}em` }}
        >
            <Fighter3D
                player={players[player]}
                state={rank === 1 ? 'is-winner is-dancing' : ''}
                mood={rank === 1 ? 'happy' : 'sad'}
                level="high"
            />
        </div>
    );
    return (
        <div className="arena3d podium3d" aria-hidden="true">
            <div className="a3-scene">
                <div className="a3-stage">
                    <div className="a3-floor" />
                    <Step3D rank={2} color={players[loser].color} {...STEPS[2]} />
                    <Step3D rank={1} color={players[winner].color} {...STEPS[1]} />
                    {place(loser, 2)}
                    {place(winner, 1)}
                </div>
            </div>
        </div>
    );
}
