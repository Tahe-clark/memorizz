import { LEVEL_ICONS } from '../data/icons';
import { THEMES } from '../data/themes';
import { useI18n } from '../i18n/context';
import { LEVELS, MAX_LENGTH, MIN_LENGTH } from '../utils/wordswap';

// Briques de l'écran « Préparer la partie », communes aux trois jeux.
// Style sombre et chic : des tuiles à choisir (avec icône ou petite illustration),
// des compteurs nets, un aperçu en direct de la séquence, et à droite une fiche
// du jeu avec le résumé des réglages et le bouton pour lancer la partie.

const ART = `${import.meta.env.BASE_URL}art/`;

/** Compteur « − valeur + ». */
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

/**
 * Tuiles à choisir (une seule active).
 * options = [{ id, label, sub?, icon? (classe Font Awesome), art? (élément) }]
 */
export function Segmented({ label, value, options, onChange, compact = false }) {
    return (
        <div className={`seg ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label={label} data-n={options.length} style={{ '--n': options.length }}>
            {options.map((o) => (
                <button key={String(o.id)} type="button" role="radio" aria-checked={value === o.id} className={`seg-opt ${value === o.id ? 'is-active' : ''}`} onClick={() => onChange(o.id)}>
                    {o.art && <span className="seg-art" aria-hidden="true">{o.art}</span>}
                    {o.icon && !o.art && <span className="seg-icon" aria-hidden="true">{typeof o.icon === 'string' ? <i className={`fa-solid ${o.icon}`}></i> : o.icon}</span>}
                    <span className="seg-label">{o.label}</span>
                    {o.sub && <small>{o.sub}</small>}
                    <span className="seg-check" aria-hidden="true"><i className="fa-solid fa-check"></i></span>
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

/** Un réglage : nom (et aide), puis le contrôle (à droite, ou dessous avec « stack »). */
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
export function Section({ title, icon, children }) {
    return (
        <section className="cfg-section">
            {title && <h2 className="cfg-section-title">{icon && <i className={`fa-solid ${icon}`} aria-hidden="true"></i>}{title}</h2>}
            <div className="cfg-card">{children}</div>
        </section>
    );
}

/** Trois mini-cartes du thème (les emojis restent sur des cartes). */
function ThemeArt({ id }) {
    return (
        <span className="mini-cards">
            {THEMES[id].items.slice(0, 3).map((item) => <span key={item} className="mini-card">{item}</span>)}
        </span>
    );
}

/** Aperçu en direct : la séquence telle qu'elle apparaîtra (longueur et nombre d'émojis). */
function SequencePreview({ length, emojis, random, theme }) {
    const items = THEMES[theme]?.items ?? THEMES.animals.items;
    // Les émojis sont répartis régulièrement dans la séquence
    const emojiAt = new Set(Array.from({ length: emojis }, (_, k) => Math.floor(((k + 0.5) * length) / emojis)));
    return (
        <div className="seq-preview" aria-hidden="true">
            {Array.from({ length }, (_, i) => (
                <span key={i} className={`seq-card ${emojiAt.has(i) && !random ? 'is-emoji' : ''} ${random ? 'is-random' : ''}`} style={{ '--i': i }}>
                    {random ? '?' : emojiAt.has(i) ? items[i % items.length] : (i * 3 + 2) % 10}
                </span>
            ))}
        </div>
    );
}

/**
 * Les réglages de la séquence à mémoriser (WordSwap Calc), partagés par les trois jeux :
 * temps, longueur, nombre d'émojis (ou au hasard) et thème, avec l'aperçu en direct.
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
        <Section title={t('config.section.sequence')} icon="fa-brain">
            <SequencePreview length={sequenceLength} emojis={emojiCount} random={isRandom} theme={theme} />
            <Row label={t('config.step1')} stack>
                <Segmented
                    label={t('config.step1')}
                    value={level}
                    onChange={setLevel}
                    options={Object.entries(LEVELS).map(([id, { seconds }]) => ({ id, icon: LEVEL_ICONS[id], label: t(`level.${id}`), sub: `${seconds} s` }))}
                />
            </Row>
            <div className="cfg-pair">
                <Row label={t('config.step2')} hint={t('config.step2Hint')} stack>
                    <Counter value={sequenceLength} min={MIN_LENGTH} max={MAX_LENGTH} onChange={setSequenceLength} label={t('config.step2')} />
                </Row>
                <Row label={t('config.emojis')} hint={emojiHint} stack>
                    <div className="cfg-inline">
                        <Counter value={emojiCount} min={1} max={sequenceLength} onChange={pick} label={t('config.emojis')} muted={isRandom} suffix={`/${sequenceLength}`} />
                        <button type="button" className={`seg-chip ${isRandom ? 'is-active' : ''}`} aria-pressed={isRandom} onClick={() => setEmojis(isRandom ? lastEmojis : 'random')}>
                            <i className="fa-solid fa-dice" aria-hidden="true"></i> {t('config.random')}
                        </button>
                    </div>
                </Row>
            </div>
            <Row label={t('config.step3')} stack>
                <Segmented
                    label={t('config.step3')}
                    value={theme}
                    onChange={setTheme}
                    options={Object.keys(THEMES).map((id) => ({ id, art: <ThemeArt id={id} />, label: t(`theme.${id}`) }))}
                />
            </Row>
        </Section>
    );
}

/** Illustration de WordSwap Calc (quelques cartes, dont une retournée). */
function WordSwapArt() {
    return (
        <div className="ws-art" aria-hidden="true">
            <div className="ws-row">
                {['3', '🦊', '?', '7'].map((item, i) => <span key={i} className={`ws-tile ${item === '?' ? 'is-hidden' : ''}`}>{item}</span>)}
            </div>
        </div>
    );
}

/**
 * Mise en page de l'écran des réglages : réglages à gauche, fiche du jeu à droite
 * (image, résumé des choix, bouton « Lancer »). Sur téléphone, la fiche passe dessous.
 */
export function ConfigShell({ game, summary, startLabel, onStart, onBack, tabs = null, footer = null, intro = null, children }) {
    const { t } = useI18n();
    const art = { escape: 'escape-card.jpg', battle: 'battle-card.jpg' }[game.id];
    return (
        <div className="cfgx">
            <div className="cfgx-main">
                <div className="cfgx-head">
                    <button type="button" className="icon-button" onClick={onBack} aria-label={t('config.back')} title={t('config.back')}>
                        <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    </button>
                    <div>
                        <p className="cfgx-kicker">{game.name}</p>
                        <h1 className="cfgx-title">{t('config.title')}</h1>
                    </div>
                </div>
                {intro}
                {tabs}
                <div className="cfg">{children}</div>
                {footer}
            </div>

            <aside className="cfgx-aside">
                <div className="cfgx-card">
                    <div className="cfgx-art">{art ? <img src={ART + art} alt="" /> : <WordSwapArt />}</div>
                    <div className="cfgx-card-body">
                        <h2>{game.name}</h2>
                        <dl className="cfgx-summary">
                            {summary.map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <button type="button" className="btn-go config-start" onClick={onStart}>
                            <i className="fa-solid fa-play" aria-hidden="true"></i> {startLabel}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
