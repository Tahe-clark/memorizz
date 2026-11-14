import { useEffect, useState } from 'react';
import { playSound } from '../utils/audio';

// Début de la mémorisation (WordSwap Calc et Battle) : les cartes sont
// distribuées une à une, avec un petit bruit de carte. Ensuite plus rien ne
// bouge, pour pouvoir mémoriser tranquillement.
// Renvoie le nombre de cartes déjà distribuées.
const DEAL_MS = 110;

export function useMemoShow(active, roundKey, count) {
    const [state, setState] = useState({ key: null, dealt: 0 });
    const dealt = state.key === roundKey ? state.dealt : 0;

    useEffect(() => {
        if (!active) return undefined;
        const timers = [];
        for (let k = 1; k <= count; k++) {
            timers.push(setTimeout(() => {
                playSound('deal');
                setState({ key: roundKey, dealt: k });
            }, 200 + k * DEAL_MS));
        }
        return () => timers.forEach(clearTimeout);
    }, [active, roundKey, count]);

    return { dealt: active ? dealt : count };
}
