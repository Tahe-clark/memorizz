import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { CPU_LEVELS, roundsToWin } from '../hooks/useBattle';
import { LEVELS, MAX_ROUNDS } from '../utils/wordswap';
import { LEVEL_ICONS } from '../data/icons';
import { ConfigShell, Counter, Row, Section, Segmented, SequenceSettings, Toggle } from './ConfigParts';
import PlayerCard3D from './PlayerCard3D';

// Le compteur est maintenant dans ConfigParts ; on le réexporte pour les anciens imports.
export { Counter };

export default function GameConfig({ game, initialConfig, onStart, onBack }) {
    const { t } = useI18n();
    const [level, setLevel] = useState(initialConfig.level);
    const [sequenceLength, setSequenceLength] = useState(initialConfig.sequenceLength);
    const [theme, setTheme] = useState(initialConfig.theme);
    const [emojis, setEmojis] = useState(initialConfig.emojis ?? 1); // un nombre, ou 'random'
    const [lastEmojis, setLastEmojis] = useState(initialConfig.emojis === 'random' ? 1 : initialConfig.emojis ?? 1);
    const [rounds, setRounds] = useState(initialConfig.rounds ?? 3);
    const isRandom = emojis === 'random';
    // On peut remplacer de 1 chiffre jusqu'à toute la séquence.
    const emojiCount = Math.min(isRandom ? lastEmojis : emojis, sequenceLength);
    const isBattle = game.players === 2;
    const [players, setPlayers] = useState(initialConfig.players);

    const setPlayer = (index, value) => setPlayers((list) => list.map((p, i) => (i === index ? value : p)));

    const [duel, setDuel] = useState(initialConfig.duel ?? true);
    const [cpu, setCpu] = useState(initialConfig.cpu ?? null); // null = un ami, sinon niveau de l'ordinateur
    // Battle a beaucoup de réglages : ils sont répartis sur trois onglets pour éviter de défiler.
    const [tab, setTab] = useState(0);
    const TABS = 3;
    const icon = (name) => `${import.meta.env.BASE_URL}icons/${name}.png`;

    const start = () => {
        const settings = { level, sequenceLength, theme, emojis: isRandom ? 'random' : emojiCount, rounds };
        onStart(isBattle ? { ...settings, duel, cpu, players: players.map((p) => ({ ...p, name: p.name.trim() })) } : settings);
    };

    const yes = (v) => (v ? t('config.sum.on') : t('config.sum.off'));
    const summary = [
        [t('config.sum.time'), `${t(`level.${level}`)} · ${LEVELS[level].seconds} s`],
        [t('config.sum.sequence'), t('config.sum.seqValue', { n: sequenceLength, e: isRandom ? '?' : emojiCount })],
        [t('config.step3'), t(`theme.${theme}`)],
        [t('config.rounds'), String(rounds)],
    ];
    if (isBattle) {
        summary.unshift([t('config.opponent'), cpu === null ? t('config.opponent.friendShort') : `${t('config.opponent.cpu')} · ${t(`level.${cpu}`)}`]);
        summary.push([t('config.duel'), yes(duel)]);
    }

    const tabs = isBattle && (
        <div className="config-tabs" role="tablist">
            {[0, 1, 2].map((i) => (
                <button key={i} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'is-active' : ''} onClick={() => setTab(i)}>
                    <span className="config-tab-n">{i + 1}</span>
                    {t(`config.tab${i}`)}
                </button>
            ))}
        </div>
    );
    const footer = isBattle && (
        <div className="config-foot">
            <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={() => setTab(tab - 1)} disabled={tab === 0}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> {t('config.prev')}
            </button>
            {tab < TABS - 1 && (
                <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={() => setTab(tab + 1)}>
                    {t('config.next')} <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </button>
            )}
        </div>
    );

    return (
        <ConfigShell
            game={game}
            summary={summary}
            startLabel={isBattle ? t('config.startBattle') : rounds === 1 ? t('config.start1') : t('config.start', { n: rounds })}
            onStart={start}
            onBack={onBack}
            tabs={tabs}
            footer={footer}
        >
            {isBattle && tab === 0 && (
                <>
                    <Section title={t('config.opponent')} icon="fa-user-group">
                        <Row label={t('config.opponent.vs')} stack>
                            <Segmented
                                label={t('config.opponent')}
                                value={cpu === null ? 'friend' : 'cpu'}
                                onChange={(id) => setCpu(id === 'friend' ? null : cpu ?? 'easy')}
                                options={[
                                    { id: 'friend', art: <img src={icon('vs-friend')} alt="" />, label: t('config.opponent.friendShort'), sub: t('config.opponent.friendSub') },
                                    { id: 'cpu', art: <img src={icon('vs-cpu')} alt="" />, label: t('config.opponent.cpu'), sub: t('config.opponent.cpuSub') },
                                ]}
                            />
                        </Row>
                        {cpu !== null && (
                            <Row label={t('config.cpuLevel')} stack>
                                <Segmented label={t('config.cpuLevel')} value={cpu} onChange={setCpu} options={Object.keys(CPU_LEVELS).map((id) => ({ id, icon: LEVEL_ICONS[id], label: t(`level.${id}`) }))} />
                            </Row>
                        )}
                    </Section>
                    <section className="cfg-section">
                        <h2 className="cfg-section-title"><i className="fa-solid fa-shirt" aria-hidden="true"></i>{t('config.players')}</h2>
                        <div className="player-row">
                            {[0, 1].map((index) => (
                                <PlayerCard3D key={index} index={index} cpu={index === 1 && cpu !== null} player={players[index]} onChange={(value) => setPlayer(index, value)} />
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
                <Section title={t(isBattle ? 'config.section.fight' : 'config.section.game')} icon={isBattle ? 'fa-hand-fist' : 'fa-flag-checkered'}>
                    {isBattle && (
                        <Row label={t('config.duel')} hint={t(duel ? 'config.duel.on' : 'config.duel.off')}>
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
        </ConfigShell>
    );
}
