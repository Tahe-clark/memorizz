import { useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import { useI18n } from '../i18n/context';
import Tile from './Tile';

export default function GameBoard({ config, onGameFinished, onQuit }) {
    const { t } = useI18n();
    const game = useGame({ ...config, onGameFinished });
    const { phase, equation, feedback } = game;
    const solved = feedback === 'success';

    // Raccourcis clavier : Entrée pour passer la mémorisation, 1 à 4 pour répondre.
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('button') && e.key === 'Enter') return; // laisse le bouton gérer
            if (phase === 'memorize' && e.key === 'Enter') game.skipMemorize();
            if (phase === 'solve') {
                const index = Number(e.key) - 1;
                if (index >= 0 && index < game.options.length) game.handleAnswer(game.options[index]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase, game]);

    const itemMark = <span className="eq-emoji">{equation.item}</span>;

    return (
        <div className="panel panel-wide board">
            <div className="board-top">
                <div className="round-info">
                    <span className="round-pips" aria-hidden="true">
                        {Array.from({ length: game.totalRounds }, (_, i) => (
                            <span key={i} className={i < game.currentRound - (solved ? 0 : 1) ? 'done' : i === game.currentRound - 1 ? 'now' : ''} />
                        ))}
                    </span>
                    <span className="round-label">{t('board.round', { n: game.currentRound, total: game.totalRounds })}</span>
                </div>
                <button type="button" className="icon-button" onClick={onQuit} aria-label={t('board.quit')} title={t('board.quit')}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <h1 className="h-title board-title">
                {phase === 'memorize' ? t('board.memorizeTitle') : t('board.solveTitle')}
            </h1>

            <div className="sequence" key={game.currentRound}>
                {game.sequence.map((item, index) => (
                    <Tile
                        key={index}
                        item={item}
                        position={index + 1}
                        hidden={phase === 'solve' && !(solved && index + 1 === equation.answerPosition)}
                        highlight={solved && index + 1 === equation.answerPosition}
                        label={t('board.pos', { n: index + 1 })}
                        hiddenLabel={t('board.hidden', { n: index + 1 })}
                    />
                ))}
            </div>

            {phase === 'memorize' ? (
                <div className="memorize-foot">
                    <p className="text-soft text-center mb-0">{t('board.memorizeSub')}</p>
                    <div className="timer" role="timer" aria-live="off">
                        <div className="timer-track">
                            <div className="timer-fill" style={{ width: `${(game.countdown / game.seconds) * 100}%` }} />
                        </div>
                        <span className="timer-label">{t('board.timeLeft', { s: game.countdown })}</span>
                    </div>
                    <button type="button" className="btn-mz btn-mz-ink" onClick={game.skipMemorize}>
                        {t('board.ready')}
                    </button>
                </div>
            ) : (
                <div className="solve">
                    <div className="equation" aria-label={`${equation.item} ${equation.op} ${equation.value}`}>
                        <span className="eq-part">
                            {equation.op === '+' ? <>{itemMark} + {equation.value}</> : <>{itemMark} − {equation.value}</>}
                        </span>
                        <span className="eq-equals">=</span>
                        <span className={`eq-answer ${solved ? 'is-solved' : ''}`}>
                            {solved ? equation.answer : '?'}
                        </span>
                    </div>

                    <p className="hint">
                        {t(equation.op === '+' ? 'board.hintPlus' : 'board.hintMinus', { item: equation.item, v: equation.value })}
                    </p>

                    <div className="options">
                        {game.options.map((opt, index) => {
                            const wrong = game.wrongPicks.includes(opt);
                            const right = solved && opt === equation.answer;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    className={`option ${wrong ? 'is-wrong' : ''} ${right ? 'is-right' : ''}`}
                                    onClick={() => game.handleAnswer(opt)}
                                    disabled={wrong || solved}
                                >
                                    <span className="option-key" aria-hidden="true">{index + 1}</span>
                                    <span className="option-value">{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="solve-foot">
                        <p className={`feedback ${feedback ? `is-${feedback}` : ''}`} aria-live="polite">
                            {feedback === 'success' && t('board.success', { n: equation.answerPosition })}
                            {feedback === 'fail' && t('board.fail')}
                        </p>
                        <p className="text-soft small mb-0">
                            {t('board.attempt', { n: game.attempts })}
                            <span className="d-none d-md-inline">. {t('board.keys')}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
