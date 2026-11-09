import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { CPU_LEVELS, roundsToWin } from '../hooks/useBattle';
import { MAX_ROUNDS } from '../utils/wordswap';
import { Counter, Row, Section, Segmented, SequenceSettings, Toggle } from './ConfigParts';
import PlayerEditor from './PlayerEditor';

// Le compteur est maintenant dans ConfigParts ; on le réexporte pour les anciens imports.
export { Counter };

export default function GameConfig({ game, initialConfig, onStart, onBack }) {
    const { t } = useI18n();
    const [level, setLevel] = useState(initialConfig.level);
    const [sequenceLength, setSequenceLength] = useState(initialConfig.sequenceLength);
    const [theme, setTheme] = useState(initialConfig.theme);
    const [emojis, setEmojis] = useState(initialConfig.emojis ?? 2); // un nombre, ou 'random'
    const [lastEmojis, setLastEmojis] = useState(initialConfig.emojis === 'random' ? 2 : initialConfig.emojis ?? 2);
    const [rounds, setRounds] = useState(initialConfig.rounds ?? 3);
    const isRandom = emojis === 'random';
    // On peut remplacer de 1 chiffre jusqu'à toute la séquence.
    const emojiCount = Math.min(isRandom ? lastEmojis : emojis, sequenceLength);
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
        const settings = { level, sequenceLength, theme, emojis: isRandom ? 'random' : emojiCount, rounds };
        onStart(isBattle ? { ...settings, view, duel, cpu, players: players.map((p) => ({ ...p, name: p.name.trim() })) } : settings);
    };

    return (
        <div className={`panel cfg-panel ${isBattle ? 'panel-wide' : 'panel-narrow'}`}>
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

            <div className="cfg">
                {isBattle && tab === 0 && (
                    <>
                        <Section title={t('config.opponent')}>
                            <Row label={t('config.opponent.vs')}>
                                <Segmented
                                    label={t('config.opponent')}
                                    value={cpu === null ? 'friend' : 'cpu'}
                                    onChange={(id) => setCpu(id === 'friend' ? null : cpu ?? 'medium')}
                                    options={[
                                        { id: 'friend', icon: <img src={icon('vs-friend')} alt="" />, label: t('config.opponent.friendShort') },
                                        { id: 'cpu', icon: <img src={icon('vs-cpu')} alt="" />, label: t('config.opponent.cpu') },
                                    ]}
                                />
                            </Row>
                            {cpu !== null && (
                                <Row label={t('config.cpuLevel')}>
                                    <Segmented label={t('config.cpuLevel')} value={cpu} onChange={setCpu} options={Object.keys(CPU_LEVELS).map((id) => ({ id, label: t(`level.${id}`) }))} />
                                </Row>
                            )}
                        </Section>
                        <section className="cfg-section">
                            <h2 className="cfg-section-title">{t('config.players')}</h2>
                            <div className="player-row">
                                {[0, 1].map((index) => (
                                    <PlayerEditor key={index} index={index} cpu={index === 1 && cpu !== null} player={players[index]} onChange={(value) => setPlayer(index, value)} />
                                ))}
                            </div>
                        </section>
                    </>
                )}
                {(!isBattle || tab === 1) && (
                    <SequenceSettings
                        level={level} setLevel={setLevel}
                        sequenceLength={sequenceLength} setSequenceLength={setSequenceLength}
                        emojis={emojis} setEmojis={setEmojis} lastEmojis={lastEmojis} setLastEmojis={setLastEmojis}
                        theme={theme} setTheme={setTheme}
                    />
                )}
                {(!isBattle || tab === 2) && (
                    <Section title={t(isBattle ? 'config.section.fight' : 'config.section.game')}>
                        {isBattle && (
                            <Row label={t('config.view')} hint={t(`config.view.${view}`)}>
                                <Segmented label={t('config.view')} value={view} onChange={setView} options={[{ id: '2d', label: '2D' }, { id: '3d', label: '3D' }]} />
                            </Row>
                        )}
                        {isBattle && (
                            <Row label={`🌵 ${t('config.duel')}`} hint={t(duel ? 'config.duel.on' : 'config.duel.off')}>
                                <Toggle label={t('config.duel')} checked={duel} onChange={setDuel} />
                            </Row>
                        )}
                        <Row
                            label={t('config.rounds')}
                            hint={isBattle ? `${rounds === 1 ? t('config.roundsWin1') : t('config.roundsWin', { n: roundsToWin(rounds) })}${rounds > 1 && rounds % 2 === 0 ? ` ${t('config.roundsTie')}` : ''}` : null}
                        >
                            <Counter value={rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} label={t('config.rounds')} />
                        </Row>
                    </Section>
                )}
            </div>

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
                    {rounds === 1 ? t('config.start1') : t('config.start', { n: rounds })}
                </button>
            )}
        </div>
    );
}
