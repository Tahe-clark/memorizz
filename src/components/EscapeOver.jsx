import { GAMES } from '../data/games';
import { useI18n } from '../i18n/context';
import ResultShell, { ScoreRing } from './ResultShell';

// Fin d'Escape : score moyen, record, et le détail de chaque maison.
export default function EscapeOver({ result, onReplay, onSettings, onHome }) {
    const { t } = useI18n();
    const { history, score, best, isNewBest } = result;
    const escaped = history.filter((r) => r.escaped).length;

    return (
        <ResultShell
            game={GAMES.find((g) => g.id === 'escape')}
            kicker="Escape"
            title={escaped === history.length ? t('escape.over.perfect') : t('escape.over.title')}
            hero={<ScoreRing score={score} />}
            badge={isNewBest ? { gold: true, text: t('results.newBest') } : { text: t('results.best', { n: best }) }}
            note={t('escape.over.summary', { n: escaped, total: history.length })}
            rows={history.map((r) => ({
                icon: r.escaped ? 'fa-door-open' : 'fa-skull',
                tone: r.escaped ? 'good' : 'bad',
                label: t('escape.over.house', { n: r.round }),
                value: r.escaped ? t('escape.over.detail', { m: r.moves, b: r.bumps, s: r.score }) : t('escape.over.caught'),
            }))}
            rule={t('escape.over.rule')}
            primary={{ label: t('results.replay'), onClick: onReplay }}
            onSettings={onSettings}
            onHome={onHome}
        />
    );
}
