import { useState } from 'react';
import { THEMES } from '../data/themes';
import { useI18n } from '../i18n/context';
import { CPU_LEVELS } from '../hooks/useBattle';
import { LEVELS, MAX_LENGTH, MIN_LENGTH } from '../utils/wordswap';
import PlayerEditor from './PlayerEditor';

export default function GameConfig({ game, initialConfig, onStart, onBack }) {
    const { t } = useI18n();
    const [level, setLevel] = useState(initialConfig.level);
    const [sequenceLength, setSequenceLength] = useState(initialConfig.sequenceLength);
    const [theme, setTheme] = useState(initialConfig.theme);
    const isBattle = game.players === 2;
    const [players, setPlayers] = useState(initialConfig.players);

    const setPlayer = (index, value) => setPlayers((list) => list.map((p, i) => (i === index ? value : p)));

    const [view, setView] = useState(initialConfig.view ?? '2d');
    const [duel, setDuel] = useState(initialConfig.duel ?? true);
    const [cpu, setCpu] = useState(initialConfig.cpu ?? null); // null = un ami, sinon niveau de l'ordinateur
    // Battle a beaucoup de réglages : ils sont répartis sur trois onglets pour éviter de défiler.
    const [tab, setTab] = useState(0);
    const TABS = 3;
    const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.png`;

    const start = () => {
        const settings = { level, sequenceLength, theme };
        onStart(isBattle ? { ...settings, view, duel, cpu, players: players.map((p) => ({ ...p, name: p.name.trim() })) } : settings);
    };

    return (
        <div className={`panel ${isBattle ? 'panel-wide' : 'panel-narrow'}`}>
            <div className="panel-head">
                <button type="button" className="icon-button" onClick={onBack} aria-label={t('config.back')} title={t('config.back')}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                </button>
                <div>
                    <p className="panel-kicker">{game.name}</p>
                    <h1 className="h-title">{t('config.title')}</h1>
                </div>
            </div>

            {isBattle && (
                <div className="config-tabs" role="tablist">
                    {[0, 1, 2].map((i) => (
                        <button key={i} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'is-active' : ''} onClick={() => setTab(i)}>
                            <span className="config-tab-n">{i + 1}</span>
                            {t(`config.tab${i}`)}
                        </button>
                    ))}
                </div>
            )}

            <ol className={`steps ${isBattle ? 'is-tabbed' : ''}`}>
                {isBattle && tab === 0 && (
                    <li className="step">
                        <h2 className="step-title">{t('config.opponent')}</h2>
                        <div className="choice-row choice-row-2" role="radiogroup" aria-label={t('config.opponent')}>
                            <button type="button" role="radio" aria-checked={cpu === null} className={`choice ${cpu === null ? 'is-active' : ''}`} onClick={() => setCpu(null)}>
                                <img className="choice-icon" src={icon('vs-friend')} alt="" />
                                <span className="choice-small">{t('config.opponent.friend')}</span>
                            </button>
                            <button type="button" role="radio" aria-checked={cpu !== null} className={`choice ${cpu !== null ? 'is-active' : ''}`} onClick={() => setCpu(cpu ?? 'medium')}>
                                <img className="choice-icon" src={icon('vs-cpu')} alt="" />
                                <span className="choice-small">{t('config.opponent.cpu')}</span>
                            </button>
                        </div>
                        {cpu !== null && (
                            <div className="chips cpu-levels" role="radiogroup" aria-label={t('config.cpuLevel')}>
                                <span className="player-label">{t('config.cpuLevel')}</span>
                                {Object.keys(CPU_LEVELS).map((id) => (
                                    <button key={id} type="button" role="radio" aria-checked={cpu === id} className={`chip ${cpu === id ? 'is-active' : ''}`} onClick={() => setCpu(id)}>
                                        {t(`level.${id}`)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </li>
                )}
                {isBattle && tab === 0 && (
                    <li className="step">
                        <h2 className="step-title">{t('config.players')}</h2>
                        <div className="player-row">
                            {[0, 1].map((index) => (
                                <PlayerEditor key={index} index={index} cpu={index === 1 && cpu !== null} player={players[index]} onChange={(value) => setPlayer(index, value)} />
                            ))}
                        </div>
                    </li>
                )}
                <li className="step" hidden={isBattle && tab !== 1}>
                    <h2 className="step-title">{t('config.step1')}</h2>
                    <div className="choice-row" role="radiogroup" aria-label={t('config.step1')}>
                        {Object.entries(LEVELS).map(([id, { seconds }]) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={level === id}
                                className={`choice ${level === id ? 'is-active' : ''}`}
                                onClick={() => setLevel(id)}
                            >
                                <span className="choice-big">{seconds} s</span>
                                <span className="choice-small">{t(`level.${id}`)}</span>
                            </button>
                        ))}
                    </div>
                </li>

                <li className="step" hidden={isBattle && tab !== 1}>
                    <h2 className="step-title">{t('config.step2')}</h2>
                    <div className="stepper">
                        <button
                            type="button"
                            className="icon-button"
                            onClick={() => setSequenceLength((n) => Math.max(MIN_LENGTH, n - 1))}
                            disabled={sequenceLength <= MIN_LENGTH}
                            aria-label={t('config.less')}
                        >
                            <i className="fa-solid fa-minus" aria-hidden="true"></i>
                        </button>
                        <div className="stepper-value" aria-live="polite">
                            <span className="stepper-number">{sequenceLength}</span>
                            <span className="stepper-dots" aria-hidden="true">
                                {Array.from({ length: MAX_LENGTH }, (_, i) => (
                                    <span key={i} className={i < sequenceLength ? 'on' : ''} />
                                ))}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="icon-button"
                            onClick={() => setSequenceLength((n) => Math.min(MAX_LENGTH, n + 1))}
                            disabled={sequenceLength >= MAX_LENGTH}
                            aria-label={t('config.more')}
                        >
                            <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        </button>
                        <span className="text-soft small">{t('config.step2Hint')}</span>
                    </div>
                </li>

                <li className="step" hidden={isBattle && tab !== 1}>
                    <h2 className="step-title">{t('config.step3')}</h2>
                    <div className="choice-row" role="radiogroup" aria-label={t('config.step3')}>
                        {Object.entries(THEMES).map(([id, data]) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={theme === id}
                                className={`choice ${theme === id ? 'is-active' : ''}`}
                                onClick={() => setTheme(id)}
                            >
                                <span className="choice-emojis" aria-hidden="true">{data.items.slice(0, 3).join('')}</span>
                                <span className="choice-small">{t(`theme.${id}`)}</span>
                            </button>
                        ))}
                    </div>
                </li>
                {isBattle && tab === 2 && (
                    <li className="step">
                        <h2 className="step-title">{t('config.view')}</h2>
                        <div className="choice-row choice-row-2" role="radiogroup" aria-label={t('config.view')}>
                            {['2d', '3d'].map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="radio"
                                    aria-checked={view === id}
                                    className={`choice ${view === id ? 'is-active' : ''}`}
                                    onClick={() => setView(id)}
                                >
                                    <span className="choice-big">{id.toUpperCase()}</span>
                                    <span className="choice-small">{t(`config.view.${id}`)}</span>
                                </button>
                            ))}
                        </div>
                    </li>
                )}
                {isBattle && tab === 2 && (
                    <li className="step">
                        <h2 className="step-title">{t('config.duel')}</h2>
                        <div className="choice-row choice-row-2" role="radiogroup" aria-label={t('config.duel')}>
                            {[true, false].map((on) => (
                                <button
                                    key={String(on)}
                                    type="button"
                                    role="radio"
                                    aria-checked={duel === on}
                                    className={`choice ${duel === on ? 'is-active' : ''}`}
                                    onClick={() => setDuel(on)}
                                >
                                    <span className="choice-emojis" aria-hidden="true">{on ? '🌵🤠' : '🥊'}</span>
                                    <span className="choice-small">{t(on ? 'config.duel.on' : 'config.duel.off')}</span>
                                </button>
                            ))}
                        </div>
                    </li>
                )}
            </ol>

            {isBattle ? (
                <div className="config-foot">
                    <button type="button" className="btn-mz" onClick={() => setTab(tab - 1)} disabled={tab === 0}>
                        {t('config.prev')}
                    </button>
                    {tab < TABS - 1 && (
                        <button type="button" className="btn-mz" onClick={() => setTab(tab + 1)}>
                            {t('config.next')}
                        </button>
                    )}
                    {/* Le combat peut être lancé depuis n'importe quel onglet */}
                    <button type="button" className="btn-mz btn-mz-sun config-start" onClick={start}>
                        {t('config.startBattle')}
                    </button>
                </div>
            ) : (
                <button type="button" className="btn-mz btn-mz-sun btn-mz-large w-100" onClick={start}>
                    {t('config.start')}
                </button>
            )}
        </div>
    );
}
