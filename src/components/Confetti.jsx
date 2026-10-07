// Pluie de confettis en CSS. Les positions sont calculées à partir de l'index
// (pseudo-hasard stable) : le rendu reste identique d'un affichage à l'autre.
const COLORS = ['#ffd23f', '#ff5d8f', '#5b8cff', '#3ecf8e', '#b48cff', '#ff9f5a'];
const spread = (i, salt) => {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
};

export default function Confetti({ count = 70, loop = false }) {
    return (
        <div className={`confetti ${loop ? 'is-loop' : ''}`} aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <span
                    key={i}
                    style={{
                        left: `${spread(i, 1) * 100}%`,
                        background: COLORS[i % COLORS.length],
                        width: `${6 + spread(i, 2) * 6}px`,
                        height: `${8 + spread(i, 3) * 10}px`,
                        borderRadius: spread(i, 4) > 0.7 ? '50%' : '2px',
                        animationDelay: `${spread(i, 5) * (loop ? 2.6 : 0.5)}s`,
                        animationDuration: `${1.8 + spread(i, 6) * 1.6}s`,
                        '--drift': `${(spread(i, 7) - 0.5) * 160}px`,
                        '--spin': `${(spread(i, 8) - 0.5) * 1400}deg`,
                    }}
                />
            ))}
        </div>
    );
}
