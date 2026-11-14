import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';

// Écran de fin commun aux trois jeux, dans le même style que les réglages :
// bandeau avec l'image du jeu, gros score qui se remplit, détail des manches,
// et les boutons (rejouer, réglages, accueil).

const ART = `${import.meta.env.BASE_URL}art/`;

/** Score en anneau qui se remplit, avec le nombre qui défile. */
export function ScoreRing({ score }) {
    const [shown, setShown] = useState(0);
    useEffect(() => {
        let frame;
        const start = performance.now();
        const tick = (now) => {
            const k = Math.min(1, (now - start) / 1100);
            setShown(Math.round(score * (1 - (1 - k) ** 3)));
            if (k < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [score]);
    const r = 54;
    const c = 2 * Math.PI * r;
    return (
        <div className="score-ring" role="img" aria-label={`${score} %`}>
            <svg viewBox="0 0 128 128" aria-hidden="true">
                <circle cx="64" cy="64" r={r} className="score-ring-track" />
                <circle cx="64" cy="64" r={r} className="score-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} />
            </svg>
            <span className="score-ring-n">{shown}<small>%</small></span>
        </div>
    );
}

export default function ResultShell({ game, kicker, title, hero, badge = null, note = null, rows, rule = null, primary, onSettings, onHome, children }) {
    const { t } = useI18n();
    const art = { escape: 'escape-card.jpg', battle: 'battle-card.jpg' }[game.id];
    return (
        <div className="resx">
            <div className="resx-card">
                <div className="resx-banner">
                    {art ? <img src={ART + art} alt="" /> : <div className="resx-ws" aria-hidden="true">{['3', '🦊', '?', '7', '🐙'].map((x, i) => <span key={i} className={x === '?' ? 'is-hidden' : ''}>{x}</span>)}</div>}
                    <div className="resx-banner-text">
                        <span className="resx-kicker">{kicker}</span>
                        <h1 className="resx-title">{title}</h1>
                    </div>
                </div>

                <div className="resx-hero">
                    {hero}
                    {badge && <span className={`resx-badge ${badge.gold ? 'is-gold' : ''}`}>{badge.gold && <i className="fa-solid fa-trophy" aria-hidden="true"></i>} {badge.text}</span>}
                    {note && <p className="resx-note">{note}</p>}
                </div>

                {children}

                {rows?.length > 0 && (
                    <ul className="resx-rows">
                        {rows.map((row, i) => (
                            <li key={i} className={row.tone ? `is-${row.tone}` : ''} style={{ '--i': i }}>
                                <span className="resx-row-label">{row.icon && <i className={`fa-solid ${row.icon}`} aria-hidden="true"></i>}{row.label}</span>
                                <span className="resx-row-value">{row.value}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {rule && <p className="resx-rule">{rule}</p>}

                <div className="resx-actions">
                    <button type="button" className="btn-go" onClick={primary.onClick}>
                        <i className={`fa-solid ${primary.icon ?? 'fa-rotate-right'}`} aria-hidden="true"></i> {primary.label}
                    </button>
                    <button type="button" className="btn-c btn-c-glass" onClick={onSettings}>
                        <i className="fa-solid fa-sliders" aria-hidden="true"></i> {t('results.settings')}
                    </button>
                    <button type="button" className="btn-c btn-c-glass" onClick={onHome}>
                        <i className="fa-solid fa-house" aria-hidden="true"></i> {t('results.home')}
                    </button>
                </div>
            </div>
        </div>
    );
}
