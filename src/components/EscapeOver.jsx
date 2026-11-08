import { useI18n } from '../i18n/context';

// Résultats d'Escape : score moyen, record, et le détail de chaque maison.
export default function EscapeOver({ result, onReplay, onSettings, onHome }) {
    const { t } = useI18n();
    const { history, score, best, isNewBest } = result;
    const escaped = history.filter((r) => r.escaped).length;

    return (
        <div className="panel panel-narrow results">
            <div className="score-block">
                <h1 className="h-title">{escaped === history.length ? t('escape.over.perfect') : t('escape.over.title')}</h1>
                <p className="score-number">
                    {score}<span className="score-unit">%</span>
                </p>
                <p className="score-record">{isNewBest ? t('results.newBest') : t('results.best', { n: best })}</p>
                <p className="text-soft">{t('escape.over.summary', { n: escaped, total: history.length })}</p>
            </div>

            <ul className="round-list">
                {history.map((r) => (
                    <li key={r.round}>
                        <span className="fw-semibold">{r.escaped ? '🚪' : '👹'} {t('escape.over.house', { n: r.round })}</span>
                        <span>{r.escaped ? t('escape.over.detail', { m: r.moves, b: r.bumps, s: r.score }) : t('escape.over.caught')}</span>
                    </li>
                ))}
            </ul>
            <p className="text-soft small">{t('escape.over.rule')}</p>

            <div className="results-actions">
                <button type="button" className="btn-mz btn-mz-sun btn-mz-large" onClick={onReplay}>{t('results.replay')}</button>
                <button type="button" className="btn-mz" onClick={onSettings}>{t('results.settings')}</button>
                <button type="button" className="btn-mz btn-mz-plain" onClick={onHome}>{t('results.home')}</button>
            </div>
        </div>
    );
}
