import { GAMES } from '../data/games';
import { useI18n } from '../i18n/context';
import ResultShell, { ScoreRing } from './ResultShell';

// Fin de WordSwap Calc : score, record et détail de chaque manche.
export default function GameOver({ result, onReplay, onSettings, onHome }) {
    const { t } = useI18n();
    const { history, score, best, isNewBest } = result;
    const tries = (n) => (n === 1 ? t('results.tries.one') : t('results.tries.many', { n }));

    return (
        <ResultShell
            game={GAMES.find((g) => g.id === 'wordswap')}
            kicker="WordSwap Calc"
            title={t('results.title')}
            hero={<ScoreRing score={score} />}
            badge={isNewBest ? { gold: true, text: t('results.newBest') } : { text: t('results.best', { n: best }) }}
            rows={history.map((r) => ({
                icon: r.attempts === 1 ? 'fa-circle-check' : 'fa-circle-exclamation',
                tone: r.attempts === 1 ? 'good' : null,
                label: t('results.round', { n: r.round }),
                value: t('results.detail', { t: r.time, a: tries(r.attempts) }),
            }))}
            rule={t('results.rule')}
            primary={{ label: t('results.replay'), onClick: onReplay }}
            onSettings={onSettings}
            onHome={onHome}
        />
    );
}
