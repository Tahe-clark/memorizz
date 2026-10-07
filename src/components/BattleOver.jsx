import { useI18n } from '../i18n/context';
import { Podium3D } from './Arena3D';
import { AvatarFigure } from './Avatar';
import Confetti from './Confetti';

export default function BattleOver({ result, players, view, onRematch, onSettings, onHome }) {
    const { t } = useI18n();
    const { winner, wins } = result;
    const loser = 1 - winner;

    const step = (player, rank) => (
        <div className={`podium-place rank-${rank}`}>
            <AvatarFigure
                player={players[player]}
                mood={rank === 1 ? 'happy' : 'sad'}
                flip={rank === 1}
                className={rank === 1 ? `is-emoting emote-${players[player].emote}` : ''}
            />
            <div className="podium-step" style={{ '--step-color': players[player].color }}>
                <span className="podium-rank">{rank}</span>
                <span className="podium-name">{players[player].name}</span>
                <span className="podium-score">
                    {wins[player] === 1 ? t('battleOver.round.one') : t('battleOver.round.many', { n: wins[player] })}
                </span>
            </div>
        </div>
    );

    return (
        <div className="panel panel-narrow results battle-over">
            <Confetti count={90} loop />
            <h1 className="h-title text-center">{t('battleOver.wins', { name: players[winner].name })}</h1>

            {view === '3d' ? (
                <>
                    <div className="podium-stage"><Podium3D players={players} winner={winner} /></div>
                    <ul className="round-list">
                        {[winner, loser].map((player, i) => (
                            <li key={player}>
                                <span className="fw-semibold">{i + 1}. {players[player].name}</span>
                                <span>{wins[player] === 1 ? t('battleOver.round.one') : t('battleOver.round.many', { n: wins[player] })}</span>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <div className="podium" role="list" aria-label={t('battleOver.title')}>
                    {step(loser, 2)}
                    {step(winner, 1)}
                </div>
            )}

            <div className="results-actions">
                <button type="button" className="btn-mz btn-mz-sun btn-mz-large" onClick={onRematch}>
                    {t('battleOver.rematch')}
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
