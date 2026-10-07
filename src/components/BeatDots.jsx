import { useEffect, useState } from 'react';
import { beatNow } from '../utils/music';

// Les quatre temps de la mesure : le point du temps en cours s'allume.
// Suit l'horloge du tempo, même quand la musique est coupée.
export default function BeatDots() {
    const [beat, setBeat] = useState(() => beatNow().beat);

    useEffect(() => {
        let id;
        const tick = () => {
            const now = beatNow();
            setBeat(now.beat);
            id = setTimeout(tick, now.msToNext + 8);
        };
        id = setTimeout(tick, beatNow().msToNext + 8);
        return () => clearTimeout(id);
    }, []);

    return (
        <span className="beat-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
                <span key={`${i}-${i === beat ? 'on' : 'off'}`} className={i === beat ? 'on' : ''} />
            ))}
        </span>
    );
}
