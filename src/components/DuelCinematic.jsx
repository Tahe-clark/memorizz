import { AVATARS } from '../data/avatars';
import { AvatarFront, Glove } from './Avatar';
import DesertBackdrop from './DesertBackdrop';

// Cinématique d'entrée du duel (5,6 s, voir DUEL_INTRO dans useBattle) :
//  1. plan large : la caméra descend du ciel sur le désert, une boule de foin passe ;
//  2. très gros plans sur les yeux des deux cowboys (écran partagé) ;
//  3. gros plans sur les mains au-dessus des holsters ;
//  4. titre « Duel » ; puis tout s'efface sur la scène du duel.
// Tout est animé en CSS (classes cine-*) : aucun minuteur côté React.

function EyesCloseUp({ player }) {
    const { eyes, height } = AVATARS[player.avatar];
    const width = eyes.cx2 - eyes.cx1 + 150;
    return (
        <svg viewBox={`${eyes.cx1 - 75} ${eyes.cy - 44} ${width} ${width * 0.4}`} preserveAspectRatio="xMidYMid slice">
            <rect className="cine-eye-bg" x="-200" y="-200" width="510" height={height + 400} />
            <rect x="0" y="0" width="110" height={height} rx="16" fill={player.color} stroke="#22252e" strokeWidth="5" />
            <AvatarFront player={{ ...player, accessory: 'cowboy' }} mood="angry" />
            <rect className="cine-eye-shade" x="-40" y={eyes.cy - 70} width="200" height="40" />
        </svg>
    );
}

function HandCloseUp({ player }) {
    return (
        <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
            <rect width="200" height="140" className="cine-hand-bg" />
            {/* Pantalon, ceinture, holster et crosse du revolver */}
            <rect x="0" y="62" width="200" height="78" fill={player.color} />
            <rect x="0" y="62" width="200" height="16" className="cine-belt" />
            <rect x="34" y="60" width="22" height="20" rx="3" className="cine-buckle" />
            <path className="cine-grip" d="M118 74 q-6 -22 6 -34 l14 -2 q4 18 -4 36 Z" />
            <path className="cine-holster" d="M104 72 h46 l-6 64 h-30 Z" />
            <g className="cine-glove">
                <g transform="translate(100 12) scale(1.35)">
                    <Glove x={0} y={0} color={player.gloves} />
                </g>
            </g>
        </svg>
    );
}

export default function DuelCinematic({ players, title, subtitle }) {
    return (
        <div className="cine" aria-hidden="true">
            <div className="cine-shot cine-wide">
                <DesertBackdrop className="cine-desert" />
                <div className="cine-tumble" />
            </div>
            <div className="cine-shot cine-eyes">
                <div className="cine-band cine-band-0"><EyesCloseUp player={players[0]} /></div>
                <div className="cine-band cine-band-1"><EyesCloseUp player={players[1]} /></div>
            </div>
            <div className="cine-shot cine-hands">
                <div className="cine-half cine-half-0"><HandCloseUp player={players[0]} /></div>
                <div className="cine-half cine-half-1"><HandCloseUp player={players[1]} /></div>
            </div>
            <div className="cine-shot cine-title">
                <DesertBackdrop className="cine-desert cine-desert-title" />
                <div className="cine-title-text">
                    <b>{title}</b>
                    <span>{subtitle}</span>
                </div>
            </div>
            <div className="cine-grain" />
            <div className="cine-flash" />
            <div className="cine-bar cine-bar-top" />
            <div className="cine-bar cine-bar-bottom" />
        </div>
    );
}
