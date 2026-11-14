// Tuile de séquence : face visible pendant la mémorisation, retournée ensuite.
export default function Tile({ item, position, hidden, highlight, label, hiddenLabel, scan = false }) {
    const isEmoji = Number.isNaN(Number(item));
    return (
        <div className={`tile-slot ${scan ? 'is-scan' : ''}`} style={{ '--i': position - 1 }}>
            <div
                className={`tile ${hidden ? 'is-hidden' : ''} ${highlight ? 'is-highlight' : ''}`}
                role="img"
                aria-label={hidden ? hiddenLabel : `${label} : ${item}`}
            >
                <div className={`tile-face tile-front ${isEmoji ? 'is-emoji' : ''}`} aria-hidden="true">
                    {item}
                </div>
                <div className="tile-face tile-back" aria-hidden="true">?</div>
            </div>
            <span className="tile-pos" aria-hidden="true">{position}</span>
        </div>
    );
}
