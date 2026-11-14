import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { MONSTER_MS, SIZES } from '../utils/escape';
import { LEVELS, MAX_ROUNDS } from '../utils/wordswap';
import { ConfigShell, Counter, Row, Section, Segmented, SequenceSettings } from './ConfigParts';

// Réglages d'Escape : ceux de WordSwap Calc pour la séquence à mémoriser (temps,
// longueur, émojis, thème), puis la maison (taille, vitesse du monstre) et la partie.
export default function EscapeConfig({ game, initialConfig, onStart, onBack }) {
    const { t } = useI18n();
    const [level, setLevel] = useState(LEVELS[initialConfig.level] ? initialConfig.level : 'easy');
    const [sequenceLength, setSequenceLength] = useState(initialConfig.sequenceLength ?? 5);
    const [emojis, setEmojis] = useState(initialConfig.emojis ?? 1);
    const [lastEmojis, setLastEmojis] = useState(initialConfig.emojis === 'random' ? 1 : initialConfig.emojis ?? 1);
    const [theme, setTheme] = useState(initialConfig.theme ?? 'animals');
    const [size, setSize] = useState(initialConfig.size ?? 'small');
    const [monster, setMonster] = useState(initialConfig.monster ?? 'slow');
    const [rounds, setRounds] = useState(initialConfig.rounds ?? 3);
    const isRandom = emojis === 'random';
    const emojiCount = Math.min(isRandom ? lastEmojis : emojis, sequenceLength);

    const start = () => onStart({ level, sequenceLength, emojis: isRandom ? 'random' : emojiCount, theme, size, monster, rounds });

    const summary = [
        [t('config.sum.time'), `${t(`level.${level}`)} · ${LEVELS[level].seconds} s`],
        [t('config.sum.sequence'), t('config.sum.seqValue', { n: sequenceLength, e: isRandom ? '?' : emojiCount })],
        [t('config.step3'), t(`theme.${theme}`)],
        [t('escape.cfg.size'), `${t(`escape.size.${size}`)} · ${SIZES[size].join('×')}`],
        [t('escape.cfg.monster'), t(`escape.speed.${monster}`)],
        [t('config.rounds'), String(rounds)],
    ];
    // Petit plan de la maison pour chaque taille
    const plan = (id) => {
        const [cols, rows] = SIZES[id];
        return <span className="mini-plan" style={{ '--cols': cols }}>{Array.from({ length: cols * rows }, (_, i) => <span key={i} />)}</span>;
    };

    return (
        <ConfigShell
            game={game}
            summary={summary}
            startLabel={t('escape.cfg.start')}
            onStart={start}
            onBack={onBack}
            intro={(
                <details className="cfg-rules">
                    <summary>{t('escape.howto')}</summary>
                    <p>{t('escape.rules')}</p>
                </details>
            )}
        >
            <SequenceSettings
                level={level} setLevel={setLevel}
                sequenceLength={sequenceLength} setSequenceLength={setSequenceLength}
                emojis={emojis} setEmojis={setEmojis} lastEmojis={lastEmojis} setLastEmojis={setLastEmojis}
                theme={theme} setTheme={setTheme}
            />
            <Section title={t('config.section.house')} icon="fa-house-chimney-crack">
                <Row label={t('escape.cfg.size')} hint={t('escape.cfg.sizeHint')} stack>
                    <Segmented
                        label={t('escape.cfg.size')}
                        value={size}
                        onChange={setSize}
                        options={Object.keys(SIZES).map((id) => ({ id, art: plan(id), label: t(`escape.size.${id}`), sub: SIZES[id].join('×') }))}
                    />
                </Row>
                <Row label={t('escape.cfg.monster')} stack>
                    <Segmented
                        label={t('escape.cfg.monster')}
                        value={monster}
                        onChange={setMonster}
                        options={Object.keys(MONSTER_MS).map((id) => ({ id, icon: { slow: 'fa-person-walking', normal: 'fa-person-running', fast: 'fa-bolt' }[id], label: t(`escape.speed.${id}`) }))}
                    />
                </Row>
            </Section>
            <Section title={t('config.section.game')} icon="fa-flag-checkered">
                <Row label={t('config.rounds')}>
                    <Counter value={rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} label={t('config.rounds')} />
                </Row>
            </Section>
        </ConfigShell>
    );
}
