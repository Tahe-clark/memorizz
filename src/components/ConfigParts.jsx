import { THEMES } from '../data/themes';
import { useI18n } from '../i18n/context';
import { LEVELS, MAX_LENGTH, MIN_LENGTH } from '../utils/wordswap';

// Briques de l'écran des réglages, communes aux trois jeux : des sections sobres,
// une ligne par réglage (le nom à gauche, le contrôle à droite), des sélecteurs
// en « pilule » et des compteurs compacts. Peu de cadres, peu de couleurs.

/** Petit compteur « − valeur + ». */
export function Counter({ value, min, max, onChange, label, muted = false, suffix = null }) {
    const { t } = useI18n();
    return (
        <div className={`counter ${muted ? 'is-muted' : ''}`} role="group" aria-label={label}>
            <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('config.less')}>
                <i className="fa-solid fa-minus" aria-hidden="true"></i>
            </button>
            <span className="counter-value" aria-live="polite">
                {value}
                {suffix && <small>{suffix}</small>}
            </span>
            <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('config.more')}>
                <i className="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
        </div>
    );
}

/** Sélecteur en pilule : une seule option active. options = [{ id, label, sub?, icon? }] */
export function Segmented({ label, value, options, onChange, wrap = false }) {
    return (
        <div className={`seg ${wrap ? 'is-wrap' : ''}`} role="radiogroup" aria-label={label}>
            {options.map((o) => (
                <button key={String(o.id)} type="button" role="radio" aria-checked={value === o.id} className={`seg-opt ${value === o.id ? 'is-active' : ''}`} onClick={() => onChange(o.id)}>
                    {o.icon && <span className="seg-icon" aria-hidden="true">{o.icon}</span>}
                    <span>{o.label}</span>
                    {o.sub && <small>{o.sub}</small>}
                </button>
            ))}
        </div>
    );
}

/** Interrupteur oui / non. */
export function Toggle({ label, checked, onChange }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
            <span />
        </button>
    );
}

/** Une ligne de réglage : nom (et aide) à gauche, contrôle à droite. */
export function Row({ label, hint, children, stack = false }) {
    return (
        <div className={`cfg-row ${stack ? 'is-stack' : ''}`}>
            <div className="cfg-label">
                <span>{label}</span>
                {hint && <small>{hint}</small>}
            </div>
            <div className="cfg-control">{children}</div>
        </div>
    );
}

/** Un groupe de réglages avec son titre. */
export function Section({ title, children }) {
    return (
        <section className="cfg-section">
            {title && <h2 className="cfg-section-title">{title}</h2>}
            <div className="cfg-card">{children}</div>
        </section>
    );
}

/**
 * Les réglages de la séquence à mémoriser (WordSwap Calc), partagés par les trois jeux :
 * temps, longueur, nombre d'émojis (ou au hasard) et thème.
 */
export function SequenceSettings({ level, setLevel, sequenceLength, setSequenceLength, emojis, setEmojis, lastEmojis, setLastEmojis, theme, setTheme }) {
    const { t } = useI18n();
    const isRandom = emojis === 'random';
    const emojiCount = Math.min(isRandom ? lastEmojis : emojis, sequenceLength);
    const pick = (n) => {
        setEmojis(n);
        setLastEmojis(n);
    };
    let emojiHint = t('config.emojisHint', { n: emojiCount, total: sequenceLength });
    if (isRandom) emojiHint = t('config.emojisRandom', { n: sequenceLength });
    else if (emojiCount === sequenceLength) emojiHint = t('config.emojisAll');
    return (
        <Section title={t('config.section.sequence')}>
            <Row label={t('config.step1')}>
                <Segmented
                    label={t('config.step1')}
                    value={level}
                    onChange={setLevel}
                    options={Object.entries(LEVELS).map(([id, { seconds }]) => ({ id, label: t(`level.${id}`), sub: `${seconds} s` }))}
                />
            </Row>
            <Row label={t('config.step2')} hint={t('config.step2Hint')}>
                <Counter value={sequenceLength} min={MIN_LENGTH} max={MAX_LENGTH} onChange={setSequenceLength} label={t('config.step2')} />
            </Row>
            <Row label={t('config.emojis')} hint={emojiHint}>
                <div className="cfg-inline">
                    <Counter value={emojiCount} min={1} max={sequenceLength} onChange={pick} label={t('config.emojis')} muted={isRandom} suffix={`/${sequenceLength}`} />
                    <button type="button" className={`seg-chip ${isRandom ? 'is-active' : ''}`} aria-pressed={isRandom} onClick={() => setEmojis(isRandom ? lastEmojis : 'random')}>
                        🎲 {t('config.random')}
                    </button>
                </div>
            </Row>
            <Row label={t('config.step3')}>
                <Segmented
                    label={t('config.step3')}
                    value={theme}
                    onChange={setTheme}
                    options={Object.entries(THEMES).map(([id, data]) => ({ id, icon: data.items[0], label: t(`theme.${id}`) }))}
                />
            </Row>
        </Section>
    );
}
