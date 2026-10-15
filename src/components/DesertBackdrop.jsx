// Décor du duel au Far West : coucher de soleil sur Monument Valley.
// Ciel en dégradé, soleil rayé, nuages effilés, buttes éclairées par le bas,
// piste qui file vers l'horizon, poteaux télégraphiques, éolienne, cactus,
// crâne de vache et poussière. Partagé par la vue 2D, la vue 3D et la cinématique.

const STARS = [[60, 18], [140, 40], [230, 12], [480, 22], [600, 44], [680, 14], [330, 34], [520, 8]];
// Poteaux télégraphiques qui rapetissent vers l'horizon (x au sol, hauteur)
const POLES = [[150, 300, 118], [222, 262, 74], [262, 241, 48], [287, 228, 32], [303, 220, 22], [313, 215, 15]];

function Saguaro({ x, y, scale = 1, flip = false }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} className="dd-saguaro">
            <path d="M-11 0 V-86 a11 11 0 0 1 22 0 V0 Z" />
            <path d="M-11 -34 h-15 a10 10 0 0 1 -10 -10 v-20 a8 8 0 0 1 16 0 v14 h9 Z" />
            <path d="M11 -48 h14 a10 10 0 0 0 10 -10 v-22 a8 8 0 0 0 -16 0 v16 h-8 Z" />
            <path className="dd-rib" d="M-3 -8 V-88 M4 -8 V-88" />
        </g>
    );
}

