import { useI18n } from '../i18n/context';

export default function GameOver({ result, onReplay, onSettings, onHome }) {
    const { t } = useI18n();
    const { history, score, best, isNewBest } = result;

    const tries = (n) => (n === 1 ? t('results.tries.one') : t('results.tries.many', { n }));

    return (
        <div className="panel panel-narrow results">
            <div className="score-block">
                <h1 className="h-title">{t('results.title')}</h1>
                <p className="score-number">
                    {score}<span className="score-unit">%</span>
                </p>
                <p className="score-record">
                    {isNewBest ? t('results.newBest') : t('results.best', { n: best })}
                </p>
            </div>

            <ul className="round-list">
                {history.map((r) => (
                    <li key={r.round}>
                        <span className="fw-semibold">{t('results.round', { n: r.round })}</span>
                        <span>{t('results.detail', { t: r.time, a: tries(r.attempts) })}</span>
                    </li>
                ))}
            </ul>
            <p className="text-soft small">{t('results.rule')}</p>

            <div className="results-actions">
                <button type="button" className="btn-mz btn-mz-sun btn-mz-large" onClick={onReplay}>
                    {t('results.replay')}
                </button>
                <button type="button" className="btn-mz" onClick={onSettings}>
                    {t('results.settings')}
                </button>
                <button type="button" className="btn-mz btn-mz-plain" onClick={onHome}>
                    {t('results.home')}
                </button>
            </div>
        </div>
    );
}
