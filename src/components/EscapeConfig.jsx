import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { MONSTER_MS, SIZES } from '../utils/escape';
import { LEVELS, MAX_ROUNDS } from '../utils/wordswap';
import { Counter, Row, Section, Segmented, SequenceSettings } from './ConfigParts';

// Réglages d'Escape : ceux de WordSwap Calc pour la séquence à mémoriser (temps,
// longueur, émojis, thème), puis la maison (taille, vitesse du monstre) et la partie.
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
        <div className="panel cfg-panel panel-narrow">
            <div className="panel-head">
                <button type="button" className="icon-button" onClick={onBack} aria-label={t('config.back')} title={t('config.back')}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                </button>
                <div>
                    <p className="panel-kicker">{game.name}</p>
                    <h1 className="h-title">{t('config.title')}</h1>
                </div>
            </div>
            <details className="cfg-rules">
                <summary>{t('escape.howto')}</summary>
                <p>{t('escape.rules')}</p>
            </details>

            <div className="cfg">
                <SequenceSettings
                    level={level} setLevel={setLevel}
                    sequenceLength={sequenceLength} setSequenceLength={setSequenceLength}
                    emojis={emojis} setEmojis={setEmojis} lastEmojis={lastEmojis} setLastEmojis={setLastEmojis}
                    theme={theme} setTheme={setTheme}
                />
                <Section title={t('config.section.house')}>
                    <Row label={t('escape.cfg.size')} hint={`${t(`escape.size.${size}`)} · ${t('escape.cfg.sizeHint')}`}>
                        <Segmented
                            label={t('escape.cfg.size')}
                            value={size}
                            onChange={setSize}
                            options={Object.keys(SIZES).map((id) => ({ id, label: SIZES[id].join('×') }))}
                        />
                    </Row>
                    <Row label={t('escape.cfg.monster')}>
                        <Segmented
                            label={t('escape.cfg.monster')}
                            value={monster}
                            onChange={setMonster}
                            options={Object.keys(MONSTER_MS).map((id) => ({ id, icon: { slow: '🐌', normal: '👹', fast: '⚡' }[id], label: t(`escape.speed.${id}`) }))}
                        />
                    </Row>
                </Section>
                <Section title={t('config.section.game')}>
                    <Row label={t('config.rounds')}>
                        <Counter value={rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} label={t('config.rounds')} />
                    </Row>
                    <Row label={t('config.viewShort')} hint={t(`escape.view.${view}`)}>
                        <Segmented label={t('config.viewShort')} value={view} onChange={setView} options={[{ id: '2d', label: '2D' }, { id: '3d', label: '3D' }]} />
                    </Row>
                </Section>
            </div>

            <button type="button" className="btn-mz btn-mz-sun btn-mz-large w-100" onClick={start}>
                {t('escape.cfg.start')}
            </button>
        </div>
    );
}
