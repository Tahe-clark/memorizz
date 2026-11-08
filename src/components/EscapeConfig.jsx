import { useState } from 'react';
import { THEMES } from '../data/themes';
import { useI18n } from '../i18n/context';
import { MONSTER_MS, SIZES } from '../utils/escape';
import { LEVELS, MAX_LENGTH, MAX_ROUNDS, MIN_LENGTH } from '../utils/wordswap';
import { Counter } from './GameConfig';

// Réglages d'Escape : ceux de WordSwap Calc pour la séquence à mémoriser (temps,
// longueur, émojis, thème), puis la maison (taille, vitesse du monstre, manches, vue).
function Choices({ label, value, options, onChange, render, four = false }) {
    return (
        <div className={`choice-row ${four ? 'choice-row-4' : ''}`} role="radiogroup" aria-label={label}>
            {options.map((id) => (
                <button key={id} type="button" role="radio" aria-checked={value === id} className={`choice ${value === id ? 'is-active' : ''}`} onClick={() => onChange(id)}>
                    {render(id)}
                </button>
            ))}
        </div>
    );
}

export default function EscapeConfig({ game, initialConfig, onStart, onBack }) {
    const { t } = useI18n();
    const [level, setLevel] = useState(LEVELS[initialConfig.level] ? initialConfig.level : 'easy');
    const [sequenceLength, setSequenceLength] = useState(initialConfig.sequenceLength ?? 7);
    const [emojis, setEmojis] = useState(initialConfig.emojis ?? 2);
    const [lastEmojis, setLastEmojis] = useState(initialConfig.emojis === 'random' ? 2 : initialConfig.emojis ?? 2);
    const [theme, setTheme] = useState(initialConfig.theme ?? 'animals');
    const [size, setSize] = useState(initialConfig.size ?? 'small');
    const [monster, setMonster] = useState(initialConfig.monster ?? 'normal');
    const [rounds, setRounds] = useState(initialConfig.rounds ?? 3);
    const [view, setView] = useState(initialConfig.view ?? '2d');
    const isRandom = emojis === 'random';
    const emojiCount = Math.min(isRandom ? lastEmojis : emojis, sequenceLength);

    const start = () => onStart({ level, sequenceLength, emojis: isRandom ? 'random' : emojiCount, theme, size, monster, rounds, view });

    return (
        <div className="panel panel-wide">
            <div className="panel-head">
                <button type="button" className="icon-button" onClick={onBack} aria-label={t('config.back')} title={t('config.back')}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                </button>
                <div>
                    <p className="panel-kicker">{game.name}</p>
                    <h1 className="h-title">{t('config.title')}</h1>
                </div>
            </div>
            <p className="text-soft escape-rules">{t('escape.rules')}</p>

            <ol className="steps">
                <li className="step">
                    <h2 className="step-title">{t('config.step1')}</h2>
                    <Choices
                        label={t('config.step1')}
                        value={level}
                        options={Object.keys(LEVELS)}
                        onChange={setLevel}
                        render={(id) => (<><span className="choice-big">{LEVELS[id].seconds} s</span><span className="choice-small">{t(`level.${id}`)}</span></>)}
                    />
                </li>
                <li className="step">
                    <div className="length-row">
                        <div>
                            <h2 className="step-title">{t('config.step2')}</h2>
                            <Counter value={sequenceLength} min={MIN_LENGTH} max={MAX_LENGTH} onChange={setSequenceLength} label={t('config.step2')} />
                        </div>
                        <div className="emoji-pick">
                            <h3 className="sub-title">{t('config.emojis')}</h3>
                            <div className="emoji-pick-row">
                                <Counter
                                    value={emojiCount}
                                    min={1}
                                    max={sequenceLength}
                                    onChange={(n) => { setEmojis(n); setLastEmojis(n); }}
                                    label={t('config.emojis')}
                                    muted={isRandom}
                                    suffix={`/${sequenceLength}`}
                                />
                                <button type="button" className={`chip ${isRandom ? 'is-active' : ''}`} aria-pressed={isRandom} onClick={() => setEmojis(isRandom ? lastEmojis : 'random')}>
                                    🎲 {t('config.random')}
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="step">
                    <h2 className="step-title">{t('config.step3')}</h2>
                    <Choices
                        label={t('config.step3')}
                        value={theme}
                        options={Object.keys(THEMES)}
                        onChange={setTheme}
                        render={(id) => (<><span className="choice-emojis" aria-hidden="true">{THEMES[id].items.slice(0, 3).join('')}</span><span className="choice-small">{t(`theme.${id}`)}</span></>)}
                    />
                </li>
                <li className="step">
                    <h2 className="step-title">{t('escape.cfg.size')}</h2>
                    <Choices
                        four
                        label={t('escape.cfg.size')}
                        value={size}
                        options={Object.keys(SIZES)}
                        onChange={setSize}
                        render={(id) => (<><span className="choice-big">{SIZES[id].join(' × ')}</span><span className="choice-small">{t(`escape.size.${id}`)}</span></>)}
                    />
                    <p className="step-hint">{t('escape.cfg.sizeHint')}</p>
                </li>
                <li className="step">
                    <h2 className="step-title">{t('escape.cfg.monster')}</h2>
                    <Choices
                        label={t('escape.cfg.monster')}
                        value={monster}
                        options={Object.keys(MONSTER_MS)}
                        onChange={setMonster}
                        render={(id) => (<><span className="choice-emojis" aria-hidden="true">{{ slow: '🐌', normal: '👹', fast: '⚡👹' }[id]}</span><span className="choice-small">{t(`escape.speed.${id}`)}</span></>)}
                    />
                </li>
                <li className="step">
                    <div className="length-row">
                        <div>
                            <h2 className="step-title">{t('config.rounds')}</h2>
                            <Counter value={rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} label={t('config.rounds')} />
                        </div>
                        <div className="emoji-pick">
                            <h3 className="sub-title">{t('config.view')}</h3>
                            <div className="chips chips-lg" role="radiogroup" aria-label={t('config.view')}>
                                {['2d', '3d'].map((id) => (
                                    <button key={id} type="button" role="radio" aria-checked={view === id} className={`chip ${view === id ? 'is-active' : ''}`} onClick={() => setView(id)}>
                                        {id.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </li>
            </ol>

            <button type="button" className="btn-mz btn-mz-sun btn-mz-large w-100" onClick={start}>
                {t('escape.cfg.start')}
            </button>
        </div>
    );
}
