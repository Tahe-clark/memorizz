import { GAMES } from '../data/games';
import { useI18n } from '../i18n/context';
import { Podium3D } from './Arena3D';
import Confetti from './Confetti';
import ResultShell from './ResultShell';
import Stage3D from './Stage3D';

// Fin de Battle : le podium en 3D (le gagnant danse sous les confettis), puis les manches gagnées.
export default function BattleOver({ result, players, onRematch, onSettings, onHome }) {
    const { t } = useI18n();
    const { winner, wins } = result;
    const loser = 1 - winner;
    const won = (n) => (n === 1 ? t('battleOver.round.one') : t('battleOver.round.many', { n }));

    return (
        <ResultShell
            game={GAMES.find((g) => g.id === 'battle')}
            kicker={t('battleOver.title')}
            title={t('battleOver.wins', { name: players[winner].name })}
            hero={(
                <div className="podium-stage">
                    <Confetti count={70} loop />
                    <Stage3D mode="podium" players={players} winner={winner} fallback={<Podium3D players={players} winner={winner} />} />
                </div>
            )}
            rows={[winner, loser].map((p, i) => ({
                icon: i === 0 ? 'fa-trophy' : 'fa-medal',
                tone: i === 0 ? 'gold' : null,
                label: `${i + 1}. ${players[p].name}`,
                value: won(wins[p]),
            }))}
            primary={{ label: t('battleOver.rematch'), icon: 'fa-hand-fist', onClick: onRematch }}
            onSettings={onSettings}
            onHome={onHome}
        />
    );
}
