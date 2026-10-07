// Éléments de dessin partagés par les arènes 2D et 3D.

export function Eyes({ ko, cx1, cx2, cy }) {
    if (ko) {
        return (
            <g className="f-line">
                {[cx1, cx2].map((cx) => (
                    <g key={cx}>
                        <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} />
                        <line x1={cx - 6} y1={cy + 6} x2={cx + 6} y2={cy - 6} />
                    </g>
                ))}
            </g>
        );
    }
    return (
        <g>
            <circle cx={cx1} cy={cy} r="5" />
            <circle cx={cx2} cy={cy} r="5" />
            {/* Sourcils froncés */}
            <g className="f-line">
                <line x1={cx1 - 9} y1={cy - 17} x2={cx1 + 8} y2={cy - 10} />
                <line x1={cx2 - 8} y1={cy - 10} x2={cx2 + 9} y2={cy - 17} />
            </g>
        </g>
    );
}
