import { useI18n } from '../i18n/context';

// Anneau du temps de mémorisation : il se vide, et les 3 dernières secondes
// passent au rouge et battent comme un cœur.
export default function MemoTimer({ countdown, seconds }) {
    const { t } = useI18n();
    const ratio = seconds ? countdown / seconds : 0;
    const urgent = countdown <= 3;
    const r = 26;
    const c = 2 * Math.PI * r;
    return (
        <div className={`memo-timer ${urgent ? 'is-urgent' : ''}`} role="timer" aria-label={t('board.timeLeft', { s: countdown })}>
            <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r={r} className="memo-timer-track" />
                <circle cx="32" cy="32" r={r} className="memo-timer-fill" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} />
            </svg>
            <span key={countdown} className="memo-timer-n">{countdown}</span>
        </div>
    );
}