export function DesertLayers() {
    return (
        <g className="dd">
            <defs>
                <linearGradient id="dd-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2b2463" />
                    <stop offset="0.28" stopColor="#7a3a7d" />
                    <stop offset="0.5" stopColor="#d5566a" />
                    <stop offset="0.66" stopColor="#f88d52" />
                    <stop offset="0.74" stopColor="#ffc86e" />
                </linearGradient>
                <linearGradient id="dd-sun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff7c9" />
                    <stop offset="1" stopColor="#ffb04d" />
                </linearGradient>
                <radialGradient id="dd-glow">
                    <stop offset="0.2" stopColor="#fff2b8" stopOpacity="0.9" />
                    <stop offset="0.55" stopColor="#ffb26a" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#ff8a5a" stopOpacity="0" />
                </radialGradient>
                <mask id="dd-sun-cut">
                    <rect x="280" y="100" width="160" height="120" fill="#fff" />
                    {[176, 186, 195, 203].map((y, i) => <rect key={y} x="280" y={y} width="160" height={2 + i * 1.4} fill="#000" />)}
                </mask>
                <linearGradient id="dd-ground" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f6b46c" />
                    <stop offset="0.45" stopColor="#e4914f" />
                    <stop offset="1" stopColor="#b9603a" />
                </linearGradient>
                <linearGradient id="dd-road" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#f2bd80" />
                </linearGradient>
                <linearGradient id="dd-haze" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffd7a0" stopOpacity="0" />
                    <stop offset="0.6" stopColor="#ffd7a0" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#ffd7a0" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="dd-vignette" cx="0.5" cy="0.5" r="0.75">
                    <stop offset="0.6" stopColor="#2a0a12" stopOpacity="0" />
                    <stop offset="1" stopColor="#2a0a12" stopOpacity="0.5" />
                </radialGradient>
            </defs>

            <rect width="720" height="300" fill="url(#dd-sky)" />
            <g className="dd-stars">
                {STARS.map(([x, y], i) => <circle key={x} cx={x} cy={y} r={i % 3 ? 1.2 : 1.8} style={{ animationDelay: `${i * -0.7}s` }} />)}
            </g>

            {/* Rayons de lumière qui tournent lentement, halo, soleil rayé */}
            <g className="dd-rays">
                {Array.from({ length: 12 }, (_, i) => (
                    <path key={i} d="M360 178 L350 -40 L370 -40 Z" transform={`rotate(${i * 30 - 165} 360 178)`} />
                ))}
            </g>
            <circle cx="360" cy="178" r="190" fill="url(#dd-glow)" />
            <circle cx="360" cy="168" r="62" fill="url(#dd-sun)" mask="url(#dd-sun-cut)" className="dd-sun" />

            {/* Nuages effilés éclairés par en dessous */}
            <g className="dd-clouds dd-clouds-far">
                <path d="M30 70 q60 -14 150 -4 q-40 10 -150 4 Z" />
                <path d="M470 52 q90 -16 210 -2 q-80 12 -210 2 Z" />
                <path d="M250 32 q50 -10 120 -2 q-40 8 -120 2 Z" />
            </g>
            <g className="dd-clouds dd-clouds-near">
                <path d="M80 104 q90 -18 220 -4 q-70 14 -220 4 Z" />
                <path d="M440 96 q80 -14 190 -2 q-70 12 -190 2 Z" />
            </g>
            <g className="dd-birds">
                <path d="M0 0 q7 -8 14 0 q7 -8 14 0" />
                <path d="M34 12 q5 -6 10 0 q5 -6 10 0" />
                <path d="M-20 16 q5 -6 10 0 q5 -6 10 0" />
            </g>

            {/* Chaîne lointaine, puis les buttes de Monument Valley */}
            <path className="dd-far" d="M0 208 L0 172 L40 160 L92 176 L150 150 L214 172 L262 164 L300 184 L420 184 L462 160 L530 170 L590 148 L660 168 L720 158 L720 208 Z" />
            <g className="dd-buttes">
                <path d="M30 208 L44 150 L52 150 L54 120 L118 120 L120 150 L132 150 L146 208 Z" />
                <path d="M168 208 L176 176 L182 176 L184 156 L196 156 L198 176 L204 176 L212 208 Z" />
                <path d="M520 208 L532 140 L540 140 L540 112 L560 112 L562 140 L572 140 L586 208 Z" />
                <path d="M600 208 L612 132 L620 132 L622 104 L646 104 L648 132 L660 132 L674 208 Z" />
            </g>
            <path className="dd-rim" d="M54 120 H118 M184 156 H196 M540 112 H560 M622 104 H646" />
            <rect y="168" width="720" height="50" fill="url(#dd-haze)" />

            {/* Éolienne au loin */}
            <g className="dd-windmill" transform="translate(470 206)">
                <path d="M-7 0 L-1 -42 L1 -42 L7 0 M-5 -14 H5 M-3 -28 H3" />
                <g className="dd-blades" transform="translate(0 -44)">
                    {Array.from({ length: 8 }, (_, i) => <line key={i} x1="0" y1="0" x2="0" y2="-11" transform={`rotate(${i * 45})`} />)}
                </g>
                <path d="M2 -44 l12 2 l-12 3 Z" />
            </g>

            {/* Le sol, la piste qui file vers l'horizon */}
            <path d="M0 206 L720 206 L720 300 L0 300 Z" fill="url(#dd-ground)" />
            <path className="dd-horizon" d="M0 206 H720" />
            <path d="M344 206 L376 206 L560 300 L160 300 Z" fill="url(#dd-road)" />
            <path className="dd-track" d="M344 206 L160 300 M376 206 L560 300" />
            <path className="dd-ruts" d="M352 210 L268 300 M368 210 L452 300" />

            {/* Poteaux télégraphiques et leurs fils */}
            <g className="dd-poles">
                {POLES.map(([x, y, h]) => (
                    <g key={x}>
                        <line x1={x} y1={y} x2={x} y2={y - h} />
                        <line x1={x - h * 0.16} y1={y - h * 0.9} x2={x + h * 0.16} y2={y - h * 0.9} />
                    </g>
                ))}
                <path className="dd-wire" d={POLES.slice(0, -1).map(([x, y, h], i) => {
                    const [nx, ny, nh] = POLES[i + 1];
                    return `${i ? '' : `M${x - h * 0.13} ${y - h * 0.9}`} Q${(x + nx) / 2} ${(y - h * 0.9 + ny - nh * 0.9) / 2 + h * 0.08} ${nx - nh * 0.13} ${ny - nh * 0.9}`;
                }).join(' ')} />
            </g>

            {/* Ombres longues, cailloux, touffes, crâne de vache */}
            <g className="dd-rocks">
                <ellipse cx="96" cy="282" rx="17" ry="6" />
                <ellipse cx="620" cy="276" rx="12" ry="4.5" />
                <ellipse cx="420" cy="238" rx="7" ry="2.6" />
                <ellipse cx="250" cy="232" rx="6" ry="2.2" />
            </g>
            <g className="dd-tufts">
                {[[150, 270], [228, 248], [500, 252], [668, 266], [44, 240], [580, 232]].map(([x, y]) => (
                    <path key={x} d={`M${x} ${y} l-6 -10 M${x} ${y} l0 -12 M${x} ${y} l6 -10`} />
                ))}
            </g>
            <g className="dd-skull" transform="translate(560 266)">
                <path d="M-16 -6 q-10 -2 -14 -12 q8 6 16 4 Z M16 -6 q10 -2 14 -12 q-8 6 -16 4 Z" />
                <path d="M-10 -8 q10 -6 20 0 q2 10 -4 18 h-12 q-6 -8 -4 -18 Z" />
                <circle cx="-4" cy="-2" r="2.2" className="dd-skull-eye" />
                <circle cx="4" cy="-2" r="2.2" className="dd-skull-eye" />
            </g>

            {/* Cactus : au loin, puis au premier plan sur les bords */}
            <Saguaro x={232} y={214} scale={0.32} />
            <Saguaro x={448} y={218} scale={0.42} flip />
            <Saguaro x={22} y={292} scale={1.05} />
            <Saguaro x={700} y={296} scale={0.95} flip />

            {/* Boule de foin qui traverse le désert */}
            <g className="ds-tumble">
                <g className="ds-tumble-roll">
                    <circle r="16" />
                    <path d="M-12 -6 C-4 -14 8 -12 12 -2 C8 10 -6 12 -12 4 M-6 -12 C2 -2 2 6 -4 12 M-14 2 C-4 0 6 2 14 6" />
                </g>
            </g>
        </g>
    );
}

/** Poussière portée par le vent et assombrissement des bords (au-dessus des personnages). */
export function DesertOverlay() {
    return (
        <g className="dd-overlay">
            <g className="ds-dust">
                {[[80, 236], [240, 254], [420, 244], [560, 262], [660, 240], [320, 270]].map(([x, y], i) => (
                    <circle key={x} cx={x} cy={y} r={2 + (i % 2)} style={{ animationDelay: `${i * -1.1}s` }} />
                ))}
            </g>
            <rect width="720" height="300" fill="url(#dd-vignette)" />
        </g>
    );
}

/** Le décor seul, dans son propre SVG (vue 3D, cinématique). */
export default function DesertBackdrop({ className = '' }) {
    return (
        <svg className={`desert-backdrop ${className}`} viewBox="0 0 720 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <DesertLayers />
            <DesertOverlay />
        </svg>
    );
}
