// Traduit l'état du combat en classes d'animation pour un joueur (0 = gauche, 1 = droite).
// Utilisé par les deux arènes (2D et 3D).
export function fighterState(player, { phase, event, roundWinner, finisherStage }) {
    // Coup final : charge → coup géant → fête. Le perdant tremble puis s'envole.
    if (finisherStage) {
        const winner = roundWinner === player;
        if (finisherStage === 'charge') return winner ? 'is-charging' : 'is-scared';
        if (finisherStage === 'blast') return winner ? 'is-charging is-megapunch' : 'is-blasted';
        return winner ? 'is-winner' : 'is-blasted';
    }
    const resolving = phase === 'resolve' || phase === 'ko';
    const classes = [];
    if (event.type === 'hit' && resolving) classes.push(event.player === player ? 'is-punching' : 'is-hit');
    // Mauvaise réponse : le fautif frappe dans le vide, l'autre esquive puis contre.
    if (event.type === 'counter' && resolving) classes.push(event.player === player ? 'is-countered' : 'is-countering');
    if (phase === 'ko') classes.push(roundWinner === player ? 'is-winner' : 'is-ko');
    return classes.join(' ');
}

// Niveau de vie : 'high' (en forme), 'mid' (entamé), 'low' (un coup du K.O.).
export function hpLevel(hp) {
    if (hp > 66) return 'high';
    return hp > 34 ? 'mid' : 'low';
}

// Expression du visage d'un joueur : selon l'issue de la manche, sinon selon sa vie.
export function fighterMood(player, { phase, roundWinner, hp, finisherStage }) {
    if (finisherStage && finisherStage !== 'done') {
        if (roundWinner === player) return 'angry';
        return finisherStage === 'charge' ? 'hurt' : 'ko';
    }
    if (phase === 'ko') return roundWinner === player ? 'happy' : 'ko';
    return { high: 'angry', mid: 'worried', low: 'hurt' }[hpLevel(hp[player])];
}

// Duel au Far West : attitude d'un cowboy (classe d'animation + expression).
export function cowboyLook(player, { phase, duel }) {
    if (phase === 'ko') {
        return duel.winner === player ? { state: 'is-shooter', mood: 'happy' } : { state: 'is-shot', mood: 'ko' };
    }
    if (phase === 'duelFree' && duel.missed === player) return { state: 'is-missing', mood: 'worried' };
    return { state: '', mood: 'angry' };
}
